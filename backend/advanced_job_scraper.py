"""
Advanced Job Scraper for Multiple Platforms
Supports LinkedIn, Indeed, Glassdoor, Dice, AngelList, and more
"""

import asyncio
import aiohttp
import json
import time
import random
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging

logger = logging.getLogger(__name__)

@dataclass
class JobListing:
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str
    platform: str
    salary: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    posted_date: Optional[str] = None
    skills: List[str] = None
    benefits: List[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None

class AdvancedJobScraper:
    """Advanced job scraper with anti-detection and multi-platform support"""

    def __init__(self):
        self.session = None
        self.driver = None
        self.scraped_jobs = []
        self.rate_limit = 1  # seconds between requests

    async def setup_session(self):
        """Setup aiohttp session with proper headers"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session = aiohttp.ClientSession(headers=headers)

    def setup_selenium(self):
        """Setup Selenium driver with anti-detection measures"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    async def scrape_indeed(self, keywords: str, location: str = "", max_pages: int = 5) -> List[JobListing]:
        """Scrape Indeed job listings"""
        jobs = []
        base_url = "https://www.indeed.com/jobs"

        for page in range(max_pages):
            params = {
                'q': keywords,
                'l': location,
                'start': page * 10,
                'fromage': '7'  # Last 7 days
            }

            try:
                await asyncio.sleep(random.uniform(1, 3))  # Random delay

                if not self.session:
                    await self.setup_session()

                async with self.session.get(base_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        job_cards = soup.find_all('div', class_='job_seen_beacon')

                        for card in job_cards[:10]:  # Limit per page
                            try:
                                job = self._parse_indeed_job(card)
                                if job:
                                    jobs.append(job)
                            except Exception as e:
                                logger.error(f"Error parsing Indeed job: {e}")
                                continue

            except Exception as e:
                logger.error(f"Error scraping Indeed page {page}: {e}")
                continue

        return jobs

    def _parse_indeed_job(self, card) -> Optional[JobListing]:
        """Parse individual Indeed job card"""
        try:
            title_elem = card.find('h2', class_='jobTitle')
            title = title_elem.find('a').get_text().strip() if title_elem else ""

            company_elem = card.find('span', class_='companyName')
            company = company_elem.get_text().strip() if company_elem else ""

            location_elem = card.find('div', class_='companyLocation')
            location = location_elem.get_text().strip() if location_elem else ""

            summary_elem = card.find('div', class_='summary')
            description = summary_elem.get_text().strip() if summary_elem else ""

            link_elem = title_elem.find('a') if title_elem else None
            url = f"https://www.indeed.com{link_elem.get('href')}" if link_elem else ""

            salary_elem = card.find('span', class_='salaryText')
            salary = salary_elem.get_text().strip() if salary_elem else None

            return JobListing(
                id=f"indeed_{hash(url)}",
                title=title,
                company=company,
                location=location,
                description=description,
                url=url,
                platform="indeed",
                salary=salary
            )
        except Exception as e:
            logger.error(f"Error parsing Indeed job card: {e}")
            return None

    async def scrape_linkedin(self, keywords: str, location: str = "", max_pages: int = 3) -> List[JobListing]:
        """Scrape LinkedIn job listings using Selenium"""
        jobs = []

        if not self.driver:
            self.setup_selenium()

        try:
            search_url = f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}"
            self.driver.get(search_url)

            # Wait for job listings to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "jobs-search__results-list"))
            )

            for page in range(max_pages):
                job_cards = self.driver.find_elements(By.CSS_SELECTOR, ".job-search-card")

                for card in job_cards[:8]:  # Limit per page
                    try:
                        job = self._parse_linkedin_job(card)
                        if job:
                            jobs.append(job)
                    except Exception as e:
                        logger.error(f"Error parsing LinkedIn job: {e}")
                        continue

                # Try to load more jobs
                try:
                    load_more = self.driver.find_element(By.CSS_SELECTOR, ".infinite-scroller__show-more-button")
                    self.driver.execute_script("arguments[0].click();", load_more)
                    time.sleep(random.uniform(2, 4))
                except:
                    break

        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {e}")

        return jobs

    def _parse_linkedin_job(self, card) -> Optional[JobListing]:
        """Parse individual LinkedIn job card"""
        try:
            title_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__title")
            title = title_elem.text.strip()

            company_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__subtitle")
            company = company_elem.text.strip()

            location_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__location")
            location = location_elem.text.strip()

            link = card.find_element(By.CSS_SELECTOR, ".job-search-card__title a").get_attribute("href")

            return JobListing(
                id=f"linkedin_{hash(link)}",
                title=title,
                company=company,
                location=location,
                description="",  # Would need to visit job page for full description
                url=link,
                platform="linkedin"
            )
        except Exception as e:
            logger.error(f"Error parsing LinkedIn job card: {e}")
            return None

    async def scrape_glassdoor(self, keywords: str, location: str = "", max_pages: int = 3) -> List[JobListing]:
        """Scrape Glassdoor job listings"""
        jobs = []
        base_url = "https://www.glassdoor.com/Job/jobs.htm"

        for page in range(max_pages):
            params = {
                'sc.keyword': keywords,
                'locT': 'C',
                'locId': location,
                'p': page + 1
            }

            try:
                await asyncio.sleep(random.uniform(2, 4))

                if not self.session:
                    await self.setup_session()

                async with self.session.get(base_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        job_cards = soup.find_all('li', class_='react-job-listing')

                        for card in job_cards:
                            try:
                                job = self._parse_glassdoor_job(card)
                                if job:
                                    jobs.append(job)
                            except Exception as e:
                                logger.error(f"Error parsing Glassdoor job: {e}")
                                continue

            except Exception as e:
                logger.error(f"Error scraping Glassdoor page {page}: {e}")
                continue

        return jobs

    def _parse_glassdoor_job(self, card) -> Optional[JobListing]:
        """Parse individual Glassdoor job card"""
        try:
            title_elem = card.find('a', {'data-test': 'job-title'})
            title = title_elem.get_text().strip() if title_elem else ""

            company_elem = card.find('span', {'data-test': 'employer-name'})
            company = company_elem.get_text().strip() if company_elem else ""

            location_elem = card.find('span', {'data-test': 'job-location'})
            location = location_elem.get_text().strip() if location_elem else ""

            url = title_elem.get('href') if title_elem else ""
            if url and not url.startswith('http'):
                url = f"https://www.glassdoor.com{url}"

            salary_elem = card.find('span', {'data-test': 'detailSalary'})
            salary = salary_elem.get_text().strip() if salary_elem else None

            return JobListing(
                id=f"glassdoor_{hash(url)}",
                title=title,
                company=company,
                location=location,
                description="",
                url=url,
                platform="glassdoor",
                salary=salary
            )
        except Exception as e:
            logger.error(f"Error parsing Glassdoor job card: {e}")
            return None

    async def scrape_dice(self, keywords: str, location: str = "", max_pages: int = 3) -> List[JobListing]:
        """Scrape Dice job listings"""
        jobs = []
        base_url = "https://www.dice.com/jobs"

        params = {
            'q': keywords,
            'location': location,
            'radius': '30',
            'radiusUnit': 'mi'
        }

        try:
            if not self.session:
                await self.setup_session()

            async with self.session.get(base_url, params=params) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')

                    job_cards = soup.find_all('div', class_='search-result-job-card')

                    for card in job_cards[:20]:  # Limit results
                        try:
                            job = self._parse_dice_job(card)
                            if job:
                                jobs.append(job)
                        except Exception as e:
                            logger.error(f"Error parsing Dice job: {e}")
                            continue

        except Exception as e:
            logger.error(f"Error scraping Dice: {e}")

        return jobs

    def _parse_dice_job(self, card) -> Optional[JobListing]:
        """Parse individual Dice job card"""
        try:
            title_elem = card.find('a', class_='job-title')
            title = title_elem.get_text().strip() if title_elem else ""

            company_elem = card.find('a', class_='employer')
            company = company_elem.get_text().strip() if company_elem else ""

            location_elem = card.find('li', class_='location')
            location = location_elem.get_text().strip() if location_elem else ""

            url = title_elem.get('href') if title_elem else ""
            if url and not url.startswith('http'):
                url = f"https://www.dice.com{url}"

            skills_elems = card.find_all('span', class_='skill')
            skills = [skill.get_text().strip() for skill in skills_elems]

            return JobListing(
                id=f"dice_{hash(url)}",
                title=title,
                company=company,
                location=location,
                description="",
                url=url,
                platform="dice",
                skills=skills
            )
        except Exception as e:
            logger.error(f"Error parsing Dice job card: {e}")
            return None

    async def scrape_all_platforms(self, keywords: str, location: str = "", max_per_platform: int = 20) -> List[JobListing]:
        """Scrape jobs from all supported platforms"""
        all_jobs = []

        # Scrape Indeed
        try:
            indeed_jobs = await self.scrape_indeed(keywords, location, 3)
            all_jobs.extend(indeed_jobs[:max_per_platform])
            logger.info(f"Scraped {len(indeed_jobs)} jobs from Indeed")
        except Exception as e:
            logger.error(f"Error scraping Indeed: {e}")

        # Scrape Glassdoor
        try:
            glassdoor_jobs = await self.scrape_glassdoor(keywords, location, 2)
            all_jobs.extend(glassdoor_jobs[:max_per_platform])
            logger.info(f"Scraped {len(glassdoor_jobs)} jobs from Glassdoor")
        except Exception as e:
            logger.error(f"Error scraping Glassdoor: {e}")

        # Scrape Dice
        try:
            dice_jobs = await self.scrape_dice(keywords, location, 2)
            all_jobs.extend(dice_jobs[:max_per_platform])
            logger.info(f"Scraped {len(dice_jobs)} jobs from Dice")
        except Exception as e:
            logger.error(f"Error scraping Dice: {e}")

        # Scrape LinkedIn (using Selenium)
        try:
            linkedin_jobs = await self.scrape_linkedin(keywords, location, 2)
            all_jobs.extend(linkedin_jobs[:max_per_platform])
            logger.info(f"Scraped {len(linkedin_jobs)} jobs from LinkedIn")
        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {e}")

        # Remove duplicates based on title and company
        unique_jobs = []
        seen = set()
        for job in all_jobs:
            key = f"{job.title.lower()}_{job.company.lower()}"
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)

        logger.info(f"Total unique jobs scraped: {len(unique_jobs)}")
        return unique_jobs

    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
        if self.driver:
            self.driver.quit()

# Global scraper instance
job_scraper = AdvancedJobScraper()
