# Glassdoor Integration for Company Insights
"""
This module provides integration with Glassdoor for company reviews,
salary insights, and interview questions to enhance job application decisions.
"""

import aiohttp
import asyncio
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import logging
from dataclasses import dataclass
import re
import json
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class CompanyInsights:
    company_name: str
    overall_rating: float
    culture_rating: float
    career_opportunities: float
    work_life_balance: float
    compensation_benefits: float
    senior_management: float
    employee_count: str
    industry: str
    founded: str
    headquarters: str
    website: str
    pros: List[str]
    cons: List[str]
    interview_difficulty: float
    interview_questions: List[str]
    salary_ranges: Dict[str, Dict]
    competitor_companies: List[str]

@dataclass
class SalaryInsight:
    job_title: str
    company: str
    location: str
    salary_range: Dict[str, int]
    total_compensation: Dict[str, int]
    years_experience: str
    employee_count: int
    benefits: List[str]

class GlassdoorScraper:
    def __init__(self):
        self.base_url = "https://www.glassdoor.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }

    async def get_company_insights(self, company_name: str) -> Optional[CompanyInsights]:
        """
        Get comprehensive company insights from Glassdoor
        """
        try:
            # Search for company
            company_url = await self._search_company(company_name)
            if not company_url:
                logger.warning(f"Company not found on Glassdoor: {company_name}")
                return None

            # Get company overview
            overview_data = await self._scrape_company_overview(company_url)

            # Get reviews data
            reviews_data = await self._scrape_company_reviews(company_url)

            # Get salary data
            salary_data = await self._scrape_company_salaries(company_url)

            # Get interview data
            interview_data = await self._scrape_interview_insights(company_url)

            # Combine all data
            insights = CompanyInsights(
                company_name=company_name,
                overall_rating=overview_data.get('overall_rating', 0.0),
                culture_rating=reviews_data.get('culture_rating', 0.0),
                career_opportunities=reviews_data.get('career_opportunities', 0.0),
                work_life_balance=reviews_data.get('work_life_balance', 0.0),
                compensation_benefits=reviews_data.get('compensation_benefits', 0.0),
                senior_management=reviews_data.get('senior_management', 0.0),
                employee_count=overview_data.get('employee_count', 'Unknown'),
                industry=overview_data.get('industry', 'Unknown'),
                founded=overview_data.get('founded', 'Unknown'),
                headquarters=overview_data.get('headquarters', 'Unknown'),
                website=overview_data.get('website', ''),
                pros=reviews_data.get('pros', []),
                cons=reviews_data.get('cons', []),
                interview_difficulty=interview_data.get('difficulty', 0.0),
                interview_questions=interview_data.get('questions', []),
                salary_ranges=salary_data.get('ranges', {}),
                competitor_companies=overview_data.get('competitors', [])
            )

            logger.info(f"Successfully retrieved insights for {company_name}")
            return insights

        except Exception as e:
            logger.error(f"Error getting company insights for {company_name}: {str(e)}")
            return None

    async def _search_company(self, company_name: str) -> Optional[str]:
        """Search for company on Glassdoor and return profile URL"""
        try:
            search_url = f"{self.base_url}/Reviews/company-reviews.htm"
            params = {'q': company_name}

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(search_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        # Find first company result
                        company_links = soup.find_all('a', {'data-test': 'employer-name'})
                        if company_links:
                            relative_url = company_links[0].get('href')
                            return f"{self.base_url}{relative_url}"

                        # Alternative selector
                        company_links = soup.find_all('a', href=re.compile(r'/Overview/Working-at-'))
                        if company_links:
                            return f"{self.base_url}{company_links[0].get('href')}"

                    return None

        except Exception as e:
            logger.error(f"Error searching for company {company_name}: {str(e)}")
            return None

    async def _scrape_company_overview(self, company_url: str) -> Dict:
        """Scrape company overview data"""
        try:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(company_url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        overview_data = {}

                        # Overall rating
                        rating_elem = soup.find('span', {'data-test': 'rating'})
                        if rating_elem:
                            overview_data['overall_rating'] = float(rating_elem.text.strip())

                        # Company details
                        details_section = soup.find('div', {'data-test': 'employer-details'})
                        if details_section:
                            details = details_section.find_all('div', class_='css-1w0dpls')
                            for detail in details:
                                text = detail.get_text(strip=True)
                                if 'employees' in text.lower():
                                    overview_data['employee_count'] = text
                                elif 'founded' in text.lower():
                                    overview_data['founded'] = text.split(':')[-1].strip()
                                elif 'industry' in text.lower():
                                    overview_data['industry'] = text.split(':')[-1].strip()
                                elif 'headquarters' in text.lower():
                                    overview_data['headquarters'] = text.split(':')[-1].strip()

                        # Website
                        website_elem = soup.find('a', {'data-test': 'employer-website'})
                        if website_elem:
                            overview_data['website'] = website_elem.get('href', '')

                        # Competitors
                        competitors = []
                        comp_section = soup.find('div', {'data-test': 'competitors'})
                        if comp_section:
                            comp_links = comp_section.find_all('a')
                            competitors = [link.get_text(strip=True) for link in comp_links[:5]]
                        overview_data['competitors'] = competitors

                        return overview_data

        except Exception as e:
            logger.error(f"Error scraping company overview: {str(e)}")
            return {}

    async def _scrape_company_reviews(self, company_url: str) -> Dict:
        """Scrape company reviews and ratings"""
        try:
            reviews_url = company_url.replace('/Overview/', '/Reviews/')

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(reviews_url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        reviews_data = {}

                        # Rating categories
                        rating_bars = soup.find_all('div', class_='ratingNum')
                        ratings = [float(bar.text.strip()) for bar in rating_bars if bar.text.strip().replace('.', '').isdigit()]

                        if len(ratings) >= 5:
                            reviews_data['culture_rating'] = ratings[0]
                            reviews_data['career_opportunities'] = ratings[1]
                            reviews_data['compensation_benefits'] = ratings[2]
                            reviews_data['work_life_balance'] = ratings[3]
                            reviews_data['senior_management'] = ratings[4]

                        # Pros and cons
                        pros = []
                        cons = []

                        review_items = soup.find_all('div', class_='reviewBodyCell')
                        for item in review_items[:10]:  # Limit to recent reviews
                            pros_elem = item.find('span', {'data-test': 'pros'})
                            cons_elem = item.find('span', {'data-test': 'cons'})

                            if pros_elem:
                                pros.append(pros_elem.get_text(strip=True))
                            if cons_elem:
                                cons.append(cons_elem.get_text(strip=True))

                        reviews_data['pros'] = pros[:5]  # Top 5 pros
                        reviews_data['cons'] = cons[:5]  # Top 5 cons

                        return reviews_data

        except Exception as e:
            logger.error(f"Error scraping company reviews: {str(e)}")
            return {}

    async def _scrape_company_salaries(self, company_url: str) -> Dict:
        """Scrape salary information"""
        try:
            salary_url = company_url.replace('/Overview/', '/Salaries/')

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(salary_url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        salary_data = {'ranges': {}}

                        # Salary ranges by role
                        salary_rows = soup.find_all('div', {'data-test': 'salary-row'})
                        for row in salary_rows[:10]:  # Limit results
                            title_elem = row.find('a', {'data-test': 'job-title'})
                            salary_elem = row.find('span', {'data-test': 'salary-estimate'})

                            if title_elem and salary_elem:
                                title = title_elem.get_text(strip=True)
                                salary_text = salary_elem.get_text(strip=True)

                                # Parse salary range
                                salary_range = self._parse_salary_range(salary_text)
                                if salary_range:
                                    salary_data['ranges'][title] = salary_range

                        return salary_data

        except Exception as e:
            logger.error(f"Error scraping company salaries: {str(e)}")
            return {}

    async def _scrape_interview_insights(self, company_url: str) -> Dict:
        """Scrape interview questions and difficulty"""
        try:
            interview_url = company_url.replace('/Overview/', '/Interview/')

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(interview_url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        interview_data = {}

                        # Interview difficulty
                        difficulty_elem = soup.find('span', {'data-test': 'interview-difficulty'})
                        if difficulty_elem:
                            diff_text = difficulty_elem.get_text(strip=True)
                            difficulty_rating = self._parse_difficulty(diff_text)
                            interview_data['difficulty'] = difficulty_rating

                        # Interview questions
                        questions = []
                        question_elems = soup.find_all('span', {'data-test': 'interview-question'})
                        for elem in question_elems[:10]:  # Limit to 10 questions
                            question = elem.get_text(strip=True)
                            if question and len(question) > 10:  # Filter out short/invalid questions
                                questions.append(question)

                        interview_data['questions'] = questions

                        return interview_data

        except Exception as e:
            logger.error(f"Error scraping interview insights: {str(e)}")
            return {}

    def _parse_salary_range(self, salary_text: str) -> Optional[Dict]:
        """Parse salary range from text"""
        try:
            # Remove currency symbols and spaces
            clean_text = re.sub(r'[^\d\-K$,]', '', salary_text)

            # Look for range pattern like "$80K-$120K"
            range_match = re.search(r'(\d+)K?-(\d+)K?', clean_text)
            if range_match:
                min_salary = int(range_match.group(1))
                max_salary = int(range_match.group(2))

                # Convert K to thousands
                if 'K' in salary_text:
                    min_salary *= 1000
                    max_salary *= 1000

                return {
                    'min': min_salary,
                    'max': max_salary,
                    'currency': 'USD'
                }

            return None

        except Exception:
            return None

    def _parse_difficulty(self, difficulty_text: str) -> float:
        """Parse interview difficulty rating"""
        try:
            if 'easy' in difficulty_text.lower():
                return 2.0
            elif 'average' in difficulty_text.lower():
                return 3.0
            elif 'difficult' in difficulty_text.lower():
                return 4.0
            elif 'very difficult' in difficulty_text.lower():
                return 5.0
            else:
                # Try to extract numeric rating
                numbers = re.findall(r'\d+\.?\d*', difficulty_text)
                if numbers:
                    return float(numbers[0])
                return 3.0
        except Exception:
            return 3.0

    async def get_salary_insights(self, job_title: str, location: str, company: str = None) -> List[SalaryInsight]:
        """
        Get salary insights for specific job title and location
        """
        try:
            search_url = f"{self.base_url}/Salaries/index.htm"
            params = {
                'keyword': job_title,
                'loc': location
            }

            salary_insights = []

            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(search_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')

                        # Parse salary data
                        salary_cards = soup.find_all('div', {'data-test': 'salary-card'})

                        for card in salary_cards[:5]:  # Limit to top 5 results
                            try:
                                title_elem = card.find('a', {'data-test': 'salary-title'})
                                company_elem = card.find('span', {'data-test': 'employer-name'})
                                salary_elem = card.find('span', {'data-test': 'salary-estimate'})

                                if title_elem and salary_elem:
                                    title = title_elem.get_text(strip=True)
                                    comp_name = company_elem.get_text(strip=True) if company_elem else 'Unknown'
                                    salary_range = self._parse_salary_range(salary_elem.get_text(strip=True))

                                    if salary_range:
                                        insight = SalaryInsight(
                                            job_title=title,
                                            company=comp_name,
                                            location=location,
                                            salary_range=salary_range,
                                            total_compensation=salary_range,  # Simplified
                                            years_experience='1-3 years',  # Default
                                            employee_count=0,
                                            benefits=[]
                                        )
                                        salary_insights.append(insight)
                            except Exception as e:
                                logger.debug(f"Error parsing salary card: {str(e)}")
                                continue

            logger.info(f"Found {len(salary_insights)} salary insights for {job_title} in {location}")
            return salary_insights

        except Exception as e:
            logger.error(f"Error getting salary insights: {str(e)}")
            return []

# Global instance
glassdoor_scraper = GlassdoorScraper()
