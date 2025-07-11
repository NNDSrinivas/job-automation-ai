# Background Job Manager
"""
This module provides a high-level interface for managing background jobs
and integrating Celery tasks with the main FastAPI application.
"""

from celery_config import celery_app
from tasks.application_tasks import apply_to_job, bulk_apply_jobs, generate_application_report
from tasks.scraping_tasks import scrape_jobs_for_user, refresh_job_listings, deep_scrape_platform
from tasks.notification_tasks import send_application_update, send_job_matches, send_daily_summary
from typing import Dict, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BackgroundJobManager:
    """
    High-level interface for managing background jobs
    """

    def __init__(self):
        self.celery_app = celery_app

    # Application Jobs
    def submit_job_application(self, user_id: int, job_id: int, application_data: Dict) -> str:
        """
        Submit a background job to apply to a single job
        Returns task ID for tracking
        """
        try:
            task = apply_to_job.delay(user_id, job_id, application_data)
            logger.info(f"Submitted application job {task.id} for user {user_id}, job {job_id}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting application job: {str(e)}")
            raise

    def submit_bulk_applications(self, user_id: int, job_ids: List[int], application_settings: Dict) -> str:
        """
        Submit a background job for bulk applications
        Returns task ID for tracking
        """
        try:
            task = bulk_apply_jobs.delay(user_id, job_ids, application_settings)
            logger.info(f"Submitted bulk application job {task.id} for user {user_id}, {len(job_ids)} jobs")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting bulk application job: {str(e)}")
            raise

    def generate_user_report(self, user_id: int, date_range: int = 30) -> str:
        """
        Generate application report for user
        Returns task ID for tracking
        """
        try:
            task = generate_application_report.delay(user_id, date_range)
            logger.info(f"Submitted report generation job {task.id} for user {user_id}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting report job: {str(e)}")
            raise

    # Scraping Jobs
    def start_job_scraping(self, user_id: int, search_params: Dict) -> str:
        """
        Start background job scraping for user
        Returns task ID for tracking
        """
        try:
            task = scrape_jobs_for_user.delay(user_id, search_params)
            logger.info(f"Submitted scraping job {task.id} for user {user_id}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting scraping job: {str(e)}")
            raise

    def start_deep_scraping(self, platform: str, search_params: Dict, max_pages: int = 5) -> str:
        """
        Start deep scraping of specific platform
        Returns task ID for tracking
        """
        try:
            task = deep_scrape_platform.delay(platform, search_params, max_pages)
            logger.info(f"Submitted deep scraping job {task.id} for platform {platform}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting deep scraping job: {str(e)}")
            raise

    # Notification Jobs
    def send_application_notification(self, user_id: int, application_id: int, status: str) -> str:
        """
        Send application status notification
        Returns task ID for tracking
        """
        try:
            task = send_application_update.delay(user_id, application_id, status)
            logger.info(f"Submitted notification job {task.id}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting notification job: {str(e)}")
            raise

    def send_job_match_notification(self, user_id: int, job_ids: List[int]) -> str:
        """
        Send job matches notification
        Returns task ID for tracking
        """
        try:
            task = send_job_matches.delay(user_id, job_ids)
            logger.info(f"Submitted job matches notification {task.id}")
            return task.id
        except Exception as e:
            logger.error(f"Error submitting job matches notification: {str(e)}")
            raise

    # Task Management
    def get_task_status(self, task_id: str) -> Dict:
        """
        Get status and result of a background task
        """
        try:
            task = self.celery_app.AsyncResult(task_id)

            result = {
                'task_id': task_id,
                'status': task.status,
                'current': getattr(task.info, 'current', 0) if task.info else 0,
                'total': getattr(task.info, 'total', 1) if task.info else 1,
                'result': None,
                'error': None
            }

            if task.status == 'PENDING':
                result['message'] = 'Task is waiting to be processed'
            elif task.status == 'PROGRESS':
                result['message'] = task.info.get('status', 'In progress')
                result['progress'] = task.info.get('progress', 0)
            elif task.status == 'SUCCESS':
                result['message'] = 'Task completed successfully'
                result['result'] = task.result
                result['progress'] = 100
            elif task.status == 'FAILURE':
                result['message'] = 'Task failed'
                result['error'] = str(task.info)
                result['progress'] = 0

            return result

        except Exception as e:
            logger.error(f"Error getting task status: {str(e)}")
            return {
                'task_id': task_id,
                'status': 'ERROR',
                'error': str(e)
            }

    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a background task
        """
        try:
            self.celery_app.control.revoke(task_id, terminate=True)
            logger.info(f"Cancelled task {task_id}")
            return True
        except Exception as e:
            logger.error(f"Error cancelling task {task_id}: {str(e)}")
            return False

    def get_active_tasks(self) -> List[Dict]:
        """
        Get list of currently active tasks
        """
        try:
            active_tasks = self.celery_app.control.inspect().active()

            tasks = []
            for worker, task_list in active_tasks.items():
                for task in task_list:
                    tasks.append({
                        'task_id': task['id'],
                        'name': task['name'],
                        'worker': worker,
                        'args': task['args'],
                        'kwargs': task['kwargs'],
                        'started': task.get('time_start')
                    })

            return tasks

        except Exception as e:
            logger.error(f"Error getting active tasks: {str(e)}")
            return []

    def get_queue_status(self) -> Dict:
        """
        Get status of task queues
        """
        try:
            stats = self.celery_app.control.inspect().stats()
            reserved = self.celery_app.control.inspect().reserved()

            queue_info = {}
            for worker, worker_stats in stats.items():
                queue_info[worker] = {
                    'total_tasks': worker_stats.get('total', {}),
                    'reserved_tasks': len(reserved.get(worker, [])),
                    'pool_processes': worker_stats.get('pool', {}).get('processes', 0)
                }

            return queue_info

        except Exception as e:
            logger.error(f"Error getting queue status: {str(e)}")
            return {}

    def health_check(self) -> Dict:
        """
        Check health of Celery workers and Redis connection
        """
        try:
            # Check if workers are responding
            stats = self.celery_app.control.inspect().stats()

            if stats:
                worker_count = len(stats)
                worker_status = "healthy"
            else:
                worker_count = 0
                worker_status = "no_workers"

            # Test Redis connection
            redis_healthy = True
            try:
                from redis import Redis
                import os
                redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
                redis_client = Redis.from_url(redis_url)
                redis_client.ping()
            except Exception:
                redis_healthy = False

            return {
                'status': 'healthy' if worker_count > 0 and redis_healthy else 'unhealthy',
                'workers': {
                    'count': worker_count,
                    'status': worker_status
                },
                'redis': {
                    'status': 'healthy' if redis_healthy else 'unhealthy'
                },
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in health check: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

# Global instance
job_manager = BackgroundJobManager()
