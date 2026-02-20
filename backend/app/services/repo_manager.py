
import json
import os
import uuid

from app.config import settings
from app.models.repo import Repository, RepositoryCreate
from app.services.git_service import GitService


class RepoManager:
    def __init__(self):
        self.config_file = settings.config_file_path
        self.git_service = GitService(settings.repo_storage_path)
        self._repos: dict[str, Repository] = {}
        self.load_config()

    def load_config(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file) as f:
                    data = json.load(f)
                    for repo_data in data:
                        repo = Repository(**repo_data)
                        self._repos[repo.id] = repo
            except Exception as e:
                print(f"Error loading config: {e}")
                self._repos = {}

    def save_config(self):
        data = [repo.model_dump(mode='json') for repo in self._repos.values()]
        try:
            with open(self.config_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def list_repos(self) -> list[Repository]:
        return list(self._repos.values())

    def get_repo(self, repo_id: str) -> Repository | None:
        return self._repos.get(repo_id)

    def find_by_url(self, url: str) -> Repository | None:
        """Find a repository by its git URL, normalizing common suffixes."""
        normalized_url = url.strip().rstrip('/')
        if normalized_url.endswith('.git'):
            normalized_url = normalized_url[:-4]
            
        for repo in self._repos.values():
            repo_url = str(repo.url).strip().rstrip('/')
            if repo_url.endswith('.git'):
                repo_url = repo_url[:-4]
            if repo_url == normalized_url:
                return repo
        return None

    async def add_repo(self, repo_create: RepositoryCreate) -> Repository:
        repo_id = str(uuid.uuid4())
        # Determine local path relative to storage
        local_path = os.path.join(settings.repo_storage_path, repo_id)
        
        repo = Repository(
            id=repo_id,
            name=repo_create.name,
            url=repo_create.url,
            local_path=local_path,
            status="pending"
        )
        
        self._repos[repo_id] = repo
        self.save_config()
        
        # Trigger async clone? For now synchronous or background task would be better
        # We will do synchronous for MVP execution simplicity, or use FastAPI BackgroundTasks in the route
        return repo

    def remove_repo(self, repo_id: str):
        if repo_id in self._repos:
            repo = self._repos[repo_id]
            self.git_service.delete_repository(repo.id)
            del self._repos[repo_id]
            self.save_config()

    def update_repo(self, repo: Repository):
        if repo.id in self._repos:
            self._repos[repo.id] = repo
            self.save_config()

repo_manager = RepoManager()

def get_repo_manager():
    return repo_manager
