"""
Advanced Job Scheduler for automated job hunting workflows
Handles periodic job scraping, application processing, and user notifications
"""

from celery import Celery
from celery.schedules import crontab
from celery_config import celery_app
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any
from db import SessionLocal
from models import User, Job, JobApplication
from tasks.scraping_tasks import scrape_jobs_for_user, refresh_job_listings
from tasks.application_tasks import apply_to_job, generate_application_report
from tasks.notification_tasks import send_daily_summary, send_job_matches

logger = logging.getLogger(__name__)

class JobScheduler:
    """Advanced job scheduler for automated workflows"""

    def __init__(self):
        self.celery_app = celery_app
        self.setup_periodic_tasks()

    def setup_periodic_tasks(self):
        """Configure periodic tasks for automated job hunting"""

        # Schedule periodic job scraping every 4 hours
        self.celery_app.conf.beat_schedule.update({
            'refresh-job-listings': {
                'task': 'tasks.scraping_tasks.refresh_job_listings',
                'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
                'args': (),
                'options': {'queue': 'scraping'}
            },

            # Generate daily application reports at 9 AM
            'daily-application-reports': {
                'task': 'tasks.application_tasks.generate_application_report',
                'schedule': crontab(hour=9, minute=0),  # 9:00 AM daily
                'args': (),
                'options': {'queue': 'applications'}
            },

            # Send daily summaries to users at 8 PM
            'daily-user-summaries': {
                'task': 'tasks.notification_tasks.send_daily_summary',
                'schedule': crontab(hour=20, minute=0),  # 8:00 PM daily
                'args': (),
                'options': {'queue': 'notifications'}
            },

            # Weekly job matching notifications on Mondays at 10 AM
            'weekly-job-matches': {
                'task': 'tasks.notification_tasks.send_job_matches',
                'schedule': crontab(hour=10, minute=0, day_of_week=1),  # Monday 10 AM
                'args': (),
                'options': {'queue': 'notifications'}
            },

            # Cleanup old jobs monthly
            'monthly-cleanup': {
                'task': 'tasks.scraping_tasks.cleanup_old_jobs',
                'schedule': crontab(hour=2, minute=0, day=1),  # 1st of month at 2 AM
                'args': (30,),  # Delete jobs older than 30 days
                'options': {'queue': 'scraping'}
            },

            # Auto-apply to matched jobs every 2 hours for eligible users
            'auto-apply-matched-jobs': {
                'task': 'advanced_scheduler.auto_apply_to_matched_jobs',
                'schedule': crontab(minute=0, hour='*/2'),  # Every 2 hours
                'args': (),
                'options': {'queue': 'applications'}
            },

            # Update job match scores daily at 6 AM
            'update-job-matches': {
                'task': 'advanced_scheduler.update_job_match_scores',
                'schedule': crontab(hour=6, minute=0),  # 6:00 AM daily
                'args': (),
                'options': {'queue': 'scraping'}
            },

            # Generate analytics reports weekly on Sundays
            'weekly-analytics': {
                'task': 'advanced_scheduler.generate_weekly_analytics',
                'schedule': crontab(hour=8, minute=0, day_of_week=0),  # Sunday 8 AM
                'args': (),
                'options': {'queue': 'notifications'}
            }
        })

        logger.info("Periodic tasks configured successfully")

# Register the scheduler tasks
@celery_app.task(bind=True, name='advanced_scheduler.auto_apply_to_matched_jobs')
def auto_apply_to_matched_jobs(self):
    """Automatically apply to highly matched jobs for users with auto-apply enabled"""
    try:
        db = SessionLocal()

        # Get users with auto-apply enabled
        auto_apply_users = db.query(User).join(User.enhanced_profile).filter(
            User.enhanced_profile.has(auto_apply_enabled=True)
        ).all()

        applied_count = 0

        for user in auto_apply_users:
            # Get highly matched jobs (score > 0.8) that haven't been applied to
            high_match_jobs = db.query(Job).outerjoin(JobApplication).filter(
                JobApplication.user_id.is_(None),  # Not applied to
                Job.match_score > 0.8,  # High match score
                Job.scraped_at >= datetime.utcnow() - timedelta(days=7)  # Recent jobs
            ).limit(5).all()  # Limit to 5 applications per run

            for job in high_match_jobs:
                # Check daily application limit
                today_applications = db.query(JobApplication).filter(
                    JobApplication.user_id == user.id,
                    JobApplication.applied_at >= datetime.utcnow().date()
                ).count()

                if today_applications < 10:  # Daily limit
                    # Submit application task
                    apply_to_job.delay(user.id, job.id, auto_apply=True)
                    applied_count += 1
                    logger.info(f"Auto-applied user {user.id} to job {job.id}")

        db.close()

        return {
            'status': 'completed',
            'applied_count': applied_count,
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Auto-apply task failed: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

@celery_app.task(bind=True, name='advanced_scheduler.update_job_match_scores')
def update_job_match_scores(self):
    """Update match scores for recent jobs based on user profiles"""
    try:
        from jd_matcher import match_jd

        db = SessionLocal()

        # Get recent jobs without match scores
        recent_jobs = db.query(Job).filter(
            Job.match_score.is_(None),
            Job.scraped_at >= datetime.utcnow() - timedelta(days=3)
        ).limit(100).all()

        updated_count = 0

        for job in recent_jobs:
            # Get all users to calculate match scores
            users = db.query(User).all()

            for user in users:
                if user.enhanced_profile:
                    # Create resume text from profile
                    resume_text = f"""
                    {user.enhanced_profile.first_name} {user.enhanced_profile.last_name}
                    Experience: {user.enhanced_profile.years_experience} years
                    Skills: {', '.join(user.enhanced_profile.technical_skills or [])}
                    Education: {user.enhanced_profile.highest_education}
                    Current Title: {user.enhanced_profile.current_title}
                    """

                    # Calculate match score
                    try:
                        match_score = match_jd(resume_text, job.description)

                        # Store match score (you might want a separate table for this)
                        if match_score > 0.5:  # Only store good matches
                            job.match_score = match_score
                            updated_count += 1

                    except Exception as e:
                        logger.warning(f"Failed to calculate match for job {job.id}: {e}")

        db.commit()
        db.close()

        return {
            'status': 'completed',
            'updated_count': updated_count,
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Match score update failed: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

@celery_app.task(bind=True, name='advanced_scheduler.generate_weekly_analytics')
def generate_weekly_analytics(self):
    """Generate comprehensive weekly analytics report"""
    try:
        from analytics_engine import AnalyticsEngine

        analytics = AnalyticsEngine()

        # Generate comprehensive weekly report
        week_start = datetime.utcnow() - timedelta(days=7)

        report = {
            'period': {
                'start': week_start.isoformat(),
                'end': datetime.utcnow().isoformat()
            },
            'metrics': analytics.get_comprehensive_metrics(),
            'top_performing_jobs': analytics.get_top_jobs_by_applications(),
            'user_activity': analytics.get_user_activity_summary(),
            'platform_performance': analytics.get_platform_performance(),
            'conversion_rates': analytics.get_conversion_metrics()
        }

        # Store report and send to admin users
        logger.info(f"Weekly analytics generated: {report['metrics']['total_users']} users, "
                   f"{report['metrics']['total_jobs']} jobs, "
                   f"{report['metrics']['total_applications']} applications")

        return {
            'status': 'completed',
            'report': report,
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Weekly analytics generation failed: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

@celery_app.task(bind=True, name='advanced_scheduler.smart_job_search')
def smart_job_search(self, user_id: int):
    """Intelligent job search based on user profile and preferences"""
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()

        if not user or not user.enhanced_profile:
            return {'error': 'User or profile not found'}

        profile = user.enhanced_profile

        # Generate smart search terms based on profile
        search_terms = []

        # Add current title and desired roles
        if profile.current_title:
            search_terms.append(profile.current_title)

        if profile.preferred_job_types:
            search_terms.extend([job_type.value for job_type in profile.preferred_job_types])

        # Add top technical skills
        if profile.technical_skills:
            search_terms.extend(profile.technical_skills[:3])  # Top 3 skills

        # Search parameters
        search_params = {
            'keywords': ' '.join(search_terms),
            'location': profile.preferred_locations[0] if profile.preferred_locations else 'Remote',
            'limit': 20
        }

        # Trigger job search
        task = scrape_jobs_for_user.delay(user_id, search_params)

        db.close()

        return {
            'status': 'initiated',
            'search_params': search_params,
            'task_id': task.id,
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Smart job search failed for user {user_id}: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=3)

# Initialize the scheduler
job_scheduler = JobScheduler()

# Export tasks for registration
__all__ = [
    'job_scheduler',
    'auto_apply_to_matched_jobs',
    'update_job_match_scores',
    'generate_weekly_analytics',
    'smart_job_search'
]
