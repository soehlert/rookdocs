
from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.file_service import FileService, get_file_service

router = APIRouter()

from app.services.repo_manager import RepoManager, get_repo_manager

@router.get("/tree")
async def get_tree(
    service: FileService = Depends(get_file_service),
    repo_manager: RepoManager = Depends(get_repo_manager)
):
    repos = repo_manager.list_repos()
    return service.get_tree(repos)

@router.get("/content")
async def get_content(path: str = Query(...), service: FileService = Depends(get_file_service)):
    try:
        content = service.get_content(path)
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path")

@router.get("/search")
async def search(q: str = Query(...), service: FileService = Depends(get_file_service)):
    if len(q) < 3:
        return []
    return service.search(q)
