import os
import shutil

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Mock storage path for tests
TEST_REPO_PATH = "./test_repos"
os.makedirs(TEST_REPO_PATH, exist_ok=True)

@pytest.fixture(autouse=True)
def setup_teardown():
    # Setup
    from app.config import settings
    original_path = settings.repo_storage_path
    original_config = settings.config_file_path
    
    settings.repo_storage_path = TEST_REPO_PATH
    settings.config_file_path = os.path.join(TEST_REPO_PATH, "config.json")
    
    # Reload manager to pick up new config path
    from app.services.repo_manager import repo_manager
    repo_manager.config_file = settings.config_file_path
    repo_manager.git_service.storage_path = settings.repo_storage_path
    repo_manager._repos = {}
    
    # Mock git operations
    original_clone = repo_manager.git_service.clone_repository
    original_sync = repo_manager.git_service.sync_repository
    repo_manager.git_service.clone_repository = lambda repo: repo
    repo_manager.git_service.sync_repository = lambda repo: repo

    repo_manager.load_config()

    from app.services.file_service import file_service
    file_service.storage_path = settings.repo_storage_path

    yield

    # Restore mocks (though process ends anyway)
    repo_manager.git_service.clone_repository = original_clone
    repo_manager.git_service.sync_repository = original_sync

    # Teardown
    if os.path.exists(TEST_REPO_PATH):
        shutil.rmtree(TEST_REPO_PATH)
    settings.repo_storage_path = original_path
    settings.config_file_path = original_config

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to RookDocs API"}

def test_create_repo():
    response = client.post(
        "/api/repos/",
        json={"name": "Test Repo", "url": "https://github.com/example/test.git"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Repo"
    assert data["status"] == "pending"
    assert "id" in data

def test_list_repos():
    client.post(
        "/api/repos/",
        json={"name": "Repo 1", "url": "https://github.com/example/1.git"}
    )
    response = client.get("/api/repos/")
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_delete_repo():
    create_response = client.post(
        "/api/repos/",
        json={"name": "To Delete", "url": "https://github.com/example/delete.git"}
    )
    repo_id = create_response.json()["id"]
    
    del_response = client.delete(f"/api/repos/{repo_id}")
    assert del_response.status_code == 200
    
    list_response = client.get("/api/repos/")
    assert len(list_response.json()) == 0

def test_search_empty():
    response = client.get("/api/content/search?q=xyz")
    assert response.status_code == 200
    assert response.json() == []

