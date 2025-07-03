from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile

from resume_parser import parse_resume
from jd_matcher import match_jd
from cover_letter_generator import generate_cover_letter
from user_profile import extract_user_info

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

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

# Endpoint: Upload Resume and extract user info
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    resume_txt = parse_resume(tmp_path)
    user_info = extract_user_info(resume_txt)

    return {
        "resume_text": resume_txt[:1000],  # Limit preview to avoid overload
        "user_info": user_info
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

from resume_storage import add_resume, load_user_resumes, get_primary_resume

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user_id: str = "demo_user"):
    suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    resume_txt = parse_resume(tmp_path)
    user_info = extract_user_info(resume_txt)

    result = add_resume(user_id, file.filename, resume_txt)
    if "error" in result:
        return result

    return {
        "resume_text": resume_txt[:1000],
        "user_info": user_info,
        "stored": result
    }

@app.get("/user-resumes")
async def get_user_resumes(user_id: str = "demo_user"):
    return load_user_resumes(user_id)

@app.get("/primary-resume")
async def get_primary(user_id: str = "demo_user"):
    return get_primary_resume(user_id)
