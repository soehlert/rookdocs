import hashlib
import hmac
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.config import settings
from app.models.repo import Repository, RepositoryCreate
from app.services.repo_manager import RepoManager, get_repo_manager

router = APIRouter()

def clone_repo_task(repo_id: str, manager: RepoManager):
    repo = manager.get_repo(repo_id)
    if repo:
        manager.git_service.clone_repository(repo)
        manager.update_repo(repo)

def sync_repo_task(repo_id: str, manager: RepoManager):
    repo = manager.get_repo(repo_id)
    if repo:
        manager.git_service.sync_repository(repo)
        manager.update_repo(repo)

@router.get("/", response_model=list[Repository])
async def list_repos(manager: RepoManager = Depends(get_repo_manager)):
    return manager.list_repos()

@router.post("/", response_model=Repository)
async def add_repo(
    repo_create: RepositoryCreate, 
    background_tasks: BackgroundTasks,
    manager: RepoManager = Depends(get_repo_manager)
):
    repo = await manager.add_repo(repo_create)
    background_tasks.add_task(clone_repo_task, repo.id, manager)
    return repo

@router.delete("/{repo_id}")
async def delete_repo(repo_id: str, manager: RepoManager = Depends(get_repo_manager)):
    manager.remove_repo(repo_id)
    return {"status": "deleted"}

@router.post("/{repo_id}/sync")
async def sync_repo(
    repo_id: str, 
    background_tasks: BackgroundTasks,
    manager: RepoManager = Depends(get_repo_manager)
):
    repo = manager.get_repo(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    repo.status = "syncing"
    manager.update_repo(repo)
    background_tasks.add_task(sync_repo_task, repo_id, manager)
    return repo

@router.post("/webhooks/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    manager: RepoManager = Depends(get_repo_manager)
):
    print(f"Incoming GitHub Webhook: {request.headers.get('X-GitHub-Event')}")
    # Verify signature if secret is set
    if settings.webhook_secret:
        signature = request.headers.get("X-Hub-Signature-256")
        if not signature:
            raise HTTPException(status_code=401, detail="Signature missing")
        
        body = await request.body()
        expected_signature = "sha256=" + hmac.new(
            settings.webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    
    # Check if it's a push event
    event_type = request.headers.get("X-GitHub-Event")
    if event_type != "push":
        return {"status": "ignored", "reason": f"Event type {event_type} not handled"}
        
    repo_url = payload.get("repository", {}).get("clone_url")
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository clone_url not found in payload")
        
    repo = manager.find_by_url(repo_url)
    if not repo:
        # Silently ignore if repo is not found in our system
        return {"status": "ignored", "reason": "Repository not tracked"}
        
    # Trigger sync
    repo.status = "syncing"
    manager.update_repo(repo)
    background_tasks.add_task(sync_repo_task, repo.id, manager)
    
    return {"status": "success", "repo_name": repo.name}

