# Scraping Tasks for Background Processing
"""
This module contains Celery tasks for background job scraping
and data collection from various job boards.
"""

from celery_config import celery_app
from job_scraper import JobBoardScraper
from models import Job, User
from db import get_db_session
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List
import asyncio

logger = logging.getLogger(__name__)

@celery_app.task(name='tasks.scraping_tasks.scrape_jobs_for_user')
def scrape_jobs_for_user(user_id: int, search_params: Dict):
    """
    Background task to scrape jobs based on user preferences
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        logger.info(f"Starting job scraping for User {user_id}")

        # Initialize scraper
        scraper = JobBoardScraper()

        # Get search parameters
        keywords = search_params.get('keywords', '')
        location = search_params.get('location', '')
        limit = search_params.get('limit', 50)

        # Run async scraping
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            jobs_data = loop.run_until_complete(
                scraper.search_all_platforms(keywords, location, limit)
            )
        finally:
            loop.close()

        # Save jobs to database
        saved_jobs = []
        for job_data in jobs_data:
            try:
                # Check if job already exists
                existing_job = session.query(Job).filter(
                    Job.url == job_data['url']
                ).first()

                if not existing_job:
                    job = Job(
                        title=job_data['title'],
                        company=job_data['company'],
                        location=job_data['location'],
                        description=job_data['description'],
                        url=job_data['url'],
                        platform=job_data['platform'],
                        salary=job_data.get('salary'),
                        job_type=job_data.get('job_type'),
                        posted_date=datetime.utcnow(),
                        scraped_at=datetime.utcnow(),
                        raw_data=json.dumps(job_data)
                    )
                    session.add(job)
                    saved_jobs.append(job_data)

            except Exception as e:
                logger.error(f"Error saving job: {str(e)}")
                continue

        session.commit()

        result = {
            'user_id': user_id,
            'scraped_jobs': len(jobs_data),
            'saved_jobs': len(saved_jobs),
            'search_params': search_params,
            'scraped_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Job scraping completed: {len(saved_jobs)} new jobs found")
        return result

    except Exception as e:
        logger.error(f"Job scraping task error: {str(e)}")
        raise

    finally:
        session.close()

@celery_app.task(name='tasks.scraping_tasks.refresh_job_listings')
def refresh_job_listings():
    """
    Periodic task to refresh job listings from all platforms
    """
    session = get_db_session()
    try:
        logger.info("Starting periodic job refresh")

        # Get common search terms from user preferences
        common_searches = [
            {'keywords': 'software engineer', 'location': 'Remote'},
            {'keywords': 'data scientist', 'location': 'Remote'},
            {'keywords': 'product manager', 'location': 'Remote'},
            {'keywords': 'frontend developer', 'location': 'Remote'},
            {'keywords': 'backend developer', 'location': 'Remote'},
        ]

        scraper = JobBoardScraper()
        total_new_jobs = 0

        for search in common_searches:
            try:
                # Run async scraping
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                try:
                    jobs_data = loop.run_until_complete(
                        scraper.search_all_platforms(
                            search['keywords'],
                            search['location'],
                            30  # Limit per search
                        )
                    )
                finally:
                    loop.close()

                # Save new jobs
                for job_data in jobs_data:
                    try:
                        existing_job = session.query(Job).filter(
                            Job.url == job_data['url']
                        ).first()

                        if not existing_job:
                            job = Job(
                                title=job_data['title'],
                                company=job_data['company'],
                                location=job_data['location'],
                                description=job_data['description'],
                                url=job_data['url'],
                                platform=job_data['platform'],
                                salary=job_data.get('salary'),
                                job_type=job_data.get('job_type'),
                                posted_date=datetime.utcnow(),
                                scraped_at=datetime.utcnow(),
                                raw_data=json.dumps(job_data)
                            )
                            session.add(job)
                            total_new_jobs += 1

                    except Exception as e:
                        logger.error(f"Error saving job during refresh: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Error in search refresh: {str(e)}")
                continue

        session.commit()

        result = {
            'total_new_jobs': total_new_jobs,
            'searches_performed': len(common_searches),
            'refreshed_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Job refresh completed: {total_new_jobs} new jobs added")
        return result

    except Exception as e:
        logger.error(f"Job refresh task error: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

@celery_app.task(name='tasks.scraping_tasks.cleanup_old_jobs')
def cleanup_old_jobs(days_old: int = 30):
    """
    Periodic task to clean up old job listings
    """
    session = get_db_session()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        # Delete old jobs
        old_jobs = session.query(Job).filter(
            Job.scraped_at < cutoff_date
        ).all()

        deleted_count = len(old_jobs)

        for job in old_jobs:
            session.delete(job)

        session.commit()

        result = {
            'deleted_jobs': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
            'cleaned_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Cleanup completed: {deleted_count} old jobs removed")
        return result

    except Exception as e:
        logger.error(f"Cleanup task error: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

@celery_app.task(name='tasks.scraping_tasks.deep_scrape_platform')
def deep_scrape_platform(platform: str, search_params: Dict, max_pages: int = 5):
    """
    Background task for deep scraping of a specific platform
    """
    session = get_db_session()
    try:
        logger.info(f"Starting deep scrape of {platform}")

        scraper = JobBoardScraper()
        all_jobs = []

        # Run platform-specific deep scraping
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if platform.lower() == 'indeed':
                jobs_data = loop.run_until_complete(
                    scraper.scrape_indeed_deep(search_params, max_pages)
                )
            elif platform.lower() == 'dice':
                jobs_data = loop.run_until_complete(
                    scraper.scrape_dice_deep(search_params, max_pages)
                )
            elif platform.lower() == 'linkedin':
                jobs_data = loop.run_until_complete(
                    scraper.scrape_linkedin_deep(search_params, max_pages)
                )
            else:
                raise ValueError(f"Unsupported platform: {platform}")

        finally:
            loop.close()

        # Save jobs with duplicate checking
        saved_count = 0
        for job_data in jobs_data:
            try:
                existing_job = session.query(Job).filter(
                    Job.url == job_data['url']
                ).first()

                if not existing_job:
                    job = Job(
                        title=job_data['title'],
                        company=job_data['company'],
                        location=job_data['location'],
                        description=job_data['description'],
                        url=job_data['url'],
                        platform=job_data['platform'],
                        salary=job_data.get('salary'),
                        job_type=job_data.get('job_type'),
                        posted_date=datetime.utcnow(),
                        scraped_at=datetime.utcnow(),
                        raw_data=json.dumps(job_data)
                    )
                    session.add(job)
                    saved_count += 1

            except Exception as e:
                logger.error(f"Error saving job from deep scrape: {str(e)}")
                continue

        session.commit()

        result = {
            'platform': platform,
            'total_scraped': len(jobs_data),
            'saved_count': saved_count,
            'search_params': search_params,
            'max_pages': max_pages,
            'completed_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Deep scrape of {platform} completed: {saved_count} new jobs")
        return result

    except Exception as e:
        logger.error(f"Deep scrape task error: {str(e)}")
        raise

    finally:
        session.close()
