import tempfile
import os
import secrets
import smtplib
import json
import logging
import re
import time
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import HTTPException, status
from pydantic import BaseModel
from auth import authenticate_user, create_access_token
from email.message import EmailMessage
from sqlalchemy.orm import Session

from resume_parser import parse_resume
from jd_matcher import match_jd
from cover_letter_generator import generate_cover_letter
from user_profile import extract_user_info
from typing import List, Dict, Optional
from resume_storage import upload_resume_to_s3, add_resume, load_user_resumes, get_primary_resume
from db import SessionLocal, engine, Base
from models import Resume, User, Job, JobApplication, JobPortalCredential, QuestionnaireAnswer, AutomationSetting
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta

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
from automation_scheduler import start_automation_scheduler, stop_automation_scheduler
from automation_engine import automation_engine, get_automation_status

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# Create database tables
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

def get_current_user_full(token: str = Depends(oauth2_scheme)):
    """Get full user data including profile info"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get full user data from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "created_at": user.id  # Use id as placeholder for created_at if no field exists
            }
        finally:
            db.close()

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoint: Upload Resume and extract user info
@app.options("/upload-resume")
async def upload_resume_options():
    return {"message": "OK"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), current_user_id: int = Depends(get_current_user)):
    try:
        # Check user's resume count
        db = SessionLocal()
        try:
            resume_count = db.query(Resume).filter(Resume.user_id == current_user_id).count()
            if resume_count >= 5:
                raise HTTPException(status_code=400, detail="Maximum 5 resumes allowed per user")

            # Read file content
            file_content = await file.read()
            file_size = len(file_content)

            # Save to temporary file for parsing
            suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_content)
                tmp_path = tmp.name

            # Parse resume with AI analysis
            try:
                from ai_resume_analyzer import resume_analyzer
                parsed_data = resume_analyzer.parse_resume(tmp_path)

                # Extract user info for backward compatibility
                user_info = {
                    'name': parsed_data.get('name', ''),
                    'email': parsed_data.get('email', ''),
                    'phone': parsed_data.get('phone', ''),
                    'skills': parsed_data.get('skills', []),
                    'summary': parsed_data.get('summary', ''),
                    'experience': parsed_data.get('experience', []),
                    'education': parsed_data.get('education', [])
                }
            except Exception as e:
                print(f"AI Resume parsing error: {e}")
                # Fallback to basic parsing
                try:
                    parsed_data = parse_resume(tmp_path)
                    user_info = extract_user_info(parsed_data) if parsed_data else {}
                except Exception as e2:
                    print(f"Basic parsing error: {e2}")
                    parsed_data = {"error": str(e), "fallback_error": str(e2)}
                    user_info = {}

            # Upload to S3 (mock for now)
            try:
                s3_url = upload_resume_to_s3(tmp_path, file.filename, str(current_user_id))
            except Exception as e:
                print(f"S3 upload error: {e}")
                s3_url = f"local://uploads/{file.filename}"

            # Check if this should be primary (first resume)
            is_primary = resume_count == 0

            # Store resume metadata in DB
            db_resume = Resume(
                filename=file.filename,
                s3_url=s3_url,
                user_id=current_user_id,
                is_primary=is_primary,
                parsed_data=parsed_data,
                file_size=file_size
            )
            db.add(db_resume)
            db.commit()
            db.refresh(db_resume)

            # Clean up temp file
            import os
            os.unlink(tmp_path)

            return {
                "message": "Resume uploaded successfully",
                "user_info": user_info,
                "resume_url": s3_url,
                "db_id": db_resume.id,
                "parsed_data": parsed_data
            }
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload resume error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Get all resumes for current user
@app.get("/resumes")
async def get_resumes(current_user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    try:
        resumes = db.query(Resume).filter(Resume.user_id == current_user_id).order_by(Resume.uploaded_at.desc()).all()

        result = []
        for resume in resumes:
            result.append({
                "id": str(resume.id),
                "name": resume.filename,
                "uploadDate": resume.uploaded_at.isoformat(),
                "isPrimary": resume.is_primary,
                "size": f"{(resume.file_size / 1024):.1f} KB" if resume.file_size else "Unknown",
                "parsedData": resume.parsed_data
            })

        return result
    finally:
        db.close()

# Set primary resume
@app.post("/resumes/{resume_id}/set-primary")
async def set_primary_resume(resume_id: int, current_user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    try:
        # Verify resume belongs to user
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Set all resumes to non-primary
        db.query(Resume).filter(Resume.user_id == current_user_id).update({"is_primary": False})

        # Set selected resume as primary
        resume.is_primary = True
        db.commit()

        return {"message": "Primary resume updated"}
    finally:
        db.close()

# Delete resume
@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: int, current_user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    try:
        # Verify resume belongs to user
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        was_primary = resume.is_primary
        db.delete(resume)
        db.commit()

        # If deleted resume was primary, set first available as primary
        if was_primary:
            first_resume = db.query(Resume).filter(Resume.user_id == current_user_id).first()
            if first_resume:
                first_resume.is_primary = True
                db.commit()

        return {"message": "Resume deleted successfully"}
    finally:
        db.close()

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
async def login(username: str = Form(...), password: str = Form(...)):
    db = SessionLocal()
    try:
        # Check if username is email or username
        if "@" in username:
            user = db.query(User).filter(User.email == username).first()
        else:
            user = db.query(User).filter(User.username == username).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email/username or password"
            )

        if not pwd_context.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email/username or password"
            )

        token = create_access_token({"sub": user.username, "user_id": user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }
    finally:
        db.close()

@app.post("/token")
async def login_for_access_token(username: str = Form(...), password: str = Form(...)):
    """OAuth2 compatible token login endpoint"""
    return await login(username, password)

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
async def get_application_stats(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    try:
        print(f"Fetching stats for user_id: {user_id}")
        # Count applications by status
        applications = db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
        print(f"Found {len(applications)} applications for user {user_id}")

        applied = len(applications)
        interviewed = len([app for app in applications if app.status in ['interview_scheduled', 'interviewed']])
        denied = len([app for app in applications if app.status in ['rejected', 'declined']])
        success_rate = round((interviewed / applied * 100) if applied > 0 else 0, 1)

        result = {
            "applied": applied,
            "interviewed": interviewed,
            "denied": denied,
            "success_rate": success_rate
        }
        print(f"Returning stats: {result}")
        return result
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "applied": 0,
            "interviewed": 0,
            "denied": 0,
            "success_rate": 0
        }
    finally:
        db.close()

@app.get('/api/analytics/dashboard')
async def get_analytics_dashboard(user_id: int = Depends(get_current_user)):
    """Get comprehensive analytics dashboard data"""
    db = SessionLocal()
    try:
        # Import analytics engine here to avoid circular imports
        from analytics_engine import AnalyticsEngine

        analytics = AnalyticsEngine(db)
        dashboard_data = analytics.get_user_dashboard_data(user_id)

        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting analytics dashboard: {e}")
        # Return mock data as fallback
        from analytics_engine import AnalyticsEngine
        analytics = AnalyticsEngine(db)
        return analytics.get_mock_dashboard_data()
    finally:
        db.close()

@app.get('/api/mentor/guidance')
async def get_mentor_guidance(user_id: int = Depends(get_current_user)):
    """Get personalized mentor guidance"""
    db = SessionLocal()
    try:
        from mentor_bot import MentorBot

        mentor = MentorBot(db)
        guidance = mentor.get_personalized_guidance(user_id)

        return guidance
    except Exception as e:
        logger.error(f"Error getting mentor guidance: {e}")
        return {
            "animal_mentor": "Dolphin",
            "message": "Keep up the great work! Your job search is on track.",
            "tips": ["Focus on quality over quantity", "Network with industry professionals"],
            "motivation": "Every application is a step closer to your dream job!"
        }
    finally:
        db.close()

@app.post('/api/automation/smart-apply')
async def smart_auto_apply(user_id: int = Depends(get_current_user)):
    """Start smart auto-application process"""
    db = SessionLocal()
    try:
        from smart_auto_applier import SmartAutoApplier

        auto_applier = SmartAutoApplier(db)
        result = await auto_applier.start_smart_application_process(user_id)

        return {"message": "Smart auto-application started", "details": result}
    except Exception as e:
        logger.error(f"Error starting smart auto-apply: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start smart auto-apply: {str(e)}")
    finally:
        db.close()

class RegisterInput(BaseModel):
    email: str
    password: str
    full_name: str
    username: str = None  # Optional username field

@app.post("/register")
async def register(input: RegisterInput):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == input.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        # Check if username is provided and unique
        if input.username:
            existing_username = db.query(User).filter(User.username == input.username).first()
            if existing_username:
                raise HTTPException(status_code=400, detail="Username already exists")
            username = input.username
        else:
            # Use email as username if no username provided
            username = input.email.split('@')[0]  # Extract username from email
            # Check if auto-generated username exists and make it unique
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

        hashed_password = pwd_context.hash(input.password)

        # Parse full_name into first_name and last_name
        name_parts = input.full_name.strip().split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = User(
            username=username,
            email=input.email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name
        )
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
async def get_profile(current_user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user_id).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "email": user.email}

@app.put("/profile")
async def update_profile(update: UserProfileUpdate, current_user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.id == current_user_id).first()
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

# Debug endpoint to create test applications (remove in production)
@app.post('/create-test-applications')
async def create_test_applications(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    try:
        # Create a fake job first
        test_job = Job(
            title="Software Engineer",
            company="Test Company",
            location="Remote",
            description="Test job description",
            url=f"https://test.com/job/{user_id}",
            platform="test"
        )
        db.add(test_job)
        db.commit()
        db.refresh(test_job)

        # Create test applications
        app1 = JobApplication(user_id=user_id, job_id=test_job.id, status="applied")
        app2 = JobApplication(user_id=user_id, job_id=test_job.id, status="interview_scheduled")
        app3 = JobApplication(user_id=user_id, job_id=test_job.id, status="rejected")

        db.add_all([app1, app2, app3])
        db.commit()

        return {"message": "Test applications created", "count": 3}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

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

        # Start automation scheduler
        start_automation_scheduler()
        logger.info("Automation scheduler started")
    except Exception as e:
        logger.error(f"Failed to start background services: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup background services on shutdown"""
    try:
        stop_automation_scheduler()
        logger.info("Automation scheduler stopped")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Job Portal Credentials Models and Endpoints
class JobPortalCredentialCreate(BaseModel):
    platform: str
    username: str
    password: str
    additional_data: Optional[Dict] = {}

class JobPortalCredentialResponse(BaseModel):
    id: int
    platform: str
    username: str
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime] = None

class JobPortalCredentialUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    additional_data: Optional[Dict] = None
    is_active: Optional[bool] = None

# Questionnaire Models and Endpoints
class StandardizedQuestion(BaseModel):
    key: str
    text: str
    type: str = "text"

STANDARDIZED_QUESTIONS = [
    StandardizedQuestion(key="firstName", text="What is your first name?", type="text"),
    StandardizedQuestion(key="middleName", text="What is your middle name?", type="text"),
    StandardizedQuestion(key="lastName", text="What is your last name?", type="text"),
    StandardizedQuestion(key="preferredFirstName", text="Preferred first name (if different)?", type="text"),
    StandardizedQuestion(key="email", text="What is your email address?", type="text"),
    StandardizedQuestion(key="username", text="Choose a username for job portals", type="text"),
    StandardizedQuestion(key="phone", text="What is your phone number?", type="text"),
    StandardizedQuestion(key="address", text="What is your current address?", type="text"),
    StandardizedQuestion(key="profilePicture", text="Upload a profile picture (optional)", type="file"),
    StandardizedQuestion(key="workAuth", text="Are you authorized to work in your country?", type="boolean"),
    StandardizedQuestion(key="visaStatus", text="What is your visa status?", type="text"),
    StandardizedQuestion(key="needSponsorship", text="Do you need sponsorship?", type="boolean"),
    StandardizedQuestion(key="race", text="What is your race/ethnicity?", type="select"),
    StandardizedQuestion(key="veteranStatus", text="Are you a veteran or have veteran service?", type="boolean"),
    StandardizedQuestion(key="disabilityStatus", text="Do you have a disability?", type="boolean"),
    StandardizedQuestion(key="relocate", text="Are you willing to relocate?", type="boolean"),
    StandardizedQuestion(key="salaryExpectation", text="What is your expected salary?", type="number"),
    StandardizedQuestion(key="skills", text="List your top skills", type="text"),
    StandardizedQuestion(key="experienceYears", text="How many years of experience do you have?", type="number"),
    StandardizedQuestion(key="linkedinUrl", text="Your LinkedIn profile URL", type="text"),
    StandardizedQuestion(key="certifications", text="Add certifications (if not in resume)", type="text"),
    StandardizedQuestion(key="education", text="Add education details (if not in resume)", type="text"),
]

class QuestionnaireAnswerCreate(BaseModel):
    question_key: str
    question_text: str
    answer: str
    question_type: str = "text"

class QuestionnaireAnswerResponse(BaseModel):
    id: int
    question_key: str
    question_text: str
    answer: str
    question_type: str
    created_at: datetime
    updated_at: datetime

class QuestionnaireAnswerUpdate(BaseModel):
    answer: str

# Automation Settings Models and Endpoints
class AutomationSettingCreate(BaseModel):
    max_applications_per_day: int = 10
    match_threshold: float = 0.7
    enabled_platforms: List[str] = []
    preferred_locations: List[str] = []
    salary_range_min: Optional[int] = None
    salary_range_max: Optional[int] = None
    job_types: List[str] = []
    experience_levels: List[str] = []
    keywords_include: List[str] = []
    keywords_exclude: List[str] = []
    is_active: bool = True
    schedule_enabled: bool = False
    schedule_start_time: Optional[str] = None
    schedule_end_time: Optional[str] = None
    schedule_days: List[str] = []

class AutomationSettingResponse(BaseModel):
    id: int
    max_applications_per_day: int
    match_threshold: float
    enabled_platforms: List[str]
    preferred_locations: List[str]
    salary_range_min: Optional[int]
    salary_range_max: Optional[int]
    job_types: List[str]
    experience_levels: List[str]
    keywords_include: List[str]
    keywords_exclude: List[str]
    is_active: bool
    schedule_enabled: bool
    schedule_start_time: Optional[str]
    schedule_end_time: Optional[str]
    schedule_days: List[str]
    created_at: datetime
    updated_at: datetime

# Import credential encryption
from credential_encryption import credential_encryption

# Job Portal Credentials Endpoints
@app.post("/job-portal-credentials", response_model=JobPortalCredentialResponse)
async def create_job_portal_credential(
    credential_data: JobPortalCredentialCreate,
    current_user_id: int = Depends(get_current_user)
):
    """Create new job portal credentials"""
    try:
        db = SessionLocal()

        # Check if credentials already exist for this platform
        existing = db.query(JobPortalCredential).filter(
            JobPortalCredential.user_id == current_user_id,
            JobPortalCredential.platform == credential_data.platform
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Credentials for {credential_data.platform} already exist"
            )

        # Encrypt password
        encrypted_password = credential_encryption.encrypt_password(credential_data.password)

        # Create new credential
        credential = JobPortalCredential(
            user_id=current_user_id,
            platform=credential_data.platform,
            username=credential_data.username,
            encrypted_password=encrypted_password,
            additional_data=credential_data.additional_data
        )

        db.add(credential)
        db.commit()
        db.refresh(credential)

        return JobPortalCredentialResponse(
            id=credential.id,
            platform=credential.platform,
            username=credential.username,
            is_active=credential.is_active,
            created_at=credential.created_at,
            last_used=credential.last_used
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/job-portal-credentials", response_model=List[JobPortalCredentialResponse])
async def get_job_portal_credentials(current_user_id: int = Depends(get_current_user)):
    """Get all job portal credentials for current user"""
    try:
        db = SessionLocal()
        credentials = db.query(JobPortalCredential).filter(
            JobPortalCredential.user_id == current_user_id
        ).all()

        return [
            JobPortalCredentialResponse(
                id=cred.id,
                platform=cred.platform,
                username=cred.username,
                is_active=cred.is_active,
                created_at=cred.created_at,
                last_used=cred.last_used
            )
            for cred in credentials
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.put("/job-portal-credentials/{credential_id}", response_model=JobPortalCredentialResponse)
async def update_job_portal_credential(
    credential_id: int,
    credential_data: JobPortalCredentialUpdate,
    current_user_id: int = Depends(get_current_user)
):
    """Update job portal credentials"""
    try:
        db = SessionLocal()
        credential = db.query(JobPortalCredential).filter(
            JobPortalCredential.id == credential_id,
            JobPortalCredential.user_id == current_user_id
        ).first()

        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        # Update fields
        if credential_data.username is not None:
            credential.username = credential_data.username
        if credential_data.password is not None:
            credential.encrypted_password = credential_encryption.encrypt_password(credential_data.password)
        if credential_data.additional_data is not None:
            credential.additional_data = credential_data.additional_data
        if credential_data.is_active is not None:
            credential.is_active = credential_data.is_active

        db.commit()
        db.refresh(credential)

        return JobPortalCredentialResponse(
            id=credential.id,
            platform=credential.platform,
            username=credential.username,
            is_active=credential.is_active,
            created_at=credential.created_at,
            last_used=credential.last_used
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.delete("/job-portal-credentials/{credential_id}")
async def delete_job_portal_credential(
    credential_id: int,
    current_user_id: int = Depends(get_current_user)
):
    """Delete job portal credentials"""
    try:
        db = SessionLocal()
        credential = db.query(JobPortalCredential).filter(
            JobPortalCredential.id == credential_id,
            JobPortalCredential.user_id == current_user_id
        ).first()

        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        db.delete(credential)
        db.commit()

        return {"message": "Credential deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Questionnaire Endpoints
from fastapi import Form

# Profile Picture Upload Endpoint
@app.post("/profile/picture")
async def upload_profile_picture(file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
    """Upload profile picture for user"""
    db = SessionLocal()
    try:
        suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        # Upload to S3 or local storage (mock for now)
        s3_url = upload_resume_to_s3(tmp_path, file.filename, str(user_id))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.profile_picture_url = s3_url
        db.commit()
        return {"profile_picture_url": s3_url}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")
    finally:
        db.close()

# Certifications Endpoint
@app.post("/profile/certifications")
async def add_certifications(certifications: str = Form(...), user_id: int = Depends(get_current_user)):
    """Add certifications for user"""
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    user.certifications = certifications
    db.commit()
    db.close()
    return {"certifications": certifications}

# Education Endpoint
@app.post("/profile/education")
async def add_education(education: str = Form(...), user_id: int = Depends(get_current_user)):
    """Add education details for user"""
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    user.education = education
    db.commit()
    db.close()
    return {"education": education}
@app.get("/questionnaire-questions", response_model=List[StandardizedQuestion])
async def get_standardized_questions():
    """Get all standardized questions for onboarding and auto-fill"""
    return STANDARDIZED_QUESTIONS
@app.post("/questionnaire-answers", response_model=QuestionnaireAnswerResponse)
async def create_questionnaire_answer(
    answer_data: QuestionnaireAnswerCreate,
    current_user: User = Depends(get_current_user)
):
    """Create or update questionnaire answer"""
    try:
        db = SessionLocal()

        # Check if answer already exists
        existing = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.user_id == current_user.id,
            QuestionnaireAnswer.question_key == answer_data.question_key
        ).first()

        if existing:
            # Update existing answer
            existing.answer = answer_data.answer
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            answer = existing
        else:
            # Create new answer
            answer = QuestionnaireAnswer(
                user_id=current_user.id,
                question_key=answer_data.question_key,
                question_text=answer_data.question_text,
                answer=answer_data.answer,
                question_type=answer_data.question_type
            )
            db.add(answer)
            db.commit()
            db.refresh(answer)

        return QuestionnaireAnswerResponse(
            id=answer.id,
            question_key=answer.question_key,
            question_text=answer.question_text,
            answer=answer.answer,
            question_type=answer.question_type,
            created_at=answer.created_at,
            updated_at=answer.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/questionnaire-answers", response_model=List[QuestionnaireAnswerResponse])
async def get_questionnaire_answers(current_user: User = Depends(get_current_user)):
    """Get all questionnaire answers for current user"""
    try:
        db = SessionLocal()
        answers = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.user_id == current_user.id
        ).all()

        return [
            QuestionnaireAnswerResponse(
                id=answer.id,
                question_key=answer.question_key,
                question_text=answer.question_text,
                answer=answer.answer,
                question_type=answer.question_type,
                created_at=answer.created_at,
                updated_at=answer.updated_at
            )
            for answer in answers
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.put("/questionnaire-answers/{answer_id}", response_model=QuestionnaireAnswerResponse)
async def update_questionnaire_answer(
    answer_id: int,
    answer_data: QuestionnaireAnswerUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update questionnaire answer"""
    try:
        db = SessionLocal()
        answer = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.id == answer_id,
            QuestionnaireAnswer.user_id == current_user.id
        ).first()

        if not answer:
            raise HTTPException(status_code=404, detail="Answer not found")

        answer.answer = answer_data.answer
        answer.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(answer)

        return QuestionnaireAnswerResponse(
            id=answer.id,
            question_key=answer.question_key,
            question_text=answer.question_text,
            answer=answer.answer,
            question_type=answer.question_type,
            created_at=answer.created_at,
            updated_at=answer.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Automation Settings Endpoints
@app.post("/automation-settings", response_model=AutomationSettingResponse)
async def create_automation_settings(
    settings_data: AutomationSettingCreate,
    current_user: User = Depends(get_current_user)
):
    """Create or update automation settings"""
    try:
        db = SessionLocal()

        # Check if settings already exist
        existing = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        if existing:
            # Update existing settings
            for field, value in settings_data.dict().items():
                setattr(existing, field, value)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            settings = existing
        else:
            # Create new settings
            settings = AutomationSetting(
                user_id=current_user.id,
                **settings_data.dict()
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        return AutomationSettingResponse(
            id=settings.id,
            max_applications_per_day=settings.max_applications_per_day,
            match_threshold=settings.match_threshold,
            enabled_platforms=settings.enabled_platforms,
            preferred_locations=settings.preferred_locations,
            salary_range_min=settings.salary_range_min,
            salary_range_max=settings.salary_range_max,
            job_types=settings.job_types,
            experience_levels=settings.experience_levels,
            keywords_include=settings.keywords_include,
            keywords_exclude=settings.keywords_exclude,
            is_active=settings.is_active,
            schedule_enabled=settings.schedule_enabled,
            schedule_start_time=settings.schedule_start_time,
            schedule_end_time=settings.schedule_end_time,
            schedule_days=settings.schedule_days,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/automation-settings", response_model=AutomationSettingResponse)
async def get_automation_settings(current_user: User = Depends(get_current_user)):
    """Get automation settings for current user"""
    try:
        db = SessionLocal()
        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        if not settings:
            raise HTTPException(status_code=404, detail="Automation settings not found")

        return AutomationSettingResponse(
            id=settings.id,
            max_applications_per_day=settings.max_applications_per_day,
            match_threshold=settings.match_threshold,
            enabled_platforms=settings.enabled_platforms,
            preferred_locations=settings.preferred_locations,
            salary_range_min=settings.salary_range_min,
            salary_range_max=settings.salary_range_max,
            job_types=settings.job_types,
            experience_levels=settings.experience_levels,
            keywords_include=settings.keywords_include,
            keywords_exclude=settings.keywords_exclude,
            is_active=settings.is_active,
            schedule_enabled=settings.schedule_enabled,
            schedule_start_time=settings.schedule_start_time,
            schedule_end_time=settings.schedule_end_time,
            schedule_days=settings.schedule_days,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.put("/automation-settings", response_model=AutomationSettingResponse)
async def update_automation_settings(
    settings_data: AutomationSettingCreate,
    current_user: User = Depends(get_current_user)
):
    """Update automation settings"""
    try:
        db = SessionLocal()
        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        if not settings:
            # Create if doesn't exist
            settings = AutomationSetting(
                user_id=current_user.id,
                **settings_data.dict()
            )
            db.add(settings)
        else:
            # Update existing
            for field, value in settings_data.dict().items():
                setattr(settings, field, value)
            settings.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(settings)

        return AutomationSettingResponse(
            id=settings.id,
            max_applications_per_day=settings.max_applications_per_day,
            match_threshold=settings.match_threshold,
            enabled_platforms=settings.enabled_platforms,
            preferred_locations=settings.preferred_locations,
            salary_range_min=settings.salary_range_min,
            salary_range_max=settings.salary_range_max,
            job_types=settings.job_types,
            experience_levels=settings.experience_levels,
            keywords_include=settings.keywords_include,
            keywords_exclude=settings.keywords_exclude,
            is_active=settings.is_active,
            schedule_enabled=settings.schedule_enabled,
            schedule_start_time=settings.schedule_start_time,
            schedule_end_time=settings.schedule_end_time,
            schedule_days=settings.schedule_days,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Start Automation Endpoint
@app.post("/start-automation")
async def start_automation(current_user: User = Depends(get_current_user)):
    """Start the automated job application process"""
    try:
        db = SessionLocal()

        # Check if user has automation settings
        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        if not settings or not settings.is_active:
            raise HTTPException(
                status_code=400,
                detail="Automation settings not configured or disabled"
            )

        # Check if user has job portal credentials
        credentials = db.query(JobPortalCredential).filter(
            JobPortalCredential.user_id == current_user.id,
            JobPortalCredential.is_active == True
        ).all()

        if not credentials:
            raise HTTPException(
                status_code=400,
                detail="No active job portal credentials found"
            )

        # Start background automation task
        from celery_config import celery_app
        task = celery_app.send_task(
            'tasks.automated_job_application',
            args=[current_user.id],
            kwargs={}
        )

        return {
            "message": "Automation started successfully",
            "task_id": task.id,
            "settings": {
                "max_applications_per_day": settings.max_applications_per_day,
                "enabled_platforms": settings.enabled_platforms,
                "match_threshold": settings.match_threshold
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.post("/stop-automation")
async def stop_automation(current_user: User = Depends(get_current_user)):
    """Stop the automated job application process"""
    try:
        db = SessionLocal()

        # Update automation settings to inactive
        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        if settings:
            settings.is_active = False
            settings.updated_at = datetime.utcnow()
            db.commit()

        return {"message": "Automation stopped successfully"}

    except Exception as e:
        return {"error": f"Failed to stop automation: {str(e)}"}
    finally:
        db.close()

@app.get("/automation-engine/status")
async def get_automation_engine_status(current_user: User = Depends(get_current_user)):
    """Get the status of the 24/7 automation engine"""
    try:
        status = get_automation_status()
        return {
            "status": "success",
            "data": status
        }
    except Exception as e:
        return {"error": f"Failed to get automation status: {str(e)}"}

@app.post("/automation-engine/start")
async def start_automation_engine_endpoint(current_user: User = Depends(get_current_user)):
    """Start the 24/7 automation engine"""
    try:
        if not automation_engine.is_running:
            # Start the engine in the background
            import asyncio
            asyncio.create_task(automation_engine.start_engine())
            return {"message": "24/7 Automation Engine started successfully"}
        else:
            return {"message": "Automation Engine is already running"}
    except Exception as e:
        return {"error": f"Failed to start automation engine: {str(e)}"}

@app.post("/automation-engine/stop")
async def stop_automation_engine_endpoint(current_user: User = Depends(get_current_user)):
    """Stop the 24/7 automation engine"""
    try:
        await automation_engine.stop_engine()
        return {"message": "24/7 Automation Engine stopped successfully"}
    except Exception as e:
        return {"error": f"Failed to stop automation engine: {str(e)}"}

@app.get("/automation-engine/stats")
async def get_automation_stats(current_user: User = Depends(get_current_user)):
    """Get detailed automation statistics"""
    try:
        db = SessionLocal()

        # Get user's automation settings
        settings = db.query(AutomationSetting).filter(
            AutomationSetting.user_id == current_user.id
        ).first()

        # Get application stats
        today = datetime.now().date()
        applications_today = db.query(JobApplication).filter(
            JobApplication.user_id == current_user.id,
            JobApplication.created_at >= today
        ).count()

        # Get connected portals
        connected_portals = db.query(JobPortalCredential).filter(
            JobPortalCredential.user_id == current_user.id
        ).count()

        # Get pending questions
        pending_questions = db.query(QuestionnaireAnswer).filter(
            QuestionnaireAnswer.user_id == current_user.id,
            QuestionnaireAnswer.answer.is_(None)
        ).count()

        return {
            "automation_enabled": settings.auto_apply_enabled if settings else False,
            "applications_today": applications_today,
            "max_daily_applications": settings.max_applications_per_day if settings else 0,
            "connected_portals": connected_portals,
            "pending_questions": pending_questions,
            "engine_status": get_automation_status(),
            "working_hours": {
                "start": settings.working_hours_start if settings else "09:00",
                "end": settings.working_hours_end if settings else "17:00",
                "weekends_enabled": settings.enable_weekends if settings else False
            }
        }

    except Exception as e:
        return {"error": f"Failed to get automation stats: {str(e)}"}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
