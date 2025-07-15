"""
Intelligent Auto-Application System
Handles automated job applications with smart form filling and anti-detection
"""

import asyncio
import random
import time
import json
from typing import Dict, List, Optional, Any
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging

logger = logging.getLogger(__name__)

class SmartAutoApplier:
    """Intelligent auto-application system with form recognition and filling"""

    def __init__(self, user_profile: Dict):
        self.user_profile = user_profile
        self.driver = None
        self.applications_today = 0
        self.success_count = 0
        self.error_count = 0

    def setup_driver(self):
        """Setup Selenium driver with stealth mode"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Randomize user agent
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        chrome_options.add_argument(f'--user-agent={random.choice(user_agents)}')

        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        # Add random viewport size
        viewport_sizes = [(1920, 1080), (1366, 768), (1440, 900), (1280, 720)]
        width, height = random.choice(viewport_sizes)
        self.driver.set_window_size(width, height)

    async def apply_to_job(self, job_url: str, platform: str, questionnaire_data: Dict) -> Dict:
        """Apply to a single job with intelligent form filling"""
        if not self.driver:
            self.setup_driver()

        result = {
            'job_url': job_url,
            'platform': platform,
            'status': 'failed',
            'message': '',
            'timestamp': time.time()
        }

        try:
            # Navigate to job page
            self.driver.get(job_url)
            await self.random_delay(2, 5)

            # Platform-specific application logic
            if platform == 'indeed':
                success = await self._apply_indeed(questionnaire_data)
            elif platform == 'linkedin':
                success = await self._apply_linkedin(questionnaire_data)
            elif platform == 'glassdoor':
                success = await self._apply_glassdoor(questionnaire_data)
            elif platform == 'dice':
                success = await self._apply_dice(questionnaire_data)
            else:
                success = await self._apply_generic(questionnaire_data)

            if success:
                result['status'] = 'success'
                result['message'] = 'Application submitted successfully'
                self.success_count += 1
            else:
                result['message'] = 'Failed to submit application'
                self.error_count += 1

        except Exception as e:
            logger.error(f"Error applying to job {job_url}: {e}")
            result['message'] = str(e)
            self.error_count += 1

        self.applications_today += 1
        return result

    async def _apply_indeed(self, data: Dict) -> bool:
        """Apply to Indeed job posting"""
        try:
            # Look for apply button
            apply_selectors = [
                "button[data-jk]",
                ".jobsearch-IndeedApplyButton",
                ".indeed-apply-button",
                "button:contains('Apply')",
                "a:contains('Apply')"
            ]

            apply_button = None
            for selector in apply_selectors:
                try:
                    apply_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    break
                except TimeoutException:
                    continue

            if not apply_button:
                logger.warning("Could not find apply button on Indeed")
                return False

            # Click apply button
            self.driver.execute_script("arguments[0].click();", apply_button)
            await self.random_delay(2, 4)

            # Check if it's an external redirect or Indeed's own form
            if "indeed.com" not in self.driver.current_url:
                # External application - try generic form filling
                return await self._apply_generic(data)

            # Fill Indeed application form
            return await self._fill_indeed_form(data)

        except Exception as e:
            logger.error(f"Error in Indeed application: {e}")
            return False

    async def _fill_indeed_form(self, data: Dict) -> bool:
        """Fill Indeed's application form"""
        try:
            # Common Indeed form fields
            field_mappings = {
                'name': ['input[name*="name"]', 'input[id*="name"]'],
                'email': ['input[name*="email"]', 'input[id*="email"]', 'input[type="email"]'],
                'phone': ['input[name*="phone"]', 'input[id*="phone"]', 'input[type="tel"]'],
                'resume': ['input[type="file"]', 'input[name*="resume"]'],
                'cover_letter': ['textarea[name*="cover"]', 'textarea[id*="cover"]'],
                'experience': ['select[name*="experience"]', 'select[id*="experience"]'],
                'education': ['select[name*="education"]', 'select[id*="education"]'],
                'salary': ['input[name*="salary"]', 'input[id*="salary"]'],
                'location': ['input[name*="location"]', 'input[id*="location"]'],
            }

            # Fill basic information
            await self._fill_field_by_selectors(
                field_mappings['name'],
                f"{data.get('firstName', '')} {data.get('lastName', '')}"
            )

            await self._fill_field_by_selectors(
                field_mappings['email'],
                data.get('email', '')
            )

            await self._fill_field_by_selectors(
                field_mappings['phone'],
                data.get('phone', '')
            )

            # Handle file uploads (resume)
            resume_uploaded = await self._upload_resume(field_mappings['resume'])

            # Fill experience and education dropdowns
            await self._fill_dropdown_by_selectors(
                field_mappings['experience'],
                data.get('experienceYears', '3-5')
            )

            await self._fill_dropdown_by_selectors(
                field_mappings['education'],
                data.get('education', 'Bachelor')
            )

            # Handle yes/no questions
            await self._handle_boolean_questions(data)

            # Submit application
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Submit")',
                'button:contains("Apply")',
                '.submit-button'
            ]

            for selector in submit_selectors:
                try:
                    submit_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if submit_btn.is_enabled():
                        self.driver.execute_script("arguments[0].click();", submit_btn)
                        await self.random_delay(3, 6)
                        return True
                except NoSuchElementException:
                    continue

            return False

        except Exception as e:
            logger.error(f"Error filling Indeed form: {e}")
            return False

    async def _apply_linkedin(self, data: Dict) -> bool:
        """Apply to LinkedIn job posting"""
        try:
            # Look for Easy Apply button
            easy_apply_selectors = [
                'button[aria-label*="Easy Apply"]',
                '.jobs-apply-button',
                'button:contains("Easy Apply")'
            ]

            easy_apply_button = None
            for selector in easy_apply_selectors:
                try:
                    easy_apply_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    break
                except TimeoutException:
                    continue

            if not easy_apply_button:
                logger.warning("Could not find Easy Apply button on LinkedIn")
                return False

            # Click Easy Apply
            self.driver.execute_script("arguments[0].click();", easy_apply_button)
            await self.random_delay(2, 4)

            # Handle multi-step LinkedIn application
            return await self._handle_linkedin_steps(data)

        except Exception as e:
            logger.error(f"Error in LinkedIn application: {e}")
            return False

    async def _handle_linkedin_steps(self, data: Dict) -> bool:
        """Handle LinkedIn's multi-step application process"""
        max_steps = 5
        current_step = 0

        while current_step < max_steps:
            try:
                # Check if we're done
                if self._is_linkedin_application_complete():
                    return True

                # Fill current step
                await self._fill_linkedin_current_step(data)

                # Look for Next button
                next_selectors = [
                    'button[aria-label="Continue"]',
                    'button[aria-label="Next"]',
                    'button:contains("Next")',
                    'button:contains("Continue")',
                    'button[type="submit"]'
                ]

                next_clicked = False
                for selector in next_selectors:
                    try:
                        next_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if next_btn.is_enabled():
                            self.driver.execute_script("arguments[0].click();", next_btn)
                            await self.random_delay(2, 4)
                            next_clicked = True
                            break
                    except NoSuchElementException:
                        continue

                if not next_clicked:
                    break

                current_step += 1

            except Exception as e:
                logger.error(f"Error in LinkedIn step {current_step}: {e}")
                break

        return False

    async def _fill_linkedin_current_step(self, data: Dict):
        """Fill the current step in LinkedIn application"""
        # Phone number
        phone_fields = self.driver.find_elements(By.CSS_SELECTOR, 'input[id*="phone"], input[name*="phone"]')
        for field in phone_fields:
            if field.is_displayed() and not field.get_attribute('value'):
                await self._type_like_human(field, data.get('phone', ''))

        # Text areas (cover letter, additional info)
        text_areas = self.driver.find_elements(By.TAG_NAME, 'textarea')
        for textarea in text_areas:
            if textarea.is_displayed() and not textarea.get_attribute('value'):
                placeholder = textarea.get_attribute('placeholder') or ''
                if 'cover' in placeholder.lower() or 'why' in placeholder.lower():
                    await self._type_like_human(textarea, "I am excited about this opportunity and believe my skills align well with your requirements.")

        # Dropdowns
        dropdowns = self.driver.find_elements(By.TAG_NAME, 'select')
        for dropdown in dropdowns:
            if dropdown.is_displayed():
                await self._handle_linkedin_dropdown(dropdown, data)

        # Yes/No questions
        await self._handle_boolean_questions(data)

    def _is_linkedin_application_complete(self) -> bool:
        """Check if LinkedIn application is complete"""
        success_indicators = [
            'Application submitted',
            'Your application was sent',
            'Application sent',
            'Successfully applied'
        ]

        page_text = self.driver.page_source.lower()
        return any(indicator.lower() in page_text for indicator in success_indicators)

    async def _apply_generic(self, data: Dict) -> bool:
        """Generic form filling for unknown platforms"""
        try:
            # Find and fill common form fields
            await self._fill_common_fields(data)

            # Handle file uploads
            await self._upload_resume()

            # Handle dropdowns and selects
            await self._fill_all_dropdowns(data)

            # Handle checkboxes and radio buttons
            await self._handle_boolean_questions(data)

            # Submit form
            return await self._submit_form()

        except Exception as e:
            logger.error(f"Error in generic application: {e}")
            return False

    async def _fill_common_fields(self, data: Dict):
        """Fill common form fields across platforms"""
        field_mappings = {
            'first_name': ['input[name*="first"], input[id*="first"], input[placeholder*="First"]'],
            'last_name': ['input[name*="last"], input[id*="last"], input[placeholder*="Last"]'],
            'email': ['input[type="email"], input[name*="email"], input[id*="email"]'],
            'phone': ['input[type="tel"], input[name*="phone"], input[id*="phone"]'],
            'address': ['input[name*="address"], input[id*="address"], textarea[name*="address"]'],
            'city': ['input[name*="city"], input[id*="city"]'],
            'state': ['input[name*="state"], input[id*="state"], select[name*="state"]'],
            'zip': ['input[name*="zip"], input[id*="zip"], input[name*="postal"]'],
            'linkedin': ['input[name*="linkedin"], input[id*="linkedin"]'],
            'website': ['input[name*="website"], input[id*="website"], input[name*="portfolio"]']
        }

        data_mapping = {
            'first_name': data.get('firstName', ''),
            'last_name': data.get('lastName', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'address': data.get('address', ''),
            'linkedin': data.get('linkedinUrl', ''),
        }

        for field_type, selectors in field_mappings.items():
            value = data_mapping.get(field_type, '')
            if value:
                await self._fill_field_by_selectors(selectors, value)

    async def _fill_field_by_selectors(self, selectors: List[str], value: str):
        """Fill field using multiple selector attempts"""
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    if element.is_displayed() and element.is_enabled():
                        element.clear()
                        await self._type_like_human(element, value)
                        return True
            except Exception:
                continue
        return False

    async def _type_like_human(self, element, text: str):
        """Type text with human-like delays"""
        element.click()
        await self.random_delay(0.1, 0.3)

        for char in text:
            element.send_keys(char)
            await self.random_delay(0.05, 0.15)

    async def _upload_resume(self, selectors: List[str] = None) -> bool:
        """Upload resume file"""
        if not selectors:
            selectors = ['input[type="file"]', 'input[name*="resume"]', 'input[name*="cv"]']

        resume_path = self.user_profile.get('resume_path')
        if not resume_path:
            return False

        for selector in selectors:
            try:
                file_inputs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for file_input in file_inputs:
                    if file_input.is_displayed():
                        file_input.send_keys(resume_path)
                        await self.random_delay(1, 2)
                        return True
            except Exception:
                continue
        return False

    async def _handle_boolean_questions(self, data: Dict):
        """Handle yes/no questions intelligently"""
        boolean_mappings = {
            'authorized': data.get('workAuth', 'true'),
            'sponsor': data.get('needSponsorship', 'false'),
            'veteran': data.get('veteranStatus', 'false'),
            'disability': data.get('disabilityStatus', 'false'),
            'relocate': data.get('relocate', 'true'),
        }

        # Find radio buttons and checkboxes
        for keyword, value in boolean_mappings.items():
            await self._find_and_select_boolean(keyword, value)

    async def _find_and_select_boolean(self, keyword: str, value: str):
        """Find and select boolean field by keyword"""
        is_yes = value.lower() in ['true', 'yes', '1']

        # Look for radio buttons
        radio_selectors = [
            f'input[type="radio"][name*="{keyword}"]',
            f'input[type="radio"][id*="{keyword}"]'
        ]

        for selector in radio_selectors:
            try:
                radios = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for radio in radios:
                    label_text = self._get_label_text(radio).lower()
                    if (is_yes and 'yes' in label_text) or (not is_yes and 'no' in label_text):
                        if radio.is_displayed() and radio.is_enabled():
                            self.driver.execute_script("arguments[0].click();", radio)
                            await self.random_delay(0.5, 1)
                            return
            except Exception:
                continue

    def _get_label_text(self, element) -> str:
        """Get associated label text for form element"""
        try:
            # Try to find associated label
            element_id = element.get_attribute('id')
            if element_id:
                label = self.driver.find_element(By.CSS_SELECTOR, f'label[for="{element_id}"]')
                return label.text

            # Try parent/sibling approach
            parent = element.find_element(By.XPATH, '..')
            return parent.text
        except:
            return ""

    async def _submit_form(self) -> bool:
        """Submit the application form"""
        submit_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Submit")',
            'button:contains("Apply")',
            'button:contains("Send")',
            '.submit-btn',
            '.apply-btn'
        ]

        for selector in submit_selectors:
            try:
                submit_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                if submit_btn.is_displayed() and submit_btn.is_enabled():
                    self.driver.execute_script("arguments[0].click();", submit_btn)
                    await self.random_delay(3, 6)
                    return True
            except NoSuchElementException:
                continue

        return False

    async def random_delay(self, min_seconds: float, max_seconds: float):
        """Add random delay to simulate human behavior"""
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)

    def get_stats(self) -> Dict:
        """Get application statistics"""
        return {
            'applications_today': self.applications_today,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'success_rate': self.success_count / max(self.applications_today, 1) * 100
        }

    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()

class ApplicationManager:
    """Manages multiple application sessions and rate limiting"""

    def __init__(self):
        self.active_appliers = {}
        self.daily_limits = {}
        self.global_rate_limit = 2  # seconds between applications

    async def apply_to_jobs(self, user_id: int, jobs: List[Dict], user_profile: Dict, settings: Dict) -> List[Dict]:
        """Apply to multiple jobs with rate limiting and error handling"""
        applier = SmartAutoApplier(user_profile)
        self.active_appliers[user_id] = applier

        results = []
        max_applications = settings.get('max_applications_per_day', 10)

        try:
            for i, job in enumerate(jobs[:max_applications]):
                if i >= max_applications:
                    break

                # Rate limiting
                if i > 0:
                    await asyncio.sleep(self.global_rate_limit)

                result = await applier.apply_to_job(
                    job['url'],
                    job['platform'],
                    user_profile
                )
                results.append(result)

                # Break on too many consecutive errors
                if applier.error_count >= 3 and applier.success_count == 0:
                    break

        finally:
            applier.cleanup()
            if user_id in self.active_appliers:
                del self.active_appliers[user_id]

        return results

# Global application manager
app_manager = ApplicationManager()
