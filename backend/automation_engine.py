"""
24/7 Job Application Automation Engine
This module handles the continuous job application process in the background.
"""
import asyncio
import logging
from datetime import datetime, time
from typing import List, Dict, Optional
import json
from sqlalchemy.orm import Session
from models import User, JobPortalCredential, AutomationSetting, QuestionnaireAnswer
from db import get_db_session
from advanced_job_scraper import AdvancedJobScraper
from auto_applier import AutoApplier

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self):
        self.is_running = False
        self.user_settings = {}
        self.active_users = set()
        self.scraper = AdvancedJobScraper()
        # Don't initialize AutoApplier here since it needs user_profile

    async def start_engine(self):
        """Start the 24/7 automation engine"""
        self.is_running = True
        logger.info("🚀 24/7 Job Application Automation Engine started")

        while self.is_running:
            try:
                await self.process_all_users()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error in automation engine: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying

    async def stop_engine(self):
        """Stop the automation engine"""
        self.is_running = False
        logger.info("🛑 24/7 Job Application Automation Engine stopped")

    async def process_all_users(self):
        """Process job applications for all active users"""
        db = get_db_session()

        try:
            # Get all users with automation enabled
            users = db.query(User).join(AutomationSetting).filter(
                AutomationSetting.auto_apply_enabled == True
            ).all()

            for user in users:
                if await self.should_process_user(user):
                    await self.process_user_applications(user, db)

        except Exception as e:
            logger.error(f"Error processing users: {e}")
        finally:
            db.close()

    async def should_process_user(self, user: User) -> bool:
        """Check if we should process applications for this user right now"""
        automation_setting = user.automation_setting
        if not automation_setting or not automation_setting.auto_apply_enabled:
            return False

        current_time = datetime.now().time()

        # Parse working hours
        start_time = time.fromisoformat(automation_setting.working_hours_start)
        end_time = time.fromisoformat(automation_setting.working_hours_end)

        # Check if current time is within working hours
        if not (start_time <= current_time <= end_time):
            return False

        # Check if weekends are enabled
        if not automation_setting.enable_weekends and datetime.now().weekday() >= 5:
            return False

        # Check daily application limit
        today_applications = self.get_today_applications_count(user.id)
        if today_applications >= automation_setting.max_applications_per_day:
            return False

        return True

    def get_today_applications_count(self, user_id: int) -> int:
        """Get the number of applications submitted today for a user"""
        # This would query the applications table to count today's applications
        # For now, return a mock value
        return 0

    async def process_user_applications(self, user: User, db: Session):
        """Process job applications for a specific user"""
        logger.info(f"🤖 Processing applications for user {user.id}")

        try:
            # Get user's connected portals
            portals = db.query(JobPortalCredential).filter(
                JobPortalCredential.user_id == user.id
            ).all()

            for portal in portals:
                await self.process_portal_applications(user, portal, db)

        except Exception as e:
            logger.error(f"Error processing applications for user {user.id}: {e}")

    async def process_portal_applications(self, user: User, portal: JobPortalCredential, db: Session):
        """Process applications for a specific portal"""
        try:
            # Search for new jobs
            jobs = await self.scraper.search_jobs(
                platform=portal.platform,
                user_profile=user,
                credentials=portal
            )

            # Filter jobs based on user preferences
            suitable_jobs = self.filter_suitable_jobs(jobs, user)

            # Apply to jobs
            for job in suitable_jobs[:5]:  # Limit to 5 applications per portal per cycle
                await self.apply_to_job(user, job, portal, db)

        except Exception as e:
            logger.error(f"Error processing {portal.platform} for user {user.id}: {e}")

    def filter_suitable_jobs(self, jobs: List[Dict], user: User) -> List[Dict]:
        """Filter jobs based on user preferences and criteria"""
        # This would implement sophisticated filtering logic
        # For now, return first few jobs
        return jobs[:10]

    async def apply_to_job(self, user: User, job: Dict, portal: JobPortalCredential, db: Session):
        """Apply to a specific job"""
        try:
            logger.info(f"📝 Applying to {job.get('title', 'Unknown Job')} at {job.get('company', 'Unknown Company')}")

            # Check if user has answered all required questions for this job
            questions_answered = self.check_questionnaire_completion(user.id, job, db)

            if not questions_answered:
                logger.info(f"⏳ Skipping job - questions not answered yet")
                return

            # Create AutoApplier for this user
            user_profile = {
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "email": user.email,
                "phone": "",  # Would need to be added to user profile
                "location": "",  # Would need to be added to user profile
            }
            applier = AutoApplier(user_profile)

            # Use the auto applier to submit application
            result = await applier.apply_to_job(
                job=job,
                user=user,
                portal=portal,
                questionnaire_answers=self.get_user_answers(user.id, job, db)
            )

            if result.get('success'):
                logger.info(f"✅ Successfully applied to {job.get('title')}")
                self.record_application(user.id, job, portal.platform, db)
            else:
                logger.warning(f"❌ Failed to apply to {job.get('title')}: {result.get('error')}")

        except Exception as e:
            logger.error(f"Error applying to job: {e}")

    def check_questionnaire_completion(self, user_id: int, job: Dict, db: Session) -> bool:
        """Check if user has answered all required questions for this job"""
        # This would check if the user has answered all AI-generated questions
        # For now, return True
        return True

    def get_user_answers(self, user_id: int, job: Dict, db: Session) -> Dict:
        """Get user's questionnaire answers for this job"""
        answers = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.user_id == user_id
        ).all()

        return {answer.question_id: answer.answer for answer in answers}

    def record_application(self, user_id: int, job: Dict, platform: str, db: Session):
        """Record the application in the database"""
        # This would create a new JobApplication record
        logger.info(f"📊 Recording application for user {user_id}")

    def get_engine_status(self) -> Dict:
        """Get current status of the automation engine"""
        return {
            "is_running": self.is_running,
            "active_users": len(self.active_users),
            "total_applications_today": self.get_total_applications_today(),
            "last_check": datetime.now().isoformat(),
            "uptime": self.get_uptime()
        }

    def get_total_applications_today(self) -> int:
        """Get total applications submitted today across all users"""
        # This would query the database for today's applications
        return 0

    def get_uptime(self) -> str:
        """Get engine uptime"""
        # This would calculate actual uptime
        return "24/7"

# Global automation engine instance
automation_engine = AutomationEngine()

async def start_automation_engine():
    """Start the automation engine"""
    await automation_engine.start_engine()

async def stop_automation_engine():
    """Stop the automation engine"""
    await automation_engine.stop_engine()

def get_automation_status():
    """Get automation engine status"""
    return automation_engine.get_engine_status()
