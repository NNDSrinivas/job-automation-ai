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

from resume_parser import parse_resume
from jd_matcher import match_jd
from cover_letter_generator import generate_cover_letter
from user_profile import extract_user_info
from typing import List, Dict
from resume_storage import upload_resume_to_s3, add_resume, load_user_resumes, get_primary_resume
from db import SessionLocal
from models import Resume, User
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import logging
from datetime import datetime

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
    existing_user = db.query(User).filter((User.username == input.username) | (User.email == input.email)).first()
    if existing_user:
        db.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed_password = pwd_context.hash(input.password)
    user = User(username=input.username, email=input.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    # Email verification (skip in development if SMTP not configured)
    try:
        token = secrets.token_urlsafe(32)
        verification_tokens[user.email] = token
        verify_link = f"https://yourdomain.com/verify-email?token={token}&email={user.email}"
        send_email(user.email, "Verify your email", f"Click to verify: {verify_link}")
        return {"id": user.id, "username": user.username, "email": user.email, "verification_sent": True}
    except Exception as e:
        # For development/testing - return success without email verification
        print(f"Email sending failed (development mode): {e}")
        return {"id": user.id, "username": user.username, "email": user.email, "verification_sent": False, "note": "Email verification skipped in development mode"}

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
