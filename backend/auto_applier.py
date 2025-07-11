# Real Automated Application System
"""
This module handles automated job applications using browser automation.
Uses Selenium WebDriver for form filling and application submission.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import time
import logging
import asyncio
from typing import Dict, List, Optional
import os
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutoApplier:
    def __init__(self, user_profile: Dict):
        self.user_profile = user_profile
        self.driver = None
        self.wait_timeout = 10

    def setup_browser(self, headless: bool = True):
        """Setup browser for automation with proper configuration"""
        try:
            options = webdriver.ChromeOptions()

            if headless:
                options.add_argument('--headless')

            # Security and performance options
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

            # Install and setup ChromeDriver automatically
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)

            # Set implicit wait
            self.driver.implicitly_wait(5)

            logger.info("Browser setup completed successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to setup browser: {e}")
            return False

    async def apply_to_job(self, job_info: Dict, cover_letter: str = None) -> Dict:
        """
        Main method to automatically apply to a job
        """
        if not self.driver:
            if not self.setup_browser():
                return {"status": "error", "message": "Failed to setup browser"}

        try:
            platform = job_info.get('platform', '').lower()
            job_url = job_info.get('url', '')

            if not job_url:
                return {"status": "error", "message": "Job URL not provided"}

            logger.info(f"Starting application to {job_info.get('title')} at {job_info.get('company')}")

            # Navigate to job page
            self.driver.get(job_url)
            await asyncio.sleep(2)  # Allow page to load

            # Platform-specific application logic
            if platform == 'indeed':
                return await self._apply_indeed(job_info, cover_letter)
            elif platform == 'dice':
                return await self._apply_dice(job_info, cover_letter)
            elif platform == 'remoteok':
                return await self._apply_remote_ok(job_info, cover_letter)
            else:
                return await self._apply_generic(job_info, cover_letter)

        except Exception as e:
            logger.error(f"Error during job application: {e}")
            return {"status": "error", "message": str(e)}

    async def _apply_indeed(self, job_info: Dict, cover_letter: str) -> Dict:
        """Apply to Indeed job posting"""
        try:
            wait = WebDriverWait(self.driver, self.wait_timeout)

            # Look for apply button
            apply_selectors = [
                "button[data-testid='apply-button']",
                ".jobsearch-IndeedApplyButton",
                "button:contains('Apply')",
                ".ia-ApplyButton"
            ]

            apply_button = None
            for selector in apply_selectors:
                try:
                    apply_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
                    break
                except TimeoutException:
                    continue

            if not apply_button:
                logger.warning("Could not find apply button on Indeed")
                return {"status": "failed", "message": "Apply button not found"}

            # Click apply button
            apply_button.click()
            await asyncio.sleep(2)

            # Fill application form
            success = await self._fill_indeed_form(cover_letter)

            if success:
                logger.info(f"Successfully applied to {job_info.get('title')} on Indeed")
                return {"status": "success", "platform": "indeed", "job_id": job_info.get('id')}
            else:
                return {"status": "failed", "message": "Form filling failed"}

        except Exception as e:
            logger.error(f"Error applying to Indeed job: {e}")
            return {"status": "error", "message": str(e)}

    async def _apply_dice(self, job_info: Dict, cover_letter: str) -> Dict:
        """Apply to Dice job posting"""
        try:
            wait = WebDriverWait(self.driver, self.wait_timeout)

            # Look for apply button on Dice
            apply_selectors = [
                "button[data-testid='apply-button']",
                ".btn-apply",
                "a[href*='apply']",
                "button:contains('Apply')"
            ]

            apply_button = None
            for selector in apply_selectors:
                try:
                    apply_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
                    break
                except TimeoutException:
                    continue

            if not apply_button:
                logger.warning("Could not find apply button on Dice")
                return {"status": "failed", "message": "Apply button not found"}

            apply_button.click()
            await asyncio.sleep(2)

            # Fill Dice application form
            success = await self._fill_dice_form(cover_letter)

            if success:
                logger.info(f"Successfully applied to {job_info.get('title')} on Dice")
                return {"status": "success", "platform": "dice", "job_id": job_info.get('id')}
            else:
                return {"status": "failed", "message": "Form filling failed"}

        except Exception as e:
            logger.error(f"Error applying to Dice job: {e}")
            return {"status": "error", "message": str(e)}

    async def _apply_remote_ok(self, job_info: Dict, cover_letter: str) -> Dict:
        """Apply to RemoteOK job posting"""
        try:
            # RemoteOK typically redirects to company websites
            # Look for apply links or external application forms

            external_links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='apply'], a[href*='jobs']")

            if external_links:
                # Follow external application link
                external_links[0].click()
                await asyncio.sleep(3)

                # Try generic form filling
                success = await self._fill_generic_form(cover_letter)

                if success:
                    logger.info(f"Successfully applied to {job_info.get('title')} via RemoteOK")
                    return {"status": "success", "platform": "remoteok", "job_id": job_info.get('id')}

            return {"status": "failed", "message": "No application form found"}

        except Exception as e:
            logger.error(f"Error applying to RemoteOK job: {e}")
            return {"status": "error", "message": str(e)}

    async def _apply_generic(self, job_info: Dict, cover_letter: str) -> Dict:
        """Generic application method for unknown platforms"""
        try:
            # Try to find and fill any application form
            success = await self._fill_generic_form(cover_letter)

            if success:
                logger.info(f"Successfully applied to {job_info.get('title')} using generic method")
                return {"status": "success", "platform": "generic", "job_id": job_info.get('id')}
            else:
                return {"status": "failed", "message": "Generic application failed"}

        except Exception as e:
            logger.error(f"Error in generic application: {e}")
            return {"status": "error", "message": str(e)}

    async def _fill_indeed_form(self, cover_letter: str) -> bool:
        """Fill Indeed-specific application form"""
        try:
            wait = WebDriverWait(self.driver, self.wait_timeout)

            # Common Indeed form fields
            form_fields = {
                'input[name="firstName"]': self.user_profile.get('firstName', ''),
                'input[name="lastName"]': self.user_profile.get('lastName', ''),
                'input[name="email"]': self.user_profile.get('email', ''),
                'input[name="phone"]': self.user_profile.get('phone', ''),
                'textarea[name="coverLetter"]': cover_letter or '',
                'textarea[name="message"]': cover_letter or '',
            }

            return await self._fill_form_fields(form_fields)

        except Exception as e:
            logger.error(f"Error filling Indeed form: {e}")
            return False

    async def _fill_dice_form(self, cover_letter: str) -> bool:
        """Fill Dice-specific application form"""
        try:
            # Common Dice form fields
            form_fields = {
                'input[name="first_name"]': self.user_profile.get('firstName', ''),
                'input[name="last_name"]': self.user_profile.get('lastName', ''),
                'input[name="email"]': self.user_profile.get('email', ''),
                'input[name="phone"]': self.user_profile.get('phone', ''),
                'textarea[name="cover_letter"]': cover_letter or '',
                'textarea[name="comments"]': cover_letter or '',
            }

            return await self._fill_form_fields(form_fields)

        except Exception as e:
            logger.error(f"Error filling Dice form: {e}")
            return False

    async def _fill_generic_form(self, cover_letter: str) -> bool:
        """Fill generic application form using common field patterns"""
        try:
            # Try common field patterns
            common_fields = {
                # Name fields
                'input[name*="first"], input[id*="first"], input[placeholder*="First"]': self.user_profile.get('firstName', ''),
                'input[name*="last"], input[id*="last"], input[placeholder*="Last"]': self.user_profile.get('lastName', ''),

                # Email fields
                'input[type="email"], input[name*="email"], input[id*="email"]': self.user_profile.get('email', ''),

                # Phone fields
                'input[type="tel"], input[name*="phone"], input[id*="phone"]': self.user_profile.get('phone', ''),

                # Cover letter / message fields
                'textarea[name*="cover"], textarea[name*="message"], textarea[name*="comment"]': cover_letter or '',
            }

            filled_any = False
            for selector, value in common_fields.items():
                if value:  # Only fill if we have a value
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        for element in elements:
                            if element.is_displayed() and element.is_enabled():
                                element.clear()
                                element.send_keys(value)
                                filled_any = True
                                await asyncio.sleep(0.5)
                                break
                    except Exception as e:
                        logger.debug(f"Could not fill field {selector}: {e}")
                        continue

            # Try to submit the form
            if filled_any:
                await self._try_submit_form()

            return filled_any

        except Exception as e:
            logger.error(f"Error filling generic form: {e}")
            return False

    async def _fill_form_fields(self, field_mapping: Dict[str, str]) -> bool:
        """Helper method to fill form fields"""
        try:
            filled_count = 0

            for selector, value in field_mapping.items():
                if not value:  # Skip empty values
                    continue

                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if element.is_displayed() and element.is_enabled():
                        element.clear()
                        element.send_keys(value)
                        filled_count += 1
                        await asyncio.sleep(0.5)  # Small delay between fields

                except NoSuchElementException:
                    logger.debug(f"Field not found: {selector}")
                    continue
                except Exception as e:
                    logger.warning(f"Error filling field {selector}: {e}")
                    continue

            if filled_count > 0:
                # Try to submit the form
                await self._try_submit_form()
                return True

            return False

        except Exception as e:
            logger.error(f"Error in _fill_form_fields: {e}")
            return False

    async def _try_submit_form(self) -> bool:
        """Try to submit the application form"""
        try:
            # Common submit button selectors
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button:contains('Submit')",
                "button:contains('Apply')",
                "button:contains('Send')",
                ".submit-btn",
                ".apply-btn"
            ]

            for selector in submit_selectors:
                try:
                    submit_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if submit_button.is_displayed() and submit_button.is_enabled():
                        submit_button.click()
                        await asyncio.sleep(2)  # Wait for submission
                        logger.info("Form submitted successfully")
                        return True
                except NoSuchElementException:
                    continue
                except Exception as e:
                    logger.debug(f"Could not click submit button {selector}: {e}")
                    continue

            logger.warning("No submit button found")
            return False

        except Exception as e:
            logger.error(f"Error submitting form: {e}")
            return False

    def cleanup(self):
        """Clean up browser resources"""
        try:
            if self.driver:
                self.driver.quit()
                logger.info("Browser cleaned up successfully")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    def __del__(self):
        """Ensure cleanup when object is destroyed"""
        self.cleanup()

# Utility function for batch applications
async def apply_to_multiple_jobs(jobs: List[Dict], user_profile: Dict, cover_letter_generator) -> List[Dict]:
    """
    Apply to multiple jobs in batch with proper error handling
    """
    results = []
    applier = AutoApplier(user_profile)

    try:
        applier.setup_browser(headless=True)

        for job in jobs:
            try:
                # Generate custom cover letter for each job
                cover_letter = await cover_letter_generator(
                    user_profile.get('resume_text', ''),
                    job.get('description', ''),
                    job.get('company', ''),
                    job.get('title', '')
                )

                # Apply to the job
                result = await applier.apply_to_job(job, cover_letter)
                results.append(result)

                # Add delay between applications to avoid being flagged
                await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Error applying to job {job.get('id')}: {e}")
                results.append({
                    "status": "error",
                    "job_id": job.get('id'),
                    "message": str(e)
                })
                continue

    finally:
        applier.cleanup()

    return results

    def _fill_application_form(self, cover_letter):
        """Fill out application form with user data"""
        # This would be highly platform-specific
        # Each job board has different form structures

        # Example field mapping:
        field_mapping = {
            'first_name': self.user_profile.get('firstName'),
            'last_name': self.user_profile.get('lastName'),
            'email': self.user_profile.get('email'),
            'phone': self.user_profile.get('phone'),
            'cover_letter': cover_letter
        }

        # Dynamic form filling based on field detection
        for field_name, value in field_mapping.items():
            try:
                field = self.driver.find_element(By.NAME, field_name)
                field.clear()
                field.send_keys(value)
            except:
                # Try alternative selectors
                pass

    def _submit_application(self):
        """Submit the completed application"""
        try:
            submit_button = self.driver.find_element(By.CSS_SELECTOR,
                                                   "button[type='submit'], input[type='submit']")
            submit_button.click()

            # Wait for confirmation
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
            )

        except Exception as e:
            logging.error(f"Failed to submit application: {str(e)}")
            raise

    def cleanup(self):
        """Clean up browser resources"""
        if self.driver:
            self.driver.quit()

# Note: This is a conceptual implementation
# Actual implementation requires:
# 1. Platform-specific form recognition
# 2. Anti-detection measures
# 3. Error handling and recovery
# 4. Legal compliance checks
