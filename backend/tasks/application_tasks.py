# Application Tasks for Background Processing
"""
This module contains Celery tasks for handling job applications
in the background, including retry logic and status tracking.
"""

from celery import current_task
from celery_config import celery_app
from auto_applier import AutoApplier
from job_scraper import JobBoardScraper
from models import JobApplication, Job, User
from db import get_db_session
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List
import traceback

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='tasks.application_tasks.apply_to_job')
def apply_to_job(self, user_id: int, job_id: int, application_data: Dict):
    """
    Background task to apply to a single job
    """
    session = get_db_session()
    try:
        # Update task status
        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Starting application process', 'progress': 10}
        )

        # Get user and job data
        user = session.query(User).filter(User.id == user_id).first()
        job = session.query(Job).filter(Job.id == job_id).first()

        if not user or not job:
            raise ValueError(f"User {user_id} or Job {job_id} not found")

        logger.info(f"Starting application for User {user_id} to Job {job_id}")

        # Create application record
        application = JobApplication(
            user_id=user_id,
            job_id=job_id,
            status='in_progress',
            applied_at=datetime.utcnow(),
            application_data=json.dumps(application_data)
        )
        session.add(application)
        session.commit()

        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Application record created', 'progress': 20}
        )

        # Prepare user profile for auto applier
        user_profile = {
            'full_name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'phone': getattr(user, 'phone', ''),
            'resume_path': application_data.get('resume_path'),
            'cover_letter': application_data.get('cover_letter', ''),
            'linkedin_url': getattr(user, 'linkedin_url', ''),
            'skills': application_data.get('skills', []),
            'experience_years': getattr(user, 'experience_years', 0),
        }

        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Initializing auto applier', 'progress': 30}
        )

        # Initialize auto applier
        auto_applier = AutoApplier(user_profile)
        auto_applier.setup_browser(headless=True)

        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Applying to job', 'progress': 50}
        )

        # Apply to job based on platform
        platform = job.platform.lower()
        success = False
        error_message = None

        try:
            if platform == 'indeed':
                success = auto_applier.apply_indeed(job.url, user_profile)
            elif platform == 'dice':
                success = auto_applier.apply_dice(job.url, user_profile)
            elif platform == 'linkedin':
                success = auto_applier.apply_linkedin(job.url, user_profile)
            else:
                error_message = f"Unsupported platform: {platform}"

        except Exception as apply_error:
            error_message = str(apply_error)
            logger.error(f"Application error: {error_message}")

        finally:
            auto_applier.close_browser()

        current_task.update_state(
            state='PROGRESS',
            meta={'status': 'Updating application status', 'progress': 90}
        )

        # Update application status
        if success:
            application.status = 'applied'
            application.applied_successfully = True
            status_message = 'Successfully applied to job'
        else:
            application.status = 'failed'
            application.applied_successfully = False
            application.error_message = error_message
            status_message = f'Application failed: {error_message}'

        application.completed_at = datetime.utcnow()
        session.commit()

        logger.info(f"Application completed for User {user_id} to Job {job_id}: {status_message}")

        return {
            'success': success,
            'application_id': application.id,
            'job_title': job.title,
            'company': job.company,
            'status': application.status,
            'message': status_message,
            'applied_at': application.applied_at.isoformat(),
            'completed_at': application.completed_at.isoformat()
        }

    except Exception as e:
        error_msg = f"Task failed: {str(e)}"
        logger.error(f"Application task error: {error_msg}")
        logger.error(traceback.format_exc())

        # Update application status to failed
        if 'application' in locals():
            application.status = 'failed'
            application.error_message = error_msg
            application.completed_at = datetime.utcnow()
            session.commit()

        # Retry the task
        self.retry(countdown=60, max_retries=3, exc=e)

    finally:
        session.close()

@celery_app.task(bind=True, name='tasks.application_tasks.bulk_apply_jobs')
def bulk_apply_jobs(self, user_id: int, job_ids: List[int], application_settings: Dict):
    """
    Background task to apply to multiple jobs in sequence
    """
    session = get_db_session()
    try:
        logger.info(f"Starting bulk application for User {user_id} to {len(job_ids)} jobs")

        results = []
        total_jobs = len(job_ids)

        for i, job_id in enumerate(job_ids):
            try:
                current_task.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Processing job {i+1} of {total_jobs}',
                        'progress': int((i / total_jobs) * 100),
                        'current_job': job_id,
                        'completed': i,
                        'total': total_jobs
                    }
                )

                # Apply to individual job
                result = apply_to_job.delay(user_id, job_id, application_settings)
                job_result = result.get(timeout=600)  # 10 minute timeout per job
                results.append(job_result)

                # Add delay between applications to avoid detection
                import time
                time.sleep(30)  # 30 second delay between applications

            except Exception as job_error:
                logger.error(f"Failed to apply to job {job_id}: {str(job_error)}")
                results.append({
                    'success': False,
                    'job_id': job_id,
                    'error': str(job_error)
                })

        # Summary
        successful = sum(1 for r in results if r.get('success'))
        failed = len(results) - successful

        summary = {
            'total_jobs': total_jobs,
            'successful': successful,
            'failed': failed,
            'success_rate': (successful / total_jobs) * 100 if total_jobs > 0 else 0,
            'results': results,
            'completed_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Bulk application completed: {successful}/{total_jobs} successful")
        return summary

    except Exception as e:
        error_msg = f"Bulk application task failed: {str(e)}"
        logger.error(error_msg)
        self.retry(countdown=120, max_retries=2, exc=e)

    finally:
        session.close()

@celery_app.task(name='tasks.application_tasks.update_application_status')
def update_application_status():
    """
    Periodic task to check and update application statuses
    """
    session = get_db_session()
    try:
        # Get applications that need status updates
        pending_applications = session.query(JobApplication).filter(
            JobApplication.status.in_(['applied', 'in_progress']),
            JobApplication.applied_at >= datetime.utcnow() - timedelta(days=30)
        ).all()

        updated_count = 0
        for application in pending_applications:
            try:
                # Here you could implement logic to check application status
                # by scraping the job board or checking emails
                # For now, we'll just mark old in_progress as failed

                if (application.status == 'in_progress' and
                    application.applied_at < datetime.utcnow() - timedelta(hours=2)):
                    application.status = 'failed'
                    application.error_message = 'Application timed out'
                    updated_count += 1

            except Exception as e:
                logger.error(f"Error updating application {application.id}: {str(e)}")

        session.commit()
        logger.info(f"Updated {updated_count} application statuses")
        return {'updated_count': updated_count}

    except Exception as e:
        logger.error(f"Error in update_application_status task: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

@celery_app.task(name='tasks.application_tasks.generate_application_report')
def generate_application_report(user_id: int, date_range: int = 30):
    """
    Generate application report for a user
    """
    session = get_db_session()
    try:
        from datetime import timedelta

        start_date = datetime.utcnow() - timedelta(days=date_range)

        applications = session.query(JobApplication).filter(
            JobApplication.user_id == user_id,
            JobApplication.applied_at >= start_date
        ).all()

        report = {
            'user_id': user_id,
            'date_range': date_range,
            'total_applications': len(applications),
            'successful': sum(1 for a in applications if a.applied_successfully),
            'failed': sum(1 for a in applications if not a.applied_successfully),
            'pending': sum(1 for a in applications if a.status == 'in_progress'),
            'platforms': {},
            'generated_at': datetime.utcnow().isoformat()
        }

        # Platform breakdown
        for application in applications:
            job = session.query(Job).filter(Job.id == application.job_id).first()
            if job:
                platform = job.platform
                if platform not in report['platforms']:
                    report['platforms'][platform] = {'total': 0, 'successful': 0}
                report['platforms'][platform]['total'] += 1
                if application.applied_successfully:
                    report['platforms'][platform]['successful'] += 1

        return report

    except Exception as e:
        logger.error(f"Error generating application report: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()
