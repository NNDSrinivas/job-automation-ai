# Celery Configuration for Background Job Processing
"""
This module configures Celery for handling background tasks
including job applications, scraping, and other async operations.
"""

from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Redis configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Create Celery app
celery_app = Celery(
    'job_automation',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'tasks.application_tasks',
        'tasks.scraping_tasks',
        'tasks.notification_tasks'
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task routing
    task_routes={
        'tasks.application_tasks.*': {'queue': 'applications'},
        'tasks.scraping_tasks.*': {'queue': 'scraping'},
        'tasks.notification_tasks.*': {'queue': 'notifications'},
    },

    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,

    # Task result expiration
    result_expires=3600,

    # Retry configuration
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,

    # Rate limiting
    task_default_rate_limit='10/m',  # 10 tasks per minute

    # Task time limits
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes

    # Beat schedule for periodic tasks
    beat_schedule={
        'refresh-job-listings': {
            'task': 'tasks.scraping_tasks.refresh_job_listings',
            'schedule': 300.0,  # Every 5 minutes
        },
        'cleanup-old-jobs': {
            'task': 'tasks.scraping_tasks.cleanup_old_jobs',
            'schedule': 3600.0,  # Every hour
        },
        'update-application-status': {
            'task': 'tasks.application_tasks.update_application_status',
            'schedule': 900.0,  # Every 15 minutes
        },
    },
)

# Queue configuration
CELERY_QUEUES = {
    'applications': {
        'routing_key': 'applications',
        'priority': 10
    },
    'scraping': {
        'routing_key': 'scraping',
        'priority': 5
    },
    'notifications': {
        'routing_key': 'notifications',
        'priority': 8
    }
}

if __name__ == '__main__':
    celery_app.start()
