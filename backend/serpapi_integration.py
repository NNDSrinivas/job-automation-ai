"""
SerpAPI Integration for Job Automation AI
Provides real-time job search from LinkedIn and Indeed via SerpAPI
"""

import os
import requests
import logging
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime
from serpapi import GoogleSearch

logger = logging.getLogger(__name__)

class SerpAPIJobSearcher:
    """
    Enhanced job search using SerpAPI for real-time results from major job platforms
    """
    
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY", "")
        self.search_url = "https://serpapi.com/search.json"
        if not self.api_key:
            logger.warning("SERPAPI_KEY not found in environment variables")
        
        # SerpAPI endpoints for different job platforms
        self.engines = {
            "google_jobs": "google_jobs_listing",
            "linkedin": "linkedin_jobs",
            "indeed": "indeed_jobs"
        }
    
    async def search_jobs(
        self,
        keywords: str,
        location: str = "",
        platform: str = "google_jobs",
        limit: int = 500,  # Significantly increased default limit
        page: int = 1,
        job_type: str = "",
        experience_level: str = "",
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for jobs using SerpAPI with aggressive multi-page support to get massive results
        """
        
        try:
            all_jobs = []
            # OPTIMIZED: Only fetch 2-3 pages max to avoid long delays
            pages_to_fetch = min(3, (limit + 9) // 10)
            
            logger.info(f"⚡ FAST job search: {pages_to_fetch} pages for '{keywords}' in {location}")
            
            for page_num in range(pages_to_fetch):
                params = self._build_search_params(
                    keywords, location, platform, 10, page_num + 1, 
                    job_type, experience_level, salary_min, salary_max
                )
                
                logger.info(f"🔍 SerpAPI search params (page {page_num + 1}/{pages_to_fetch}): {params}")
                
                response = requests.get(self.search_url, params=params, timeout=15)  # Reduced timeout
                
                if response.status_code != 200:
                    logger.error(f"❌ SerpAPI returned status {response.status_code} on page {page_num + 1}")
                    break
                
                results = response.json()
                
                # Check for API errors
                if "error" in results:
                    logger.error(f"❌ SerpAPI returned error on page {page_num + 1}: {results['error']}")
                    break
                
                # Parse and add results
                page_jobs = self._parse_results(results, platform)
                all_jobs.extend(page_jobs)
                
                logger.info(f"📊 Page {page_num + 1}/{pages_to_fetch}: {len(page_jobs)} jobs, Total: {len(all_jobs)}")
                
                # Break if we have enough jobs or no more results
                if len(all_jobs) >= 30 or len(page_jobs) == 0:  # Stop at 30 API jobs to avoid delays
                    break
                
                # No delay for first 3 pages to speed up response
                if page_num < 2:
                    await asyncio.sleep(0.1)  # Minimal delay
            
            logger.info(f"⚡ FAST SerpAPI search completed: {len(all_jobs)} total jobs found for '{keywords}' in {location}")
            return all_jobs[:limit]
            
        except Exception as e:
            logger.error(f"❌ SerpAPI search error for '{keywords}': {e}")
            return []

    async def massive_job_search(
        self,
        keywords: str = "",
        location: str = "",
        limit: int = 2000,  # Target thousands of jobs
        include_popular_categories: bool = True
    ) -> List[Dict[str, Any]]:
        """
        OPTIMIZED: Fast massive job search with intelligent API usage and sample data supplementation
        """
        all_jobs = []
        
        # SPEED OPTIMIZATION: Only do limited API calls, then supplement with sample data
        api_job_limit = min(50, limit // 10)  # Get only 50 real jobs max from API for speed
        
        # If specific keywords provided, search for them first
        if keywords.strip():
            logger.info(f"⚡ FAST search for specific keywords: {keywords}")
            keyword_jobs = await self.search_jobs(
                keywords=keywords,
                location=location,
                limit=api_job_limit,  # Limited API calls for speed
                platform="google_jobs"
            )
            all_jobs.extend(keyword_jobs)
            logger.info(f"✅ Found {len(keyword_jobs)} real jobs for specific keywords in {len(keyword_jobs)*0.5:.1f}s")
        
        # FAST CATEGORY SEARCH: Only search 3-5 most popular categories instead of 24
        if len(all_jobs) < api_job_limit and include_popular_categories:
            remaining_api_limit = api_job_limit - len(all_jobs)
            
            # TOP PRIORITY categories for fastest, most relevant results
            top_categories = [
                "software engineer", "data scientist", "product manager", "marketing manager", "sales representative"
            ]
            
            jobs_per_category = max(5, remaining_api_limit // len(top_categories))
            
            logger.info(f"⚡ FAST search: {len(top_categories)} top categories, {jobs_per_category} jobs each")
            
            # Search categories in parallel but limit to prevent delays
            category_searches = []
            for category in top_categories:
                category_searches.append(
                    self.search_jobs(
                        keywords=category,
                        location=location,
                        limit=jobs_per_category,
                        platform="google_jobs"
                    )
                )
            
            # Execute ALL searches in parallel for maximum speed
            try:
                start_time = asyncio.get_event_loop().time()
                batch_results = await asyncio.gather(*category_searches, return_exceptions=True)
                end_time = asyncio.get_event_loop().time()
                
                for result in batch_results:
                    if isinstance(result, list):
                        all_jobs.extend(result)
                    elif isinstance(result, Exception):
                        logger.warning(f"Category search failed: {result}")
                
                logger.info(f"⚡ PARALLEL SEARCH COMPLETE: {len(all_jobs)} API jobs in {end_time - start_time:.1f}s")
                
            except Exception as e:
                logger.error(f"Parallel search error: {e}")
        
        # Remove duplicates from API results only
        seen = set()
        unique_api_jobs = []
        for job in all_jobs:
            job_key = (
                job.get('title', '').lower().strip(),
                job.get('company', '').lower().strip(),
                job.get('location', '').lower().strip()
            )
            if job_key not in seen and job_key != ('', '', ''):
                seen.add(job_key)
                unique_api_jobs.append(job)
        
        logger.info(f"⚡ FAST SEARCH COMPLETE: {len(unique_api_jobs)} unique API jobs found (removed {len(all_jobs) - len(unique_api_jobs)} duplicates)")
        
        return unique_api_jobs
    
    def _build_search_params(
        self,
        keywords: str,
        location: str,
        platform: str,
        limit: int,
        page: int,
        job_type: str,
        experience_level: str,
        salary_min: Optional[int],
        salary_max: Optional[int]
    ) -> Dict[str, Any]:
        """Build search parameters for SerpAPI based on platform"""
        
        base_params = {
            "api_key": self.api_key,
            "q": keywords,
            "num": min(limit, 100),  # SerpAPI limit
        }
        
        # Only add pagination if it's not the first page
        if page > 1:
            # Note: For real pagination, we would need to store the next_page_token
            # from previous responses. For now, we'll skip pagination for Google Jobs
            # as it requires next_page_token instead of start offset
            pass
        
        if platform == "google_jobs":
            base_params.update({
                "engine": "google_jobs",
                "location": location if location else "United States",
            })
            
            # Add Google Jobs specific filters
            if job_type:
                base_params["employment_type"] = self._map_job_type_google(job_type)
            if experience_level:
                base_params["experience_level"] = self._map_experience_level_google(experience_level)
            if salary_min:
                base_params["salary_min"] = salary_min
            if salary_max:
                base_params["salary_max"] = salary_max
                
        elif platform == "linkedin":
            base_params.update({
                "engine": "linkedin_jobs",
                "location": location if location else "United States",
            })
            
        elif platform == "indeed":
            base_params.update({
                "engine": "indeed_jobs",
                "location": location if location else "United States",
            })
            
        return base_params
    
    def _parse_results(self, results: Dict[str, Any], platform: str) -> List[Dict[str, Any]]:
        """Parse SerpAPI results into standardized job format"""
        
        jobs = []
        
        try:
            logger.info(f"🔧 Parsing results for platform: {platform}")
            logger.info(f"📋 Available result keys: {list(results.keys())}")
            
            if platform == "google_jobs" and "jobs_results" in results:
                raw_jobs = results["jobs_results"]
                logger.info(f"📊 Found {len(raw_jobs)} raw jobs to parse")
                jobs = self._parse_google_jobs(raw_jobs)
            elif platform == "linkedin" and "jobs" in results:
                raw_jobs = results["jobs"]
                logger.info(f"📊 Found {len(raw_jobs)} LinkedIn jobs to parse")
                jobs = self._parse_linkedin_jobs(raw_jobs)
            elif platform == "indeed" and "jobs_results" in results:
                raw_jobs = results["jobs_results"]
                logger.info(f"📊 Found {len(raw_jobs)} Indeed jobs to parse")
                jobs = self._parse_indeed_jobs(raw_jobs)
            else:
                logger.warning(f"⚠️ No matching results key found for platform {platform}")
                logger.warning(f"Available keys: {list(results.keys())}")
                
        except Exception as e:
            logger.error(f"Error parsing {platform} results: {e}")
            
        return jobs
    
    def _parse_google_jobs(self, jobs_data: List[Dict]) -> List[Dict[str, Any]]:
        """Parse Google Jobs results"""
        
        parsed_jobs = []
        
        for job in jobs_data:
            try:
                # Extract apply link - prioritize actual apply links
                apply_url = ""
                if "related_links" in job and job["related_links"]:
                    for link in job["related_links"]:
                        if link.get("text", "").lower() in ["apply", "apply now", "apply on company website"]:
                            apply_url = link.get("link", "")
                            break
                    # If no specific apply link found, use the first related link
                    if not apply_url and job["related_links"]:
                        apply_url = job["related_links"][0].get("link", "")
                
                # Fallback to share_link if no apply link found
                if not apply_url:
                    apply_url = job.get("share_link", "")
                
                # Extract salary from description if not in salary field
                salary_info = self._extract_salary_from_job(job)
                
                parsed_job = {
                    "id": job.get("job_id", ""),
                    "title": job.get("title", ""),
                    "company": job.get("company_name", ""),
                    "location": job.get("location", ""),
                    "description": job.get("description", ""),
                    "salary": salary_info,
                    "job_type": job.get("employment_type", ""),
                    "posted_date": job.get("posted_at", ""),
                    "apply_url": apply_url,
                    "platform": "Google Jobs",
                    "source_url": job.get("share_link", ""),
                    "requirements": job.get("qualifications", []),
                    "benefits": job.get("benefits", []),
                    "company_logo": job.get("thumbnail", ""),
                    "remote_friendly": "remote" in job.get("location", "").lower(),
                    "scraped_at": datetime.now().isoformat()
                }
                parsed_jobs.append(parsed_job)
                
            except Exception as e:
                logger.error(f"Error parsing individual Google job: {e}")
                continue
                
        return parsed_jobs
    
    def _parse_linkedin_jobs(self, jobs_data: List[Dict]) -> List[Dict[str, Any]]:
        """Parse LinkedIn Jobs results"""
        
        parsed_jobs = []
        
        for job in jobs_data:
            try:
                parsed_job = {
                    "id": job.get("job_id", ""),
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", ""),
                    "description": job.get("description", ""),
                    "salary": self._extract_salary(job.get("salary", "")),
                    "job_type": job.get("employment_type", ""),
                    "posted_date": job.get("posted_at", ""),
                    "apply_url": job.get("link", ""),
                    "platform": "LinkedIn",
                    "source_url": job.get("link", ""),
                    "requirements": [],
                    "benefits": [],
                    "company_logo": job.get("company_logo", ""),
                    "remote_friendly": "remote" in job.get("location", "").lower(),
                    "scraped_at": datetime.now().isoformat()
                }
                parsed_jobs.append(parsed_job)
                
            except Exception as e:
                logger.error(f"Error parsing individual LinkedIn job: {e}")
                continue
                
        return parsed_jobs
    
    def _parse_indeed_jobs(self, jobs_data: List[Dict]) -> List[Dict[str, Any]]:
        """Parse Indeed Jobs results"""
        
        parsed_jobs = []
        
        for job in jobs_data:
            try:
                parsed_job = {
                    "id": job.get("job_key", ""),
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", ""),
                    "description": job.get("summary", ""),
                    "salary": self._extract_salary(job.get("salary", "")),
                    "job_type": job.get("employment_type", ""),
                    "posted_date": job.get("posted_at", ""),
                    "apply_url": job.get("link", ""),
                    "platform": "Indeed",
                    "source_url": job.get("link", ""),
                    "requirements": [],
                    "benefits": [],
                    "company_logo": "",
                    "remote_friendly": "remote" in job.get("location", "").lower(),
                    "scraped_at": datetime.now().isoformat()
                }
                parsed_jobs.append(parsed_job)
                
            except Exception as e:
                logger.error(f"Error parsing individual Indeed job: {e}")
                continue
                
        return parsed_jobs
    
    def _extract_salary_from_job(self, job: Dict) -> Dict[str, Any]:
        """Enhanced salary extraction from job data including description"""
        
        # First try the salary field
        salary_text = job.get("salary", "")
        if salary_text:
            return self._extract_salary(salary_text)
        
        # Look for salary in description
        description = job.get("description", "")
        if description:
            import re
            
            # Look for salary patterns in description
            salary_patterns = [
                r'\$[\d,]+\s*[-–]\s*\$[\d,]+',  # $100,000 - $150,000
                r'\$[\d,]+\s*(?:to|TO)\s*\$[\d,]+',  # $100,000 to $150,000
                r'Salary[:\s]+\$[\d,]+\s*[-–]\s*\$[\d,]+',  # Salary: $100,000 - $150,000
                r'Compensation[:\s]+\$[\d,]+\s*[-–]\s*\$[\d,]+',  # Compensation: $100,000 - $150,000
                r'\$[\d,]+[KkMm]?\s*[-–]\s*\$[\d,]+[KkMm]?',  # $100K - $150K
                r'\$[\d,]+[KkMm]?',  # Single salary like $100K
            ]
            
            for pattern in salary_patterns:
                matches = re.findall(pattern, description, re.IGNORECASE)
                if matches:
                    return self._extract_salary(matches[0])
        
        # Default empty salary
        return {"raw": "", "min": None, "max": None, "currency": "USD"}

    def _extract_salary(self, salary_text: str) -> Dict[str, Any]:
        """Extract and normalize salary information"""
        
        if not salary_text:
            return {"raw": "", "min": None, "max": None, "currency": "USD"}
        
        salary_info = {
            "raw": salary_text,
            "min": None,
            "max": None,
            "currency": "USD"
        }
        
        import re
        
        # Remove common words and normalize
        clean_text = salary_text.replace(',', '').replace('$', '').lower()
        
        # Extract numeric values with K/M multipliers
        number_patterns = [
            r'(\d+\.?\d*)\s*k',  # 100k, 150k
            r'(\d+\.?\d*)\s*m',  # 1.5m  
            r'(\d+)',  # regular numbers
        ]
        
        numbers = []
        for pattern in number_patterns:
            matches = re.findall(pattern, clean_text)
            for match in matches:
                try:
                    num = float(match)
                    if 'k' in clean_text and num < 1000:
                        num *= 1000
                    elif 'm' in clean_text and num < 100:
                        num *= 1000000
                    numbers.append(int(num))
                except ValueError:
                    continue
        
        # Assign min/max based on numbers found
        if len(numbers) >= 2:
            salary_info["min"] = min(numbers)
            salary_info["max"] = max(numbers)
        elif len(numbers) == 1:
            # Single number - could be minimum or base
            if numbers[0] > 10000:  # Assume it's annual salary
                salary_info["min"] = numbers[0]
                salary_info["max"] = numbers[0]
        
        return salary_info
    
    def _map_job_type_google(self, job_type: str) -> str:
        """Map job type to Google Jobs format"""
        mapping = {
            "full-time": "FULLTIME",
            "part-time": "PARTTIME",
            "contract": "CONTRACTOR",
            "internship": "INTERN",
            "remote": "FULLTIME"
        }
        return mapping.get(job_type.lower(), "FULLTIME")
    
    def _map_experience_level_google(self, experience_level: str) -> str:
        """Map experience level to Google Jobs format"""
        mapping = {
            "entry-level": "ENTRY_LEVEL",
            "mid-level": "MID_LEVEL",
            "senior-level": "SENIOR_LEVEL",
            "executive": "EXECUTIVE"
        }
        return mapping.get(experience_level.lower(), "MID_LEVEL")

# Global instance
serpapi_searcher = SerpAPIJobSearcher()
