import logging

from app.celery_app import celery_app



logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.sync_all_repos")
def sync_all_repos() -> dict:
    """Sync all repos with status 'ready'. Called periodically by Celery beat."""
    from app.services.repo_manager import repo_manager

    synced = []
    failed = []

    for repo in repo_manager.list_repos():
        if repo.status != "ready":
            logger.debug("Skipping repo %s (status=%s)", repo.name, repo.status)
            continue

        result = repo_manager.git_service.sync_repository(repo)
        repo_manager.update_repo(result)

        if result.status == "ready":
            logger.info("Synced repo: %s", repo.name)
            synced.append(repo.name)
        else:
            logger.warning("Failed to sync repo: %s", repo.name)
            failed.append(repo.name)

    return {"synced": synced, "failed": failed}
