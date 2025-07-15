from celery import Celery
from sqlalchemy.orm import sessionmaker
import logging
from datetime import datetime, timedelta
from typing import List, Dict
import asyncio
import json

# Import your existing modules
from db import SessionLocal
from models import User, Job, JobApplication, JobPortalCredential, QuestionnaireAnswer, AutomationSetting
from job_scraper import JobBoardScraper
from auto_applier import AutoApplier
from jd_matcher import match_jd
from credential_encryption import credential_encryption
from websocket_manager import websocket_manager
from celery_config import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(name='tasks.automated_job_application')
def automated_job_application(user_id: int):
    """
    Automated job application task that runs in the background
    """
    try:
        logger.info(f"Starting automated job application for user {user_id}")

        db = SessionLocal()

        # Get user and settings
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return

        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == user_id,
            AutomationSetting.is_active == True
        ).first()

        if not settings:
            logger.error(f"No active automation settings for user {user_id}")
            return

        # Get job portal credentials
        credentials = db.query(JobPortalCredential).filter(
            JobPortalCredential.user_id == user_id,
            JobPortalCredential.is_active == True
        ).all()

        if not credentials:
            logger.error(f"No active credentials for user {user_id}")
            return

        # Get questionnaire answers
        answers = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.user_id == user_id
        ).all()
        questionnaire_data = {answer.question_key: answer.answer for answer in answers}

        # Check how many applications were made today
        today = datetime.utcnow().date()
        today_applications = db.query(JobApplication).filter(
            JobApplication.user_id == user_id,
            JobApplication.applied_at >= today,
            JobApplication.applied_at < today + timedelta(days=1)
        ).count()

        max_applications = settings.max_applications_per_day
        remaining_applications = max_applications - today_applications

        if remaining_applications <= 0:
            logger.info(f"User {user_id} has reached daily application limit")
            return

        # Initialize scraper and applier
        scraper = JobBoardScraper()
        applier = AutoApplier()

        # Scrape jobs from enabled platforms
        all_jobs = []
        for cred in credentials:
            if cred.platform in settings.enabled_platforms:
                try:
                    # Decrypt credentials
                    password = credential_encryption.decrypt_password(cred.encrypted_password)

                    # Build search parameters
                    search_params = {
                        'keywords': ' '.join(settings.keywords_include),
                        'locations': settings.preferred_locations,
                        'job_types': settings.job_types,
                        'experience_levels': settings.experience_levels,
                        'salary_min': settings.salary_range_min,
                        'salary_max': settings.salary_range_max
                    }

                    # Scrape jobs based on platform
                    if cred.platform == 'indeed':
                        jobs = scraper.scrape_indeed(
                            search_params.get('keywords', ''),
                            ','.join(search_params.get('locations', [])),
                            min(remaining_applications * 2, 50)  # Get more jobs than needed for filtering
                        )
                    elif cred.platform == 'linkedin':
                        jobs = scraper.scrape_linkedin(
                            search_params.get('keywords', ''),
                            ','.join(search_params.get('locations', [])),
                            min(remaining_applications * 2, 50)
                        )
                    elif cred.platform == 'glassdoor':
                        jobs = scraper.scrape_glassdoor(
                            search_params.get('keywords', ''),
                            ','.join(search_params.get('locations', [])),
                            min(remaining_applications * 2, 50)
                        )
                    else:
                        continue

                    all_jobs.extend(jobs)

                except Exception as e:
                    logger.error(f"Error scraping {cred.platform} for user {user_id}: {str(e)}")
                    continue

        if not all_jobs:
            logger.info(f"No jobs found for user {user_id}")
            return

        # Filter and match jobs
        suitable_jobs = []
        for job in all_jobs:
            try:
                # Check if job contains excluded keywords
                job_text = f"{job.get('title', '')} {job.get('description', '')}".lower()
                if any(keyword.lower() in job_text for keyword in settings.keywords_exclude):
                    continue

                # Check if already applied
                existing_application = db.query(JobApplication).filter(
                    JobApplication.user_id == user_id,
                    JobApplication.job_id == job.get('id')
                ).first()

                if existing_application:
                    continue

                # Match job against user profile
                match_score = match_jd(job.get('description', ''), user.id)

                if match_score >= settings.match_threshold:
                    suitable_jobs.append({
                        'job': job,
                        'match_score': match_score
                    })

            except Exception as e:
                logger.error(f"Error matching job for user {user_id}: {str(e)}")
                continue

        # Sort by match score and take top applications
        suitable_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        jobs_to_apply = suitable_jobs[:remaining_applications]

        # Apply to jobs
        successful_applications = 0
        failed_applications = 0

        for job_data in jobs_to_apply:
            try:
                job = job_data['job']
                match_score = job_data['match_score']

                # Get platform credentials
                platform_cred = next(
                    (cred for cred in credentials if cred.platform == job.get('platform')),
                    None
                )

                if not platform_cred:
                    continue

                # Decrypt credentials
                password = credential_encryption.decrypt_password(platform_cred.encrypted_password)

                # Apply to job
                application_result = applier.apply_to_job(
                    job=job,
                    user_profile={
                        'username': platform_cred.username,
                        'password': password,
                        'questionnaire_answers': questionnaire_data,
                        'user_data': {
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'email': user.email,
                            'phone': user.phone,
                            'linkedin_url': user.linkedin_url,
                            'experience_years': user.experience_years
                        }
                    },
                    match_score=match_score
                )

                # Save application record
                job_application = JobApplication(
                    user_id=user_id,
                    job_id=job.get('id'),
                    status='applied' if application_result.get('success') else 'failed',
                    applied_successfully=application_result.get('success', False),
                    application_data=json.dumps(application_result),
                    error_message=application_result.get('error')
                )

                db.add(job_application)

                if application_result.get('success'):
                    successful_applications += 1

                    # Send WebSocket notification
                    asyncio.create_task(websocket_manager.send_to_user(
                        user_id,
                        {
                            'type': 'application_success',
                            'job_title': job.get('title'),
                            'company': job.get('company'),
                            'match_score': match_score,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                    ))
                else:
                    failed_applications += 1

                    # Send WebSocket notification
                    asyncio.create_task(websocket_manager.send_to_user(
                        user_id,
                        {
                            'type': 'application_failed',
                            'job_title': job.get('title'),
                            'company': job.get('company'),
                            'error': application_result.get('error', 'Unknown error'),
                            'timestamp': datetime.utcnow().isoformat()
                        }
                    ))

                db.commit()

            except Exception as e:
                logger.error(f"Error applying to job for user {user_id}: {str(e)}")
                failed_applications += 1
                db.rollback()
                continue

        # Send final summary
        asyncio.create_task(websocket_manager.send_to_user(
            user_id,
            {
                'type': 'automation_summary',
                'successful_applications': successful_applications,
                'failed_applications': failed_applications,
                'total_jobs_found': len(all_jobs),
                'suitable_jobs': len(suitable_jobs),
                'timestamp': datetime.utcnow().isoformat()
            }
        ))

        logger.info(f"Automation completed for user {user_id}: {successful_applications} successful, {failed_applications} failed")

    except Exception as e:
        logger.error(f"Error in automated job application for user {user_id}: {str(e)}")
    finally:
        db.close()
