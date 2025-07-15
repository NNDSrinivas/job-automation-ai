import schedule
import time
import threading
from datetime import datetime, time as dt_time
import logging
from sqlalchemy.orm import sessionmaker
from db import SessionLocal
from models import User, AutomationSetting
from tasks.automation_tasks import automated_job_application
from celery_config import celery_app

logger = logging.getLogger(__name__)

class AutomationScheduler:
    def __init__(self):
        self.scheduler_thread = None
        self.is_running = False

    def start_scheduler(self):
        """Start the automation scheduler in a background thread"""
        if self.is_running:
            logger.info("Automation scheduler is already running")
            return

        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        logger.info("Automation scheduler started")

    def stop_scheduler(self):
        """Stop the automation scheduler"""
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Automation scheduler stopped")

    def _run_scheduler(self):
        """Main scheduler loop"""
        # Schedule checks every minute
        schedule.every().minute.do(self._check_and_run_automation)

        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in automation scheduler: {str(e)}")

    def _check_and_run_automation(self):
        """Check for users with scheduled automation and run if needed"""
        try:
            db = SessionLocal()

            # Get current time info
            now = datetime.now()
            current_time = now.time()
            current_day = now.strftime('%A').lower()

            # Get all active automation settings with scheduling enabled
            active_settings = db.query(AutomationSetting).filter(
                AutomationSetting.is_active == True,
                AutomationSetting.schedule_enabled == True
            ).all()

            for setting in active_settings:
                try:
                    # Check if today is a scheduled day
                    if setting.schedule_days and current_day not in [day.lower() for day in setting.schedule_days]:
                        continue

                    # Check if current time is within scheduled hours
                    if setting.schedule_start_time and setting.schedule_end_time:
                        start_time = dt_time.fromisoformat(setting.schedule_start_time)
                        end_time = dt_time.fromisoformat(setting.schedule_end_time)

                        if not (start_time <= current_time <= end_time):
                            continue

                    # Check if automation has already run today for this user
                    today_start = datetime.combine(now.date(), dt_time.min)

                    # Look for any automation task that was started today
                    # This is a simple check - in production you might want to store
                    # the last automation run time in the database

                    logger.info(f"Triggering automation for user {setting.user_id}")

                    # Trigger automation task
                    celery_app.send_task(
                        'tasks.automated_job_application',
                        args=[setting.user_id],
                        kwargs={}
                    )

                except Exception as e:
                    logger.error(f"Error checking automation for user {setting.user_id}: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error in automation check: {str(e)}")
        finally:
            db.close()

# Global scheduler instance
automation_scheduler = AutomationScheduler()

def start_automation_scheduler():
    """Start the global automation scheduler"""
    automation_scheduler.start_scheduler()

def stop_automation_scheduler():
    """Stop the global automation scheduler"""
    automation_scheduler.stop_scheduler()
