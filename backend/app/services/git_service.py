import logging
import os
import shutil

import git

from app.models.repo import Repository

logger = logging.getLogger(__name__)

class GitService:
    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        os.makedirs(self.storage_path, exist_ok=True)

    def get_repo_path(self, repo_id: str) -> str:
        return os.path.join(self.storage_path, repo_id)

    def clone_repository(self, repo: Repository) -> Repository:
        repo_path = self.get_repo_path(repo.id)
        try:
            if os.path.exists(repo_path):
                # If directory exists and is a git repo, invalid state for "clone", but we can handle partials
                shutil.rmtree(repo_path)
            
            git.Repo.clone_from(str(repo.url), repo_path)
            repo.status = "ready"
            repo.local_path = repo_path
            return repo
        except Exception as e:
            logger.error(f"Error cloning repository {repo.url}: {e}")
            repo.status = "error"
            return repo

    def sync_repository(self, repo: Repository) -> Repository:
        repo_path = self.get_repo_path(repo.id)
        try:
            r = git.Repo(repo_path)
            # Force sync: fetch and reset hard to match remote
            r.remotes.origin.fetch()
            r.git.reset('--hard', 'origin/HEAD')
            
            repo.status = "ready"
            return repo
        except Exception as e:
             logger.error(f"Error syncing repository {repo.url}: {e}")
             repo.status = "error"
             return repo
    
    def delete_repository(self, repo_id: str):
        repo_path = self.get_repo_path(repo_id)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path)

git_service = None

def get_git_service():
    # In a real app we might inject settings here
    from app.config import settings
    global git_service
    if git_service is None:
        git_service = GitService(settings.repo_storage_path)
    return git_service
