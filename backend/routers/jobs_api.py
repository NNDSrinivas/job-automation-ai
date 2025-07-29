from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import logging
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

# Import our skill matcher and database dependencies
from skill_matcher import skill_matcher
from db import get_db
from models import User, Resume

load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)

SERP_API_KEY = os.getenv("SERPAPI_KEY")
if not SERP_API_KEY:
    logger.warning("SERPAPI_KEY not found in environment variables")

class JobSearchRequest(BaseModel):
    keywords: str
    location: str = "remote"
    num_results: int = 10
    engine: str = "google_jobs"  # google_jobs, linkedin_jobs, indeed_jobs

@router.post("/jobs/search")
def search_jobs(request: JobSearchRequest):
    """
    Search for jobs using SerpAPI
    
    Supports multiple engines:
    - google_jobs: Google Jobs search
    - linkedin_jobs: LinkedIn Jobs (coming soon)
    - indeed_jobs: Indeed Jobs (coming soon)
    """
    
    if not SERP_API_KEY or SERP_API_KEY == "your_serpapi_key_here":
        logger.warning("SerpAPI key not configured, returning demo data")
        return _get_demo_jobs(request)
    
    url = "https://serpapi.com/search.json"
    
    # Handle location parameter - SerpAPI doesn't support "remote" as a location
    search_location = request.location
    if search_location.lower() in ["remote", "anywhere"]:
        search_location = "United States"  # Default to US for remote jobs
    
    # Base parameters
    params = {
        "engine": request.engine,
        "q": f"{request.keywords} {request.location}" if request.location.lower() in ["remote", "anywhere"] else request.keywords,
        "location": search_location,
        "api_key": SERP_API_KEY,
        "num": min(request.num_results, 50)  # SerpAPI limit
    }
    
    # Add engine-specific parameters
    if request.engine == "google_jobs":
        params["hl"] = "en"  # Language
        params["gl"] = "us"  # Country
    
    try:
        logger.info(f"Searching jobs with SerpAPI: {request.keywords} in {request.location}")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 401:
            logger.warning("Invalid SerpAPI key, returning demo data")
            return _get_demo_jobs(request)
        
        if response.status_code != 200:
            logger.error(f"SerpAPI returned status {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch jobs from SerpAPI (Status: {response.status_code})"
            )

        data = response.json()
        
        # Handle different response formats based on engine
        if request.engine == "google_jobs":
            jobs_data = data.get("jobs_results", [])
        elif request.engine == "linkedin_jobs":
            jobs_data = data.get("jobs", [])
        elif request.engine == "indeed_jobs":
            jobs_data = data.get("jobs_results", [])
        else:
            jobs_data = data.get("jobs_results", [])
        
        # Limit results
        jobs_data = jobs_data[:request.num_results]
        
        simplified_jobs = []
        for job in jobs_data:
            simplified_job = _parse_job(job, request.engine)
            if simplified_job:
                simplified_jobs.append(simplified_job)
        
        logger.info(f"Found {len(simplified_jobs)} jobs for '{request.keywords}' via {request.engine}")
        
        return {
            "jobs": simplified_jobs,
            "total": len(simplified_jobs),
            "search_params": {
                "keywords": request.keywords,
                "location": request.location,
                "engine": request.engine,
                "num_results": request.num_results
            },
            "metadata": {
                "powered_by": "SerpAPI",
                "engine": request.engine,
                "real_time": True
            }
        }
        
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

def _get_demo_jobs(request: JobSearchRequest):
    """Return demo jobs when SerpAPI is not configured"""
    
    # Generate sample jobs based on keywords
    demo_jobs = [
        {
            "id": "demo_1",
            "title": f"Senior {request.keywords}",
            "company": "TechCorp Inc",
            "location": request.location,
            "description": f"We are looking for an experienced {request.keywords} to join our dynamic team. You will work on cutting-edge projects and collaborate with cross-functional teams to deliver high-quality solutions.",
            "via": "Demo Platform",
            "apply_link": "https://example.com/apply/1",
            "posted_at": "2 days ago",
            "salary": "$80,000 - $120,000",
            "job_type": "Full-time",
            "thumbnail": "",
            "platform": "Demo - Google Jobs"
        },
        {
            "id": "demo_2", 
            "title": f"Mid-Level {request.keywords}",
            "company": "StartupHub",
            "location": request.location,
            "description": f"Join our innovative startup as a {request.keywords}! You'll have the opportunity to work with modern technologies and make a significant impact on our products.",
            "via": "Demo Platform",
            "apply_link": "https://example.com/apply/2",
            "posted_at": "1 week ago",
            "salary": "$60,000 - $90,000",
            "job_type": "Full-time",
            "thumbnail": "",
            "platform": "Demo - LinkedIn"
        },
        {
            "id": "demo_3",
            "title": f"Junior {request.keywords}",
            "company": "BigTech Solutions",
            "location": request.location,
            "description": f"Entry-level position for a motivated {request.keywords}. We provide comprehensive training and mentorship to help you grow your career in technology.",
            "via": "Demo Platform", 
            "apply_link": "https://example.com/apply/3",
            "posted_at": "3 days ago",
            "salary": "$45,000 - $65,000",
            "job_type": "Full-time",
            "thumbnail": "",
            "platform": "Demo - Indeed"
        },
        {
            "id": "demo_4",
            "title": f"Freelance {request.keywords}",
            "company": "Remote Solutions Co",
            "location": "Remote",
            "description": f"Flexible freelance opportunity for an experienced {request.keywords}. Work on exciting projects with competitive hourly rates and flexible scheduling.",
            "via": "Demo Platform",
            "apply_link": "https://example.com/apply/4", 
            "posted_at": "5 days ago",
            "salary": "$40-60/hour",
            "job_type": "Contract",
            "thumbnail": "",
            "platform": "Demo - RemoteOK"
        },
        {
            "id": "demo_5",
            "title": f"Lead {request.keywords}",
            "company": "Enterprise Corp",
            "location": request.location,
            "description": f"Leadership role for an experienced {request.keywords}. Lead a team of developers and drive technical decisions in a fast-paced enterprise environment.",
            "via": "Demo Platform",
            "apply_link": "https://example.com/apply/5",
            "posted_at": "1 day ago", 
            "salary": "$100,000 - $150,000",
            "job_type": "Full-time",
            "thumbnail": "",
            "platform": "Demo - Glassdoor"
        }
    ]
    
    # Limit results to requested number
    limited_jobs = demo_jobs[:request.num_results]
    
    return {
        "jobs": limited_jobs,
        "total": len(limited_jobs),
        "search_params": {
            "keywords": request.keywords,
            "location": request.location,
            "engine": request.engine,
            "num_results": request.num_results
        },
        "metadata": {
            "powered_by": "Demo Mode (Configure SERPAPI_KEY for real data)",
            "engine": request.engine,
            "real_time": False,
            "demo_mode": True
        }
    }

def _parse_job(job_data: dict, engine: str) -> dict:
    """Parse job data based on the search engine"""
    
    try:
        if engine == "google_jobs":
            return {
                "id": job_data.get("job_id", ""),
                "title": job_data.get("title", ""),
                "company": job_data.get("company_name", ""),
                "location": job_data.get("location", ""),
                "description": job_data.get("description", ""),
                "via": job_data.get("via", ""),
                "apply_link": _get_apply_link_google(job_data),
                "posted_at": _get_posted_date_google(job_data),
                "salary": job_data.get("salary", ""),
                "job_type": job_data.get("employment_type", ""),
                "thumbnail": job_data.get("thumbnail", ""),
                "platform": "Google Jobs"
            }
        elif engine == "linkedin_jobs":
            return {
                "id": job_data.get("job_id", ""),
                "title": job_data.get("title", ""),
                "company": job_data.get("company", ""),
                "location": job_data.get("location", ""),
                "description": job_data.get("description", ""),
                "via": "LinkedIn",
                "apply_link": job_data.get("link", ""),
                "posted_at": job_data.get("posted_at", ""),
                "salary": job_data.get("salary", ""),
                "job_type": job_data.get("employment_type", ""),
                "thumbnail": job_data.get("company_logo", ""),
                "platform": "LinkedIn"
            }
        elif engine == "indeed_jobs":
            return {
                "id": job_data.get("job_key", ""),
                "title": job_data.get("title", ""),
                "company": job_data.get("company", ""),
                "location": job_data.get("location", ""),
                "description": job_data.get("summary", ""),
                "via": "Indeed",
                "apply_link": job_data.get("link", ""),
                "posted_at": job_data.get("posted_at", ""),
                "salary": job_data.get("salary", ""),
                "job_type": job_data.get("employment_type", ""),
                "thumbnail": "",
                "platform": "Indeed"
            }
        else:
            # Default parsing for unknown engines
            return {
                "id": job_data.get("id", job_data.get("job_id", "")),
                "title": job_data.get("title", ""),
                "company": job_data.get("company", job_data.get("company_name", "")),
                "location": job_data.get("location", ""),
                "description": job_data.get("description", job_data.get("summary", "")),
                "via": job_data.get("via", engine),
                "apply_link": job_data.get("link", ""),
                "posted_at": job_data.get("posted_at", ""),
                "salary": job_data.get("salary", ""),
                "job_type": job_data.get("employment_type", ""),
                "thumbnail": job_data.get("thumbnail", ""),
                "platform": engine.replace("_", " ").title()
            }
            
    except Exception as e:
        logger.error(f"Error parsing job data: {e}")
        return None

def _get_apply_link_google(job_data: dict) -> str:
    """Extract apply link from Google Jobs data"""
    
    # Try related_links first
    related_links = job_data.get("related_links", [])
    if related_links and len(related_links) > 0:
        return related_links[0].get("link", "")
    
    # Try detected_extensions
    detected_extensions = job_data.get("detected_extensions", {})
    if "apply_link" in detected_extensions:
        return detected_extensions["apply_link"]
    
    # Try share_link as fallback
    return job_data.get("share_link", "")

def _get_posted_date_google(job_data: dict) -> str:
    """Extract posted date from Google Jobs data"""
    
    # Try detected_extensions first
    detected_extensions = job_data.get("detected_extensions", {})
    if "posted_at" in detected_extensions:
        return detected_extensions["posted_at"]
    
    # Try posted_at directly
    return job_data.get("posted_at", "")

# Additional endpoint for testing
@router.get("/jobs/search/test")
def test_serpapi_connection():
    """Test SerpAPI connection and configuration"""
    
    if not SERP_API_KEY:
        return {
            "status": "error",
            "message": "SERPAPI_KEY not configured",
            "configured": False
        }
    
    # Test with a simple search
    try:
        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_jobs",
            "q": "software engineer",
            "location": "remote",
            "api_key": SERP_API_KEY,
            "num": 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            jobs_count = len(data.get("jobs_results", []))
            
            return {
                "status": "success",
                "message": "SerpAPI connection successful",
                "configured": True,
                "test_results": {
                    "jobs_found": jobs_count,
                    "response_time": response.elapsed.total_seconds()
                }
            }
        else:
            return {
                "status": "error",
                "message": f"SerpAPI returned status {response.status_code}",
                "configured": True,
                "error_details": response.text[:200]
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}",
            "configured": True
        }

# Job Matching Models
class JobMatchRequest(BaseModel):
    job_id: str
    job_title: str
    job_description: str
    company: str
    user_id: Optional[int] = None
    resume_text: Optional[str] = None  # If provided, use this instead of fetching user's resume

class SkillMatchResponse(BaseModel):
    skill: str
    confidence: float
    category: str
    importance: int

class JobMatchResponse(BaseModel):
    match_score: float
    matched_skills: List[SkillMatchResponse]
    missing_skills: List[SkillMatchResponse]
    skill_gap_analysis: Dict[str, Any]
    recommendations: List[str]
    job_id: str
    analysis_timestamp: str

@router.post("/jobs/match", response_model=JobMatchResponse)
async def match_job_with_resume(
    request: JobMatchRequest,
    db: Session = Depends(get_db)
):
    """
    Match a job description with user's resume to calculate:
    - Match percentage (0-100%)
    - Matched skills
    - Missing skills
    - Skill gap analysis
    - Improvement recommendations
    """
    
    try:
        resume_text = request.resume_text
        
        # If no resume text provided and user_id is given, fetch user's primary resume
        if not resume_text and request.user_id:
            user = db.query(User).filter(User.id == request.user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Get user's primary resume
            primary_resume = db.query(Resume).filter(
                Resume.user_id == request.user_id,
                Resume.is_primary == True
            ).first()
            
            if not primary_resume:
                # Get the most recent resume if no primary
                primary_resume = db.query(Resume).filter(
                    Resume.user_id == request.user_id
                ).order_by(Resume.created_at.desc()).first()
            
            if not primary_resume:
                raise HTTPException(
                    status_code=404, 
                    detail="No resume found for user. Please upload a resume first."
                )
            
            resume_text = primary_resume.parsed_data.get('text', '') if primary_resume.parsed_data else ''
            
            if not resume_text:
                raise HTTPException(
                    status_code=400,
                    detail="Resume text not available. Please re-upload your resume."
                )
        
        if not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Either resume_text or user_id must be provided"
            )
        
        # Perform the matching
        logger.info(f"Matching job '{request.job_title}' for user {request.user_id}")
        
        match_result = skill_matcher.match_job_with_resume(
            resume_text=resume_text,
            job_description=request.job_description,
            user_id=request.user_id
        )
        
        # Convert to response format
        from datetime import datetime
        
        matched_skills_response = [
            SkillMatchResponse(
                skill=skill.skill,
                confidence=skill.confidence,
                category=skill.category,
                importance=skill.importance
            )
            for skill in match_result.matched_skills
        ]
        
        missing_skills_response = [
            SkillMatchResponse(
                skill=skill.skill,
                confidence=skill.confidence,
                category=skill.category,
                importance=skill.importance
            )
            for skill in match_result.missing_skills
        ]
        
        logger.info(
            f"Job match complete: {match_result.match_score}% match, "
            f"{len(match_result.matched_skills)} matched skills, "
            f"{len(match_result.missing_skills)} missing skills"
        )
        
        return JobMatchResponse(
            match_score=match_result.match_score,
            matched_skills=matched_skills_response,
            missing_skills=missing_skills_response,
            skill_gap_analysis=match_result.skill_gap_analysis,
            recommendations=match_result.recommendations,
            job_id=request.job_id,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in job matching: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )
