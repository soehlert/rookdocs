import logging

from celery import Celery

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "rookdocs",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "sync-external-repos": {
            "task": "app.tasks.sync_all_repos",
            "schedule": settings.repo_sync_interval_seconds,
        },
    },
)

# Autodiscover tasks from app/tasks.py
celery_app.autodiscover_tasks(["app"])
