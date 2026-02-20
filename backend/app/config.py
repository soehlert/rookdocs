import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "RookDocs"
    debug: bool = False
    repo_storage_path: str = "./repos"
    config_file_path: str = "./repos/config.json"
    # Webhook settings
    webhook_secret: str | None = None
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:9123"]

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure repo storage path exists
os.makedirs(settings.repo_storage_path, exist_ok=True)
