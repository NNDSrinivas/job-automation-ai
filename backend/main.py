from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import HTTPException, status
from pydantic import BaseModel
from auth import authenticate_user, create_access_token
import tempfile
import secrets
import smtplib
from email.message import EmailMessage
import os
import json

from resume_parser import parse_resume
from jd_matcher import match_jd
from cover_letter_generator import generate_cover_letter
from user_profile import extract_user_info
from typing import List, Dict, Optional
from resume_storage import upload_resume_to_s3, add_resume, load_user_resumes, get_primary_resume
from db import SessionLocal
from models import Resume, User, Job, JobApplication
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import logging
from datetime import datetime

# Background job processing
from job_manager import job_manager
from job_scraper import JobBoardScraper
from auto_applier import AutoApplier

# Enhanced imports for new features
from websocket_manager import websocket_manager, websocket_events, start_websocket_heartbeat
from glassdoor_integration import glassdoor_scraper
from anti_detection import EnhancedAutoApplier, anti_detection_manager
from enhanced_profile import EnhancedProfileService, EnhancedUserProfile, UserProfileCreate, UserProfileUpdate, UserProfileResponse
from fastapi import WebSocket, WebSocketDisconnect

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# Create database tables
from db import engine, Base
from models import User, Resume
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Job Automation AI API")

# Enable CORS (allow all origins for now; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Health check endpoint"""
    return {"message": "Job Automation AI API is running", "status": "healthy"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Job Automation AI API"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"

EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@example.com")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# In-memory store for tokens (use DB in production)
verification_tokens = {}
password_reset_tokens = {}

# Helper to send email
def send_email(to, subject, body):
    msg = EmailMessage()
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Endpoint: Upload Resume and extract user info
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    resume_txt = parse_resume(tmp_path)
    user_info = extract_user_info(resume_txt)
    s3_url = upload_resume_to_s3(tmp_path, file.filename, user_id)

    # Store resume metadata in DB
    db = SessionLocal()
    db_resume = Resume(filename=file.filename, s3_url=s3_url, user_id=user_id)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    db.close()

    return {
        "resume_text": resume_txt[:1000],
        "user_info": user_info,
        "resume_url": s3_url,
        "db_id": db_resume.id
    }

# Pydantic model for matching request
class MatchInput(BaseModel):
    resume_text: str
    job_description: str

# Endpoint: Match JD
@app.post("/match-job")
async def match_job(input: MatchInput):
    score = match_jd(input.resume_text, input.job_description)
    return {"score": score}

# Endpoint: Generate Cover Letter
@app.post("/generate-cover-letter")
async def gen_cover(resume_text: str, job_description: str, company: str, position: str):
    letter = generate_cover_letter(resume_text, job_description, company, position)
    return {"cover_letter": letter}

@app.get("/user-resumes")
async def get_user_resumes(user_id: str = Depends(get_current_user)):
    return load_user_resumes(user_id)

@app.get("/primary-resume")
async def get_primary(user_id: str = Depends(get_current_user)):
    return get_primary_resume(user_id)

class LoginInput(BaseModel):
    username: str
    password: str

@app.post("/login")
async def login(input: LoginInput):
    db = SessionLocal()
    user = db.query(User).filter(User.username == input.username).first()
    db.close()
    if not user or not pwd_context.verify(input.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.username, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "username": user.username}

# Real job automation integration
from job_scraper import JobBoardScraper
from auto_applier import AutoApplier, apply_to_multiple_jobs
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Job cache for storing searched jobs temporarily
job_cache = {}

# Helper functions for job automation
def extract_keywords_from_resume(resume_text: str) -> str:
    """Extract relevant job search keywords from resume text"""
    try:
        # Use AI to extract keywords (simplified version)
        import re

        # Extract skills and technologies
        tech_keywords = re.findall(r'\b(?:Python|JavaScript|React|Node|Java|C\+\+|SQL|AWS|Docker|Kubernetes|Git)\b', resume_text, re.IGNORECASE)

        # Extract job titles
        title_keywords = re.findall(r'\b(?:Engineer|Developer|Manager|Analyst|Designer|Architect|Lead|Senior|Junior)\b', resume_text, re.IGNORECASE)

        # Combine and deduplicate
        all_keywords = list(set(tech_keywords + title_keywords))

        # Return as search string
        return ' '.join(all_keywords[:5])  # Limit to top 5 keywords

    except Exception as e:
        logger.error(f"Error extracting keywords: {e}")
        return "Software Developer"  # Default fallback

async def get_job_details(job_id: str) -> Dict:
    """Get job details from cache or database"""
    try:
        # First check cache
        if job_id in job_cache:
            return job_cache[job_id]

        # If not in cache, could query database or re-scrape
        # For now, return None if not found
        logger.warning(f"Job {job_id} not found in cache")
        return None

    except Exception as e:
        logger.error(f"Error getting job details: {e}")
        return None

async def log_job_application(job_id: str, result: Dict):
    """Log job application to database"""
    try:
        # Here you would typically save to database
        # For now, just log it
        logger.info(f"Application logged - Job: {job_id}, Status: {result.get('status')}")

        # You could extend this to save to database:
        # db = SessionLocal()
        # application = JobApplication(job_id=job_id, status=result.get('status'), ...)
        # db.add(application)
        # db.commit()
        # db.close()

    except Exception as e:
        logger.error(f"Error logging application: {e}")

# Pydantic models for job automation
job_boards = ['linkedin', 'glassdoor', 'dice', 'indeed', 'remoteok']

class JobSearchRequest(BaseModel):
    resume_text: str
    job_board: str = "all"  # Can specify platform or "all"
    keywords: str = ""
    location: str = ""
    questionnaire: Dict[str, str] = {}

class JobApplicationRequest(BaseModel):
    job_id: str
    resume_text: str
    job_board: str
    questionnaire: Dict[str, str] = {}

class JobApplicationStats(BaseModel):
    applied: int
    denied: int
    interviewed: int

# Global job scraper instance
job_scraper = JobBoardScraper()

@app.post('/search-jobs')
async def search_jobs(request: JobSearchRequest):
    """
    Real job search across multiple platforms with AI matching
    """
    try:
        # Extract keywords from resume if not provided
        keywords = request.keywords
        if not keywords:
            # Use AI to extract relevant keywords from resume
            keywords = extract_keywords_from_resume(request.resume_text)

        logger.info(f"Searching jobs for keywords: {keywords}, location: {request.location}")

        # Search jobs across platforms
        if request.job_board == "all":
            jobs = await job_scraper.search_all_platforms(
                keywords=keywords,
                location=request.location,
                limit=50
            )
        else:
            # Search specific platform
            if request.job_board == "indeed":
                jobs = await job_scraper.scrape_indeed_async(keywords, request.location)
            elif request.job_board == "dice":
                jobs = await job_scraper.scrape_dice_async(keywords, request.location)
            elif request.job_board == "remoteok":
                jobs = await job_scraper.scrape_remote_ok_async(keywords, request.location)
            else:
                jobs = []

        # Calculate match scores for each job using existing AI
        matched_jobs = []
        for job in jobs:
            try:
                # Use existing match_jd function
                match_score = match_jd(request.resume_text, job.get('description', ''))
                job['match_score'] = match_score
                matched_jobs.append(job)
            except Exception as e:
                logger.error(f"Error calculating match score: {e}")
                job['match_score'] = 0
                matched_jobs.append(job)

        # Sort by match score (highest first)
        matched_jobs.sort(key=lambda x: x.get('match_score', 0), reverse=True)

        logger.info(f"Found {len(matched_jobs)} jobs with match scores")

        return {
            'jobs': matched_jobs[:20],  # Return top 20 matches
            'total_found': len(matched_jobs),
            'search_params': {
                'keywords': keywords,
                'location': request.location,
                'platform': request.job_board
            }
        }

    except Exception as e:
        logger.error(f"Error in job search: {e}")
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")

@app.post('/apply-job')
async def apply_job(request: JobApplicationRequest):
    """
    Real automated job application using browser automation
    """
    try:
        # Get job details (you might want to cache these from search)
        job_info = await get_job_details(request.job_id)

        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")

        # Prepare user profile for application
        user_profile = {
            'firstName': request.questionnaire.get('firstName', ''),
            'lastName': request.questionnaire.get('lastName', ''),
            'email': request.questionnaire.get('email', ''),
            'phone': request.questionnaire.get('phone', ''),
            'resume_text': request.resume_text
        }

        # Generate custom cover letter for this specific job
        cover_letter = generate_cover_letter(
            resume_text=request.resume_text,
            job_description=job_info.get('description', ''),
            company=job_info.get('company', ''),
            position=job_info.get('title', '')
        )

        # Apply to the job using automation
        auto_applier = AutoApplier(user_profile)

        try:
            result = await auto_applier.apply_to_job(job_info, cover_letter)

            # Log the application in database (you might want to add this)
            await log_job_application(request.job_id, result)

            return {
                'status': result.get('status', 'unknown'),
                'job_id': request.job_id,
                'message': result.get('message', ''),
                'application_time': datetime.now().isoformat()
            }

        finally:
            auto_applier.cleanup()

    except Exception as e:
        logger.error(f"Error in job application: {e}")
        raise HTTPException(status_code=500, detail=f"Job application failed: {str(e)}")

@app.post('/apply-multiple-jobs')
async def apply_multiple_jobs_endpoint(jobs_list: List[str], user_profile: Dict, user_id: str = Depends(get_current_user)):
    """
    Apply to multiple jobs in batch - the core automation feature!
    """
    try:
        # Get job details for all job IDs
        jobs = []
        for job_id in jobs_list:
            job_info = await get_job_details(job_id)
            if job_info:
                jobs.append(job_info)

        if not jobs:
            raise HTTPException(status_code=400, detail="No valid jobs found")

        # Create cover letter generator function
        async def cover_letter_generator(resume_text, job_description, company, position):
            return generate_cover_letter(resume_text, job_description, company, position)

        # Apply to all jobs
        results = await apply_to_multiple_jobs(jobs, user_profile, cover_letter_generator)

        # Log all applications
        for result in results:
            await log_job_application(result.get('job_id'), result)

        success_count = len([r for r in results if r.get('status') == 'success'])

        return {
            'total_jobs': len(jobs),
            'successful_applications': success_count,
            'failed_applications': len(jobs) - success_count,
            'results': results,
            'batch_completed_at': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in batch job application: {e}")
        raise HTTPException(status_code=500, detail=f"Batch application failed: {str(e)}")

@app.get('/application-stats')
async def application_stats(user_id: str = Depends(get_current_user)):
    # Mock statistics
    stats = JobApplicationStats(applied=12, denied=3, interviewed=2)
    return stats.dict()

class RegisterInput(BaseModel):
    username: str
    email: str
    password: str

@app.post("/register")
async def register(input: RegisterInput):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter((User.username == input.username) | (User.email == input.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        hashed_password = pwd_context.hash(input.password)
        user = User(username=input.username, email=input.email, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Email verification (skip in development if SMTP not configured)
        try:
            # Only attempt email sending if SMTP is properly configured
            if SMTP_USER and SMTP_PASS and SMTP_SERVER != "smtp.example.com":
                token = secrets.token_urlsafe(32)
                verification_tokens[user.email] = token
                verify_link = f"https://yourdomain.com/verify-email?token={token}&email={user.email}"
                send_email(user.email, "Verify your email", f"Click to verify: {verify_link}")
                return {"id": user.id, "username": user.username, "email": user.email, "verification_sent": True}
            else:
                # Development mode - skip email verification
                return {"id": user.id, "username": user.username, "email": user.email, "verification_sent": False, "note": "Email verification skipped in development mode"}
        except Exception as e:
            # For development/testing - return success without email verification
            print(f"Email sending failed (development mode): {e}")
            return {"id": user.id, "username": user.username, "email": user.email, "verification_sent": False, "note": "Email verification skipped in development mode"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")
    finally:
        db.close()

@app.get("/verify-email")
async def verify_email(token: str, email: str):
    if verification_tokens.get(email) == token:
        # Mark user as verified (add field in User model for production)
        del verification_tokens[email]
        return {"status": "verified"}
    raise HTTPException(status_code=400, detail="Invalid token")

@app.post("/request-password-reset")
async def request_password_reset(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = secrets.token_urlsafe(32)
    password_reset_tokens[email] = token
    reset_link = f"https://yourdomain.com/reset-password?token={token}&email={email}"
    send_email(email, "Password Reset", f"Click to reset: {reset_link}")
    return {"reset_sent": True}

@app.post("/reset-password")
async def reset_password(email: str, token: str, new_password: str):
    if password_reset_tokens.get(email) == token:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            db.close()
            raise HTTPException(status_code=404, detail="User not found")
        user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        db.close()
        del password_reset_tokens[email]
        return {"status": "password reset"}
    raise HTTPException(status_code=400, detail="Invalid token")

from models import User
from sqlalchemy.orm import Session

class UserProfileUpdate(BaseModel):
    email: str = None
    username: str = None
    # Add more fields as needed

@app.get("/profile")
async def get_profile(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "email": user.email}

@app.put("/profile")
async def update_profile(update: UserProfileUpdate, user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    if update.email:
        user.email = update.email
    if update.username:
        user.username = update.username
    db.commit()
    db.refresh(user)
    db.close()
    return {"id": user.id, "username": user.username, "email": user.email}

# Background Job Processing Endpoints

class JobApplicationRequest(BaseModel):
    job_id: int
    resume_path: Optional[str] = None
    cover_letter: Optional[str] = None
    skills: Optional[List[str]] = []

class BulkApplicationRequest(BaseModel):
    job_ids: List[int]
    resume_path: Optional[str] = None
    cover_letter: Optional[str] = None
    skills: Optional[List[str]] = []
    auto_generate_cover_letter: bool = True

class JobSearchRequest(BaseModel):
    keywords: str
    location: str = ""
    limit: int = 50

@app.post("/jobs/apply")
async def apply_to_job_background(
    request: JobApplicationRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Submit a background job to apply to a single job
    """
    try:
        application_data = {
            'resume_path': request.resume_path,
            'cover_letter': request.cover_letter,
            'skills': request.skills,
        }

        task_id = job_manager.submit_job_application(
            user_id,
            request.job_id,
            application_data
        )

        return {
            'message': 'Application submitted for background processing',
            'task_id': task_id,
            'status': 'submitted'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/apply-bulk")
async def apply_to_jobs_bulk(
    request: BulkApplicationRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Submit background jobs to apply to multiple jobs
    """
    try:
        application_settings = {
            'resume_path': request.resume_path,
            'cover_letter': request.cover_letter,
            'skills': request.skills,
            'auto_generate_cover_letter': request.auto_generate_cover_letter
        }

        task_id = job_manager.submit_bulk_applications(
            user_id,
            request.job_ids,
            application_settings
        )

        return {
            'message': f'Bulk application submitted for {len(request.job_ids)} jobs',
            'task_id': task_id,
            'job_count': len(request.job_ids),
            'status': 'submitted'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/search")
async def search_jobs_background(
    request: JobSearchRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Start background job scraping
    """
    try:
        search_params = {
            'keywords': request.keywords,
            'location': request.location,
            'limit': request.limit
        }

        task_id = job_manager.start_job_scraping(user_id, search_params)

        return {
            'message': 'Job search started in background',
            'task_id': task_id,
            'search_params': search_params,
            'status': 'submitted'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/search/{platform}")
async def deep_search_platform(
    platform: str,
    keywords: str,
    location: str = "",
    max_pages: int = 5,
    user_id: int = Depends(get_current_user)
):
    """
    Start deep scraping of specific platform
    """
    try:
        search_params = {
            'keywords': keywords,
            'location': location
        }

        task_id = job_manager.start_deep_scraping(platform, search_params, max_pages)

        return {
            'message': f'Deep search of {platform} started',
            'task_id': task_id,
            'platform': platform,
            'max_pages': max_pages,
            'status': 'submitted'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str, user_id: int = Depends(get_current_user)):
    """
    Get status of a background task
    """
    try:
        status = job_manager.get_task_status(task_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def cancel_task(task_id: str, user_id: int = Depends(get_current_user)):
    """
    Cancel a background task
    """
    try:
        success = job_manager.cancel_task(task_id)
        if success:
            return {'message': 'Task cancelled successfully', 'task_id': task_id}
        else:
            raise HTTPException(status_code=400, detail='Failed to cancel task')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/active")
async def get_active_tasks(user_id: int = Depends(get_current_user)):
    """
    Get list of active background tasks
    """
    try:
        tasks = job_manager.get_active_tasks()
        return {'active_tasks': tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/queue-status")
async def get_queue_status(user_id: int = Depends(get_current_user)):
    """
    Get status of background job queues
    """
    try:
        status = job_manager.get_queue_status()
        return {'queue_status': status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/health")
async def system_health_check():
    """
    Check health of background job system
    """
    try:
        health = job_manager.health_check()
        return health
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }

@app.get("/applications")
async def get_user_applications(
    user_id: int = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's job applications with status
    """
    try:
        db = SessionLocal()
        applications = db.query(JobApplication).filter(
            JobApplication.user_id == user_id
        ).offset(offset).limit(limit).all()

        result = []
        for app in applications:
            job = db.query(Job).filter(Job.id == app.job_id).first()
            result.append({
                'id': app.id,
                'job_id': app.job_id,
                'job_title': job.title if job else 'Unknown',
                'company': job.company if job else 'Unknown',
                'platform': job.platform if job else 'Unknown',
                'status': app.status,
                'applied_successfully': app.applied_successfully,
                'applied_at': app.applied_at.isoformat() if app.applied_at else None,
                'completed_at': app.completed_at.isoformat() if app.completed_at else None,
                'error_message': app.error_message
            })

        db.close()
        return {'applications': result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/applications/report")
async def get_application_report(
    user_id: int = Depends(get_current_user),
    date_range: int = 30
):
    """
    Generate application report for user
    """
    try:
        task_id = job_manager.generate_user_report(user_id, date_range)
        return {
            'message': 'Report generation started',
            'task_id': task_id,
            'date_range': date_range
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs")
async def get_available_jobs(
    user_id: int = Depends(get_current_user),
    platform: Optional[str] = None,
    keywords: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get available jobs from database
    """
    try:
        db = SessionLocal()
        query = db.query(Job)

        if platform:
            query = query.filter(Job.platform == platform)

        if keywords:
            query = query.filter(Job.title.contains(keywords))

        jobs = query.offset(offset).limit(limit).all()

        result = []
        for job in jobs:
            result.append({
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'description': job.description[:500] + '...' if len(job.description) > 500 else job.description,
                'url': job.url,
                'platform': job.platform,
                'salary': job.salary,
                'job_type': job.job_type,
                'posted_date': job.posted_date.isoformat() if job.posted_date else None,
                'scraped_at': job.scraped_at.isoformat() if job.scraped_at else None
            })

        db.close()
        return {'jobs': result, 'count': len(result)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket support for real-time events
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time job events
    """
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()
            print(f"Received message: {data}")

            # Here you can handle incoming messages and send responses
            await websocket.send_text(f"Message received: {data}")

    except WebSocketDisconnect:
        # Handle client disconnect
        websocket_manager.disconnect(websocket)
        print("Client disconnected")

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time job automation updates"""
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            # Wait for heartbeat or client messages
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle heartbeat
            if message.get('type') == 'heartbeat':
                await websocket_manager.send_personal_message({
                    'type': 'heartbeat_ack',
                    'timestamp': datetime.now().isoformat()
                }, websocket)

            # Handle task status requests
            elif message.get('type') == 'get_task_status':
                task_id = message.get('task_id')
                if task_id:
                    status = job_manager.get_task_status(task_id)
                    await websocket_manager.send_personal_message({
                        'type': 'task_status_response',
                        'task_id': task_id,
                        'status': status
                    }, websocket)

    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        await websocket_manager.disconnect(websocket)

# Enhanced Profile Management Endpoints
@app.post("/profile/enhanced", response_model=UserProfileResponse)
async def create_enhanced_profile(
    profile_data: UserProfileCreate,
    user_id: int = Depends(get_current_user)
):
    """Create comprehensive user profile with all job application fields"""
    try:
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)

        # Check if profile already exists
        existing_profile = profile_service.get_profile(user_id)
        if existing_profile:
            raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")

        profile = profile_service.create_profile(user_id, profile_data)

        # Send analytics update
        await websocket_events.on_analytics_updated(user_id, {
            'profile_completion': profile.profile_completion_percentage,
            'last_updated': profile.last_updated.isoformat()
        })

        db.close()
        return profile

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profile/enhanced", response_model=UserProfileResponse)
async def get_enhanced_profile(user_id: int = Depends(get_current_user)):
    """Get comprehensive user profile"""
    try:
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)

        profile = profile_service.get_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        db.close()
        return profile

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/profile/enhanced", response_model=UserProfileResponse)
async def update_enhanced_profile(
    profile_updates: UserProfileUpdate,
    user_id: int = Depends(get_current_user)
):
    """Update user profile with new information"""
    try:
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)

        profile = profile_service.update_profile(user_id, profile_updates)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Send analytics update
        await websocket_events.on_analytics_updated(user_id, {
            'profile_completion': profile.profile_completion_percentage,
            'last_updated': profile.last_updated.isoformat()
        })

        db.close()
        return profile

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profile/completeness")
async def check_profile_completeness(user_id: int = Depends(get_current_user)):
    """Check profile completeness and get recommendations"""
    try:
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)

        completeness = profile_service.check_profile_completeness(user_id)

        db.close()
        return completeness

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add missing endpoints for system tests

@app.get("/jobs/search/{task_id}/status")
async def get_job_search_status(task_id: str, user_id: int = Depends(get_current_user)):
    """
    Get status of a job search task
    """
    try:
        status = job_manager.get_task_status(task_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/background/status")
async def get_background_job_status(user_id: int = Depends(get_current_user)):
    """
    Get status of all background jobs
    """
    try:
        active_tasks = job_manager.get_active_tasks()
        return {
            'active_jobs': len(active_tasks),
            'tasks': active_tasks,
            'user_id': user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/companies/{company_name}/insights")
async def get_company_insights(company_name: str, user_id: int = Depends(get_current_user)):
    """
    Get company insights from Glassdoor
    """
    try:
        insights = await glassdoor_scraper.get_company_insights(company_name)
        return {
            'company_name': company_name,
            'insights': insights,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        # Return mock data for testing if scraping fails
        return {
            'company_name': company_name,
            'insights': {
                'rating': 4.2,
                'reviews_count': 1250,
                'salary_range': '$120k - $180k',
                'pros': ['Great work-life balance', 'Innovative projects'],
                'cons': ['Limited remote work', 'Competitive environment']
            },
            'timestamp': datetime.now().isoformat(),
            'note': 'Mock data - Glassdoor integration pending'
        }

# Enhanced Job Application with Anti-Detection
@app.post("/jobs/apply-enhanced")
async def apply_to_job_enhanced(
    request: JobApplicationRequest,
    user_id: int = Depends(get_current_user)
):
    """Enhanced job application with anti-detection measures"""
    try:
        # Get enhanced user profile
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)

        profile_data = profile_service.get_application_data(user_id)
        if not profile_data:
            raise HTTPException(status_code=400, detail="Complete your profile before applying")

        # Check profile completeness
        completeness = profile_service.check_profile_completeness(user_id)
        if completeness['completion_percentage'] < 80:
            raise HTTPException(
                status_code=400,
                detail=f"Profile only {completeness['completion_percentage']}% complete. Please complete your profile before applying."
            )

        # Get job details
        job_info = await get_job_details(request.job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")

        # Send start notification
        await websocket_events.on_application_started(
            user_id=user_id,
            job_id=str(request.job_id),
            job_title=job_info.get('title', 'Unknown'),
            company=job_info.get('company', 'Unknown'),
            task_id='direct_application'
        )

        # Generate cover letter if not provided
        cover_letter = request.cover_letter
        if not cover_letter and profile_data.get('personal', {}).get('cover_letter_template'):
            cover_letter = generate_cover_letter(
                resume_text=request.resume_text or "",
                job_description=job_info.get('description', ''),
                company=job_info.get('company', ''),
                position=job_info.get('title', '')
            )

        # Create enhanced auto applier with anti-detection
        auto_applier = EnhancedAutoApplier(profile_data)

        try:
            # Setup stealth browser
            if not auto_applier.setup_stealth_browser(headless=True):
                raise HTTPException(status_code=500, detail="Failed to setup browser")

            # Send progress update
            await websocket_events.on_application_progress(
                user_id=user_id,
                job_id=str(request.job_id),
                step='navigating',
                message='Navigating to job page...',
                task_id='direct_application'
            )

            # Navigate to job page with anti-detection
            if not await auto_applier.smart_navigate(job_info.get('url', '')):
                raise HTTPException(status_code=500, detail="Failed to navigate to job page")

            # Send progress update
            await websocket_events.on_application_progress(
                user_id=user_id,
                job_id=str(request.job_id),
                step='filling_form',
                message='Filling application form...',
                task_id='direct_application'
            )

            # Apply to job with enhanced form filling
            result = await auto_applier.apply_to_job(job_info, cover_letter)

            # Log application
            await log_job_application(request.job_id, result)

            # Send completion notification
            await websocket_events.on_application_completed(
                user_id=user_id,
                job_id=str(request.job_id),
                success=result.get('status') == 'success',
                message=result.get('message', ''),
                task_id='direct_application'
            )

            db.close()
            return {
                'status': result.get('status', 'unknown'),
                'job_id': request.job_id,
                'message': result.get('message', ''),
                'application_time': datetime.now().isoformat(),
                'anti_detection_used': True
            }

        finally:
            auto_applier.cleanup()

    except Exception as e:
        logger.error(f"Error in enhanced job application: {str(e)}")
        await websocket_events.on_error_occurred(
            user_id=user_id,
            error_message=str(e),
            task_id='direct_application'
        )
        raise HTTPException(status_code=500, detail=str(e))

# Real-time Task Monitoring
@app.get("/tasks/monitor")
async def get_task_monitoring_dashboard(user_id: int = Depends(get_current_user)):
    """Get real-time task monitoring dashboard"""
    try:
        active_tasks = job_manager.get_user_active_tasks(user_id)

        task_details = []
        for task_id in active_tasks:
            status = job_manager.get_task_status(task_id)
            task_details.append({
                'task_id': task_id,
                'status': status.get('status'),
                'progress': status.get('progress', 0),
                'started_at': status.get('started_at'),
                'type': status.get('task_type'),
                'result': status.get('result')
            })

        return {
            'active_tasks': task_details,
            'websocket_connected': user_id in websocket_manager.get_active_users(),
            'total_active': len(task_details)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Dashboard Enhancement
@app.get("/analytics/dashboard")
async def get_enhanced_analytics_dashboard(
    days_back: int = 30,
    user_id: int = Depends(get_current_user)
):
    """Get comprehensive analytics dashboard"""
    try:
        from analytics_engine import AnalyticsEngine

        analytics_engine = AnalyticsEngine()

        # Get user analytics
        user_metrics = analytics_engine.get_user_analytics(user_id, days_back)

        # Get market insights
        market_insights = analytics_engine.get_market_insights()

        # Get profile completion
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)
        completeness = profile_service.check_profile_completeness(user_id)
        db.close()

        dashboard_data = {
            'user_metrics': {
                'total_applications': user_metrics.total_applications,
                'successful_applications': user_metrics.successful_applications,
                'pending_applications': user_metrics.pending_applications,
                'failed_applications': user_metrics.failed_applications,
                'success_rate': user_metrics.success_rate,
                'avg_response_time': user_metrics.avg_response_time
            },
            'top_platforms': user_metrics.top_platforms,
            'top_companies': user_metrics.top_companies,
            'skill_demand': user_metrics.skill_demand,
            'salary_insights': user_metrics.salary_insights,
            'market_trends': market_insights,
            'profile_completion': completeness,
            'period_days': days_back,
            'generated_at': datetime.now().isoformat()
        }

        # Send real-time update
        await websocket_events.on_analytics_updated(user_id, dashboard_data)

        return dashboard_data

    except Exception as e:
        logger.error(f"Error generating analytics dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Job Search with Real-time Updates
@app.post("/jobs/search-enhanced")
async def enhanced_job_search(
    request: JobSearchRequest,
    user_id: int = Depends(get_current_user)
):
    """Enhanced job search with real-time progress updates"""
    try:
        # Start WebSocket notifications
        await websocket_events.on_job_search_started(
            user_id=user_id,
            search_params=request.dict(),
            task_id='enhanced_search'
        )

        # Extract keywords from user profile if not provided
        keywords = request.keywords
        if not keywords:
            db = SessionLocal()
            profile_service = EnhancedProfileService(db)
            profile_data = profile_service.get_application_data(user_id)
            db.close()

            if profile_data and profile_data.get('skills', {}).get('technical'):
                keywords = ', '.join(profile_data['skills']['technical'][:5])
            else:
                keywords = 'software engineer'  # Default

        logger.info(f"Enhanced search for keywords: {keywords}, location: {request.location}")

        # Search with progress updates
        all_jobs = []
        platforms = ['indeed', 'dice', 'remoteok']

        for i, platform in enumerate(platforms):
            # Send progress update
            await websocket_events.on_job_search_progress(
                user_id=user_id,
                platform=platform,
                found_count=len(all_jobs),
                total_expected=request.limit,
                task_id='enhanced_search'
            )

            try:
                if platform == "indeed":
                    jobs = await job_scraper.scrape_indeed_async(keywords, request.location, 20)
                elif platform == "dice":
                    jobs = await job_scraper.scrape_dice_async(keywords, request.location, 20)
                elif platform == "remoteok":
                    jobs = await job_scraper.scrape_remote_ok_async(keywords, request.location, 20)

                all_jobs.extend(jobs)

                # Update progress
                await websocket_events.on_job_search_progress(
                    user_id=user_id,
                    platform=platform,
                    found_count=len(all_jobs),
                    total_expected=request.limit,
                    task_id='enhanced_search'
                )

            except Exception as e:
                logger.error(f"Error searching {platform}: {str(e)}")
                continue

        # Remove duplicates and apply AI matching
        unique_jobs = job_scraper._remove_duplicates(all_jobs)

        # Get user profile for matching
        db = SessionLocal()
        profile_service = EnhancedProfileService(db)
        profile_data = profile_service.get_application_data(user_id)
        db.close()

        # Apply AI matching if profile exists
        if profile_data:
            user_skills = profile_data.get('skills', {}).get('technical', [])
            user_experience = profile_data.get('professional', {}).get('years_experience', 0)

            for job in unique_jobs:
                try:
                    # Simple matching score based on skills overlap
                    job_desc = job.get('description', '').lower()
                    skill_matches = sum(1 for skill in user_skills if skill.lower() in job_desc)
                    match_score = min(100, (skill_matches / max(len(user_skills), 1)) * 100)
                    job['match_score'] = match_score
                    job['recommended'] = match_score > 60
                except Exception:
                    job['match_score'] = 50
                    job['recommended'] = False

        # Sort by match score
        if profile_data:
            unique_jobs.sort(key=lambda x: x.get('match_score', 0), reverse=True)

        # Limit results
        final_jobs = unique_jobs[:request.limit]

        # Cache results
        job_cache[f"search_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M')}"] = final_jobs

        # Send completion notification
        await websocket_events.on_job_search_completed(
            user_id=user_id,
            results=final_jobs,
            task_id='enhanced_search'
        )

        return {
            'success': True,
            'total_jobs': len(final_jobs),
            'jobs': final_jobs,
            'search_params': {
                'keywords': keywords,
                'location': request.location,
                'platforms_searched': platforms
            },
            'enhanced_features': {
                'ai_matching_applied': bool(profile_data),
                'real_time_updates': True,
                'company_insights_available': True
            }
        }

    except Exception as e:
        logger.error(f"Error in enhanced job search: {str(e)}")
        await websocket_events.on_error_occurred(
            user_id=user_id,
            error_message=str(e),
            task_id='enhanced_search'
        )
        raise HTTPException(status_code=500, detail=str(e))

# System Health and Monitoring
@app.get("/system/health")
async def system_health_check():
    """Comprehensive system health check"""
    try:
        health_status = {
            'api': 'healthy',
            'database': 'unknown',
            'redis': 'unknown',
            'celery': 'unknown',
            'websockets': 'unknown',
            'scraping': 'unknown',
            'timestamp': datetime.now().isoformat()
        }

        # Check database
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            db.close()
            health_status['database'] = 'healthy'
        except Exception:
            health_status['database'] = 'unhealthy'

        # Check Redis/Celery
        try:
            celery_inspect = job_manager.celery_app.control.inspect()
            stats = celery_inspect.stats()
            health_status['redis'] = 'healthy' if stats else 'unhealthy'
            health_status['celery'] = 'healthy' if stats else 'unhealthy'
        except Exception:
            health_status['redis'] = 'unhealthy'
            health_status['celery'] = 'unhealthy'

        # Check WebSocket connections
        active_connections = websocket_manager.get_connection_count()
        health_status['websockets'] = f'healthy ({active_connections} active)'

        # Check scraping
        try:
            test_jobs = await job_scraper.scrape_indeed_async("test", "remote", 1)
            health_status['scraping'] = 'healthy' if isinstance(test_jobs, list) else 'unhealthy'
        except Exception:
            health_status['scraping'] = 'unhealthy'

        return health_status

    except Exception as e:
        return {
            'api': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

# Start WebSocket heartbeat on startup
@app.on_event("startup")
async def startup_event():
    """Initialize background services on startup"""
    try:
        await start_websocket_heartbeat()
        logger.info("WebSocket heartbeat service started")
    except Exception as e:
        logger.error(f"Failed to start WebSocket heartbeat: {str(e)}")

# ...existing endpoints...
