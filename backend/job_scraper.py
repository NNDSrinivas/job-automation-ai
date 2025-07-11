# Real Job Board Scraper Implementation
"""
This module handles scraping jobs from various job boards.
Uses both direct scraping and API integration where available.
"""

import requests
from bs4 import BeautifulSoup
import asyncio
import aiohttp
import time
import logging
from typing import List, Dict, Optional
from urllib.parse import quote, urljoin
import json
import re
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobBoardScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    async def search_all_platforms(self, keywords: str, location: str = "", limit: int = 50) -> List[Dict]:
        """
        Search all supported job platforms and return combined results
        """
        logger.info(f"Starting job search for '{keywords}' in '{location}'")

        all_jobs = []
        platforms = [
            self.scrape_indeed_async,
            self.scrape_dice_async,
            self.scrape_remote_ok_async,  # Remote jobs platform
        ]

        # Run searches in parallel
        tasks = []
        for platform_func in platforms:
            task = platform_func(keywords, location, limit // len(platforms))
            tasks.append(task)

        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, list):
                    all_jobs.extend(result)
                elif isinstance(result, Exception):
                    logger.error(f"Platform search failed: {result}")

            # Remove duplicates based on job title and company
            unique_jobs = self._remove_duplicates(all_jobs)

            logger.info(f"Found {len(unique_jobs)} unique jobs across all platforms")
            return unique_jobs[:limit]

        except Exception as e:
            logger.error(f"Error in search_all_platforms: {e}")
            return []

    async def scrape_indeed_async(self, keywords: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape Indeed jobs using their public API/search
        """
        try:
            base_url = "https://www.indeed.com/jobs"
            params = {
                'q': keywords,
                'l': location,
                'limit': min(limit, 50),
                'fromage': '7',  # Jobs from last 7 days
            }

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(base_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_indeed_jobs(html)
                    else:
                        logger.warning(f"Indeed returned status {response.status}")
                        return []

        except Exception as e:
            logger.error(f"Error scraping Indeed: {e}")
            return []

    async def scrape_dice_async(self, keywords: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape Dice jobs (tech-focused platform)
        """
        try:
            base_url = "https://www.dice.com/jobs"
            params = {
                'q': keywords,
                'location': location,
                'radius': '30',
                'radiusUnit': 'mi',
                'page': '1',
                'pageSize': str(min(limit, 20))
            }

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(base_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_dice_jobs(html)
                    else:
                        logger.warning(f"Dice returned status {response.status}")
                        return []

        except Exception as e:
            logger.error(f"Error scraping Dice: {e}")
            return []

    async def scrape_remote_ok_async(self, keywords: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape RemoteOK for remote positions
        """
        try:
            base_url = "https://remoteok.io/api"

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(base_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_remote_ok_jobs(data, keywords, limit)
                    else:
                        logger.warning(f"RemoteOK returned status {response.status}")
                        return []

        except Exception as e:
            logger.error(f"Error scraping RemoteOK: {e}")
            return []

    def _parse_indeed_jobs(self, html: str) -> List[Dict]:
        """Parse Indeed job listings from HTML"""
        jobs = []
        soup = BeautifulSoup(html, 'html.parser')

        job_cards = soup.find_all('div', {'data-jk': True})

        for card in job_cards[:20]:  # Limit to prevent overwhelming
            try:
                title_elem = card.find('a', {'data-jk': True})
                title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"

                company_elem = card.find('span', {'title': True})
                company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"

                location_elem = card.find('div', {'data-testid': 'job-location'})
                location = location_elem.get_text(strip=True) if location_elem else "Unknown Location"

                link = title_elem.get('href') if title_elem else ""
                full_link = f"https://www.indeed.com{link}" if link else ""

                snippet_elem = card.find('div', {'data-testid': 'job-snippet'})
                description = snippet_elem.get_text(strip=True) if snippet_elem else ""

                job_data = {
                    'id': f"indeed_{card.get('data-jk', '')}",
                    'title': title,
                    'company': company,
                    'location': location,
                    'description': description,
                    'url': full_link,
                    'platform': 'indeed',
                    'scraped_at': datetime.now().isoformat(),
                    'salary': self._extract_salary(description),
                    'job_type': self._extract_job_type(description)
                }

                jobs.append(job_data)

            except Exception as e:
                logger.error(f"Error parsing Indeed job card: {e}")
                continue

        logger.info(f"Parsed {len(jobs)} jobs from Indeed")
        return jobs

    def _parse_dice_jobs(self, html: str) -> List[Dict]:
        """Parse Dice job listings from HTML"""
        jobs = []
        soup = BeautifulSoup(html, 'html.parser')

        # Dice uses different selectors
        job_cards = soup.find_all('div', class_='card')

        for card in job_cards[:15]:  # Limit results
            try:
                title_elem = card.find('a', class_='card-title-link')
                title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"

                company_elem = card.find('a', class_='card-company')
                company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"

                location_elem = card.find('li', class_='location')
                location = location_elem.get_text(strip=True) if location_elem else "Unknown Location"

                link = title_elem.get('href') if title_elem else ""
                full_link = f"https://www.dice.com{link}" if link and not link.startswith('http') else link

                description_elem = card.find('div', class_='card-description')
                description = description_elem.get_text(strip=True) if description_elem else ""

                job_data = {
                    'id': f"dice_{hash(full_link)}",
                    'title': title,
                    'company': company,
                    'location': location,
                    'description': description,
                    'url': full_link,
                    'platform': 'dice',
                    'scraped_at': datetime.now().isoformat(),
                    'salary': self._extract_salary(description),
                    'job_type': self._extract_job_type(description)
                }

                jobs.append(job_data)

            except Exception as e:
                logger.error(f"Error parsing Dice job card: {e}")
                continue

        logger.info(f"Parsed {len(jobs)} jobs from Dice")
        return jobs

    def _parse_remote_ok_jobs(self, data: List[Dict], keywords: str, limit: int) -> List[Dict]:
        """Parse RemoteOK job data"""
        jobs = []
        keywords_lower = keywords.lower().split()

        for item in data[:limit]:
            if isinstance(item, dict) and 'position' in item:
                try:
                    # Filter jobs that match keywords
                    position_text = item.get('position', '').lower()
                    description_text = item.get('description', '').lower()

                    if any(keyword in position_text or keyword in description_text for keyword in keywords_lower):
                        job_data = {
                            'id': f"remoteok_{item.get('id', hash(str(item)))}",
                            'title': item.get('position', 'Unknown Title'),
                            'company': item.get('company', 'Unknown Company'),
                            'location': 'Remote',
                            'description': item.get('description', ''),
                            'url': item.get('url', ''),
                            'platform': 'remoteok',
                            'scraped_at': datetime.now().isoformat(),
                            'salary': item.get('salary_min', ''),
                            'job_type': 'Remote'
                        }

                        jobs.append(job_data)

                except Exception as e:
                    logger.error(f"Error parsing RemoteOK job: {e}")
                    continue

        logger.info(f"Parsed {len(jobs)} jobs from RemoteOK")
        return jobs

    def _extract_salary(self, text: str) -> str:
        """Extract salary information from job description"""
        salary_patterns = [
            r'\$[\d,]+\s*-\s*\$[\d,]+',
            r'\$[\d,]+k?\s*-\s*\$[\d,]+k?',
            r'\$[\d,]+(?:k|,000)?(?:\s*per\s*year|\s*annually)?',
        ]

        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)

        return ""

    def _extract_job_type(self, text: str) -> str:
        """Extract job type from description"""
        text_lower = text.lower()

        if 'remote' in text_lower:
            return 'Remote'
        elif 'hybrid' in text_lower:
            return 'Hybrid'
        elif 'part-time' in text_lower or 'part time' in text_lower:
            return 'Part-time'
        elif 'contract' in text_lower:
            return 'Contract'
        elif 'full-time' in text_lower or 'full time' in text_lower:
            return 'Full-time'
        else:
            return 'Full-time'  # Default

    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title and company"""
        seen = set()
        unique_jobs = []

        for job in jobs:
            key = (job.get('title', '').lower(), job.get('company', '').lower())
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)

        return unique_jobs

    # Synchronous wrapper methods for backward compatibility
    def scrape_indeed(self, keywords: str, location: str = "") -> List[Dict]:
        """Synchronous wrapper for Indeed scraping"""
        return asyncio.run(self.scrape_indeed_async(keywords, location))

    def scrape_dice(self, keywords: str, location: str = "") -> List[Dict]:
        """Synchronous wrapper for Dice scraping"""
        return asyncio.run(self.scrape_dice_async(keywords, location))

    def search_jobs(self, keywords: str, location: str = "", limit: int = 50) -> List[Dict]:
        """Synchronous wrapper for searching all platforms"""
        return asyncio.run(self.search_all_platforms(keywords, location, limit))

# Note: This is a skeleton - actual implementation requires:
# 1. Respect for robots.txt
# 2. Rate limiting
# 3. Legal compliance
# 4. Anti-detection measures
