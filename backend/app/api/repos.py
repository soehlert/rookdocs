
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

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
