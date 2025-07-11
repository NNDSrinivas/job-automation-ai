# Notification Tasks for Background Processing
"""
This module contains Celery tasks for sending notifications
about job applications, new matches, and system updates.
"""

from celery_config import celery_app
from models import User, JobApplication, Job
from db import get_db_session
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, List
import os

logger = logging.getLogger(__name__)

@celery_app.task(name='tasks.notification_tasks.send_application_update')
def send_application_update(user_id: int, application_id: int, status: str):
    """
    Send notification when application status changes
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        application = session.query(JobApplication).filter(
            JobApplication.id == application_id
        ).first()

        if not user or not application:
            raise ValueError("User or application not found")

        job = session.query(Job).filter(Job.id == application.job_id).first()

        # Prepare notification content
        subject = f"Application Update: {job.title} at {job.company}"

        if status == 'applied':
            message = f"""
            Great news! Your application has been successfully submitted.

            Job Details:
            - Position: {job.title}
            - Company: {job.company}
            - Location: {job.location}
            - Applied: {application.applied_at}

            We'll continue monitoring this application for updates.
            """
        elif status == 'failed':
            message = f"""
            We encountered an issue with your application.

            Job Details:
            - Position: {job.title}
            - Company: {job.company}
            - Location: {job.location}

            Error: {application.error_message}

            Don't worry, you can try applying manually or we'll retry automatically.
            """
        else:
            message = f"""
            Your application status has been updated to: {status}

            Job Details:
            - Position: {job.title}
            - Company: {job.company}
            - Location: {job.location}
            """

        # Send email notification
        result = send_email_notification(
            user.email,
            subject,
            message
        )

        logger.info(f"Application update notification sent to {user.email}")
        return result

    except Exception as e:
        logger.error(f"Error sending application update: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

@celery_app.task(name='tasks.notification_tasks.send_job_matches')
def send_job_matches(user_id: int, job_ids: List[int]):
    """
    Send notification about new job matches
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        jobs = session.query(Job).filter(Job.id.in_(job_ids)).all()

        if not jobs:
            return {'message': 'No jobs to notify about'}

        subject = f"New Job Matches Found ({len(jobs)} positions)"

        job_list = ""
        for job in jobs:
            job_list += f"""
            - {job.title} at {job.company}
              Location: {job.location}
              Platform: {job.platform}
              URL: {job.url}
            """

        message = f"""
        We found {len(jobs)} new job matches based on your preferences!

        New Opportunities:
        {job_list}

        Log in to your dashboard to review these matches and apply.
        """

        result = send_email_notification(
            user.email,
            subject,
            message
        )

        logger.info(f"Job matches notification sent to {user.email}")
        return result

    except Exception as e:
        logger.error(f"Error sending job matches: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

@celery_app.task(name='tasks.notification_tasks.send_daily_summary')
def send_daily_summary(user_id: int):
    """
    Send daily summary of applications and new opportunities
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        yesterday = datetime.utcnow() - timedelta(days=1)

        # Get applications from last 24 hours
        recent_applications = session.query(JobApplication).filter(
            JobApplication.user_id == user_id,
            JobApplication.applied_at >= yesterday
        ).all()

        # Get new jobs from last 24 hours (that match user preferences)
        new_jobs = session.query(Job).filter(
            Job.scraped_at >= yesterday
        ).limit(5).all()  # Top 5 new jobs

        subject = "Daily Job Automation Summary"

        # Applications summary
        apps_summary = ""
        if recent_applications:
            successful = sum(1 for app in recent_applications if app.applied_successfully)
            failed = len(recent_applications) - successful

            apps_summary = f"""
            Applications in last 24 hours:
            - Total applications: {len(recent_applications)}
            - Successful: {successful}
            - Failed: {failed}
            """
        else:
            apps_summary = "No applications submitted in the last 24 hours."

        # New jobs summary
        jobs_summary = ""
        if new_jobs:
            jobs_summary = "New opportunities found:\n"
            for job in new_jobs:
                jobs_summary += f"- {job.title} at {job.company}\n"
        else:
            jobs_summary = "No new matching opportunities found."

        message = f"""
        Here's your daily job automation summary:

        {apps_summary}

        {jobs_summary}

        Visit your dashboard to see more details and manage your job search.
        """

        result = send_email_notification(
            user.email,
            subject,
            message
        )

        logger.info(f"Daily summary sent to {user.email}")
        return result

    except Exception as e:
        logger.error(f"Error sending daily summary: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()

def send_email_notification(email: str, subject: str, message: str) -> Dict:
    """
    Helper function to send email notifications
    """
    try:
        # Email configuration from environment
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        from_email = os.getenv('FROM_EMAIL', smtp_username)

        if not smtp_username or not smtp_password:
            logger.warning("Email credentials not configured, skipping notification")
            return {'status': 'skipped', 'reason': 'No email credentials'}

        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = email
        msg['Subject'] = subject

        # Add body
        msg.attach(MIMEText(message, 'plain'))

        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        return {
            'status': 'sent',
            'email': email,
            'subject': subject,
            'sent_at': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error sending email to {email}: {str(e)}")
        return {
            'status': 'failed',
            'email': email,
            'error': str(e)
        }

@celery_app.task(name='tasks.notification_tasks.send_weekly_report')
def send_weekly_report(user_id: int):
    """
    Send weekly report with analytics and insights
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        week_ago = datetime.utcnow() - timedelta(days=7)

        # Get week's applications
        weekly_applications = session.query(JobApplication).filter(
            JobApplication.user_id == user_id,
            JobApplication.applied_at >= week_ago
        ).all()

        # Calculate metrics
        total_apps = len(weekly_applications)
        successful_apps = sum(1 for app in weekly_applications if app.applied_successfully)
        success_rate = (successful_apps / total_apps * 100) if total_apps > 0 else 0

        # Platform breakdown
        platform_stats = {}
        for app in weekly_applications:
            job = session.query(Job).filter(Job.id == app.job_id).first()
            if job:
                platform = job.platform
                if platform not in platform_stats:
                    platform_stats[platform] = {'total': 0, 'successful': 0}
                platform_stats[platform]['total'] += 1
                if app.applied_successfully:
                    platform_stats[platform]['successful'] += 1

        subject = "Weekly Job Automation Report"

        platform_summary = ""
        for platform, stats in platform_stats.items():
            rate = (stats['successful'] / stats['total'] * 100) if stats['total'] > 0 else 0
            platform_summary += f"- {platform}: {stats['successful']}/{stats['total']} ({rate:.1f}%)\n"

        message = f"""
        Here's your weekly job automation report:

        Summary:
        - Total applications: {total_apps}
        - Successful applications: {successful_apps}
        - Success rate: {success_rate:.1f}%

        Platform Performance:
        {platform_summary}

        Keep up the great work! Your automated job search is making progress.
        """

        result = send_email_notification(
            user.email,
            subject,
            message
        )

        logger.info(f"Weekly report sent to {user.email}")
        return result

    except Exception as e:
        logger.error(f"Error sending weekly report: {str(e)}")
        return {'error': str(e)}

    finally:
        session.close()
