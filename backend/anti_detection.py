# Enhanced Anti-Detection System for Web Scraping and Automation
"""
This module provides advanced anti-detection measures including
proxy rotation, CAPTCHA handling, browser fingerprint randomization,
and intelligent rate limiting to avoid detection by job platforms.
"""

import random
import time
import asyncio
from typing import List, Dict, Optional
import requests
import aiohttp
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import undetected_chromedriver as uc
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import base64
import os

logger = logging.getLogger(__name__)

@dataclass
class ProxyConfig:
    host: str
    port: int
    username: str = None
    password: str = None
    protocol: str = 'http'

@dataclass
class BrowserProfile:
    user_agent: str
    viewport_size: tuple
    timezone: str
    language: str
    platform: str
    webgl_vendor: str
    webgl_renderer: str

class AntiDetectionManager:
    def __init__(self):
        self.proxy_pool = self._load_proxy_pool()
        self.browser_profiles = self._generate_browser_profiles()
        self.request_history = {}
        self.rate_limiter = RateLimiter()

    def _load_proxy_pool(self) -> List[ProxyConfig]:
        """Load proxy configurations from environment or config file"""
        proxy_pool = []

        # Try to load from environment variables
        proxy_urls = os.getenv('PROXY_URLS', '').split(',')
        for proxy_url in proxy_urls:
            if proxy_url.strip():
                try:
                    # Parse proxy URL format: protocol://username:password@host:port
                    parts = proxy_url.strip().split('://')
                    if len(parts) == 2:
                        protocol, rest = parts
                        if '@' in rest:
                            auth, host_port = rest.split('@')
                            username, password = auth.split(':')
                        else:
                            username, password = None, None
                            host_port = rest

                        host, port = host_port.split(':')

                        proxy_config = ProxyConfig(
                            host=host,
                            port=int(port),
                            username=username,
                            password=password,
                            protocol=protocol
                        )
                        proxy_pool.append(proxy_config)
                except Exception as e:
                    logger.warning(f"Failed to parse proxy URL {proxy_url}: {str(e)}")

        # Add default free proxies for testing (not recommended for production)
        if not proxy_pool:
            logger.warning("No proxy pool configured. Using direct connections.")

        return proxy_pool

    def _generate_browser_profiles(self) -> List[BrowserProfile]:
        """Generate realistic browser fingerprint profiles"""
        profiles = []

        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ]

        viewports = [
            (1920, 1080), (1366, 768), (1536, 864), (1440, 900), (1280, 720)
        ]

        timezones = [
            'America/New_York', 'America/Los_Angeles', 'America/Chicago',
            'Europe/London', 'Europe/Berlin', 'Asia/Tokyo'
        ]

        languages = ['en-US', 'en-GB', 'en-CA', 'en-AU']

        platforms = ['MacIntel', 'Win32', 'Linux x86_64']

        webgl_vendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD']
        webgl_renderers = [
            'Intel Iris Pro OpenGL Engine',
            'NVIDIA GeForce GTX 1050 Ti OpenGL Engine',
            'AMD Radeon R9 M370X OpenGL Engine'
        ]

        for _ in range(10):  # Generate 10 different profiles
            profile = BrowserProfile(
                user_agent=random.choice(user_agents),
                viewport_size=random.choice(viewports),
                timezone=random.choice(timezones),
                language=random.choice(languages),
                platform=random.choice(platforms),
                webgl_vendor=random.choice(webgl_vendors),
                webgl_renderer=random.choice(webgl_renderers)
            )
            profiles.append(profile)

        return profiles

    def get_random_proxy(self) -> Optional[ProxyConfig]:
        """Get a random proxy from the pool"""
        if not self.proxy_pool:
            return None
        return random.choice(self.proxy_pool)

    def get_random_browser_profile(self) -> BrowserProfile:
        """Get a random browser fingerprint profile"""
        return random.choice(self.browser_profiles)

    def create_stealth_driver(self, headless: bool = True, proxy: ProxyConfig = None) -> webdriver.Chrome:
        """Create a stealth Chrome driver with anti-detection measures"""
        try:
            # Use undetected-chromedriver for better stealth
            options = uc.ChromeOptions()

            # Basic stealth options
            if headless:
                options.add_argument('--headless=new')

            # Get random browser profile
            profile = self.get_random_browser_profile()

            # Set user agent
            options.add_argument(f'--user-agent={profile.user_agent}')

            # Window size
            options.add_argument(f'--window-size={profile.viewport_size[0]},{profile.viewport_size[1]}')

            # Disable automation indicators
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)

            # Additional stealth options
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-plugins')
            options.add_argument('--disable-images')
            options.add_argument('--disable-javascript')  # Enable only when needed
            options.add_argument('--disable-web-security')
            options.add_argument('--disable-features=VizDisplayCompositor')

            # Proxy configuration
            if proxy:
                if proxy.username and proxy.password:
                    # Authenticated proxy
                    auth_proxy = f'{proxy.protocol}://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}'
                    options.add_argument(f'--proxy-server={auth_proxy}')
                else:
                    # Simple proxy
                    options.add_argument(f'--proxy-server={proxy.protocol}://{proxy.host}:{proxy.port}')

            # Create driver
            driver = uc.Chrome(options=options, version_main=None)

            # Execute stealth scripts
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            # Set additional properties
            driver.execute_script(f"""
                Object.defineProperty(navigator, 'platform', {{
                    get: () => '{profile.platform}'
                }});
                Object.defineProperty(navigator, 'language', {{
                    get: () => '{profile.language}'
                }});
                Object.defineProperty(navigator, 'languages', {{
                    get: () => ['{profile.language}', 'en']
                }});
            """)

            # Set timezone
            driver.execute_cdp_cmd('Emulation.setTimezoneOverride', {'timezoneId': profile.timezone})

            logger.info("Created stealth Chrome driver with anti-detection measures")
            return driver

        except Exception as e:
            logger.error(f"Failed to create stealth driver: {str(e)}")
            # Fallback to regular Chrome driver
            options = Options()
            if headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            return webdriver.Chrome(options=options)

    def add_human_behavior(self, driver: webdriver.Chrome, element=None):
        """Add human-like behavior to interactions"""
        try:
            if element:
                # Move mouse to element with slight randomness
                actions = ActionChains(driver)

                # Random mouse movements
                for _ in range(random.randint(1, 3)):
                    x_offset = random.randint(-50, 50)
                    y_offset = random.randint(-20, 20)
                    actions.move_by_offset(x_offset, y_offset)
                    actions.pause(random.uniform(0.1, 0.3))

                # Move to element
                actions.move_to_element(element)
                actions.pause(random.uniform(0.2, 0.5))

                # Sometimes scroll a bit
                if random.random() < 0.3:
                    driver.execute_script("window.scrollBy(0, 100);")
                    time.sleep(random.uniform(0.2, 0.5))

                actions.perform()

            # Random delays
            time.sleep(random.uniform(0.5, 2.0))

        except Exception as e:
            logger.debug(f"Error adding human behavior: {str(e)}")

    def type_like_human(self, element, text: str):
        """Type text with human-like timing"""
        try:
            element.clear()

            for char in text:
                element.send_keys(char)
                # Random typing speed
                delay = random.uniform(0.05, 0.15)
                time.sleep(delay)

                # Occasional longer pauses (thinking)
                if random.random() < 0.1:
                    time.sleep(random.uniform(0.3, 0.8))

        except Exception as e:
            logger.debug(f"Error typing like human: {str(e)}")
            # Fallback to normal typing
            element.clear()
            element.send_keys(text)

class RateLimiter:
    def __init__(self):
        self.domain_limits = {}
        self.default_delay = 2.0
        self.max_delay = 30.0

    def wait_if_needed(self, domain: str):
        """Implement intelligent rate limiting per domain"""
        current_time = time.time()

        if domain in self.domain_limits:
            last_request, delay = self.domain_limits[domain]
            time_since_last = current_time - last_request

            if time_since_last < delay:
                wait_time = delay - time_since_last
                logger.info(f"Rate limiting: waiting {wait_time:.2f}s for {domain}")
                time.sleep(wait_time)

                # Increase delay for aggressive rate limiting
                new_delay = min(delay * 1.5, self.max_delay)
                self.domain_limits[domain] = (time.time(), new_delay)
            else:
                # Decrease delay if enough time has passed
                new_delay = max(delay * 0.9, self.default_delay)
                self.domain_limits[domain] = (time.time(), new_delay)
        else:
            self.domain_limits[domain] = (current_time, self.default_delay)

class CaptchaSolver:
    def __init__(self):
        self.api_key = os.getenv('CAPTCHA_API_KEY')  # 2captcha or similar service
        self.service_url = os.getenv('CAPTCHA_SERVICE_URL', 'http://2captcha.com')

    async def solve_recaptcha(self, site_key: str, page_url: str) -> Optional[str]:
        """Solve reCAPTCHA using external service"""
        if not self.api_key:
            logger.warning("No CAPTCHA API key configured")
            return None

        try:
            # Submit CAPTCHA for solving
            submit_url = f"{self.service_url}/in.php"
            data = {
                'key': self.api_key,
                'method': 'userrecaptcha',
                'googlekey': site_key,
                'pageurl': page_url,
                'json': 1
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(submit_url, data=data) as response:
                    result = await response.json()

                    if result['status'] == 1:
                        captcha_id = result['request']

                        # Poll for solution
                        for _ in range(30):  # Wait up to 5 minutes
                            await asyncio.sleep(10)

                            check_url = f"{self.service_url}/res.php"
                            params = {
                                'key': self.api_key,
                                'action': 'get',
                                'id': captcha_id,
                                'json': 1
                            }

                            async with session.get(check_url, params=params) as check_response:
                                check_result = await check_response.json()

                                if check_result['status'] == 1:
                                    logger.info("CAPTCHA solved successfully")
                                    return check_result['request']
                                elif check_result['request'] == 'CAPCHA_NOT_READY':
                                    continue
                                else:
                                    logger.error(f"CAPTCHA solving failed: {check_result}")
                                    return None

                        logger.warning("CAPTCHA solving timed out")
                        return None
                    else:
                        logger.error(f"Failed to submit CAPTCHA: {result}")
                        return None

        except Exception as e:
            logger.error(f"Error solving CAPTCHA: {str(e)}")
            return None

    def handle_captcha_on_page(self, driver: webdriver.Chrome) -> bool:
        """Detect and handle CAPTCHA on current page"""
        try:
            # Look for common CAPTCHA indicators
            captcha_selectors = [
                'iframe[src*="recaptcha"]',
                '.g-recaptcha',
                '#captcha',
                '.captcha',
                'iframe[src*="hcaptcha"]',
                '.h-captcha'
            ]

            for selector in captcha_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    logger.warning(f"CAPTCHA detected: {selector}")

                    # For now, just wait and hope it goes away
                    # In production, integrate with CAPTCHA solving service
                    time.sleep(10)
                    return True

            return False

        except Exception as e:
            logger.debug(f"Error checking for CAPTCHA: {str(e)}")
            return False

# Enhanced Auto Applier with Anti-Detection
class EnhancedAutoApplier:
    def __init__(self, user_profile: Dict):
        self.user_profile = user_profile
        self.driver = None
        self.anti_detection = AntiDetectionManager()
        self.captcha_solver = CaptchaSolver()
        self.wait_timeout = 15

    def setup_stealth_browser(self, headless: bool = True) -> bool:
        """Setup stealth browser with anti-detection measures"""
        try:
            proxy = self.anti_detection.get_random_proxy()
            self.driver = self.anti_detection.create_stealth_driver(headless, proxy)

            # Set page load timeout
            self.driver.set_page_load_timeout(30)

            logger.info("Stealth browser setup completed")
            return True

        except Exception as e:
            logger.error(f"Failed to setup stealth browser: {str(e)}")
            return False

    async def smart_navigate(self, url: str) -> bool:
        """Navigate to URL with rate limiting and error handling"""
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc

            # Apply rate limiting
            self.anti_detection.rate_limiter.wait_if_needed(domain)

            # Navigate with retry logic
            for attempt in range(3):
                try:
                    self.driver.get(url)

                    # Wait for page load
                    WebDriverWait(self.driver, 10).until(
                        lambda d: d.execute_script('return document.readyState') == 'complete'
                    )

                    # Check for CAPTCHA
                    if self.captcha_solver.handle_captcha_on_page(self.driver):
                        logger.info("CAPTCHA handled, continuing...")

                    # Add random scroll behavior
                    if random.random() < 0.7:
                        scroll_amount = random.randint(100, 500)
                        self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
                        await asyncio.sleep(random.uniform(1, 3))

                    return True

                except Exception as e:
                    logger.warning(f"Navigation attempt {attempt + 1} failed: {str(e)}")
                    if attempt < 2:
                        await asyncio.sleep(random.uniform(2, 5))
                    else:
                        raise

            return False

        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
            return False

    async def enhanced_form_filling(self, field_mapping: Dict[str, str]) -> bool:
        """Enhanced form filling with human-like behavior"""
        try:
            filled_count = 0

            # Randomize field filling order
            field_items = list(field_mapping.items())
            random.shuffle(field_items)

            for selector, value in field_items:
                if not value:
                    continue

                try:
                    # Find element with multiple strategies
                    element = None

                    # Try CSS selector first
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for el in elements:
                        if el.is_displayed() and el.is_enabled():
                            element = el
                            break

                    if not element:
                        continue

                    # Add human behavior before interaction
                    self.anti_detection.add_human_behavior(self.driver, element)

                    # Scroll element into view
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
                    await asyncio.sleep(random.uniform(0.3, 0.8))

                    # Focus on element
                    element.click()
                    await asyncio.sleep(random.uniform(0.2, 0.5))

                    # Type with human-like timing
                    self.anti_detection.type_like_human(element, value)

                    filled_count += 1

                    # Random pause between fields
                    await asyncio.sleep(random.uniform(0.5, 2.0))

                except Exception as e:
                    logger.debug(f"Could not fill field {selector}: {str(e)}")
                    continue

            logger.info(f"Successfully filled {filled_count} form fields")
            return filled_count > 0

        except Exception as e:
            logger.error(f"Error in enhanced form filling: {str(e)}")
            return False

    def cleanup(self):
        """Clean up browser resources"""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
        except Exception as e:
            logger.debug(f"Error during cleanup: {str(e)}")

# Global instance
anti_detection_manager = AntiDetectionManager()
