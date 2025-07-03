import os
from pathlib import Path
import json

STORAGE_DIR = Path(__file__).resolve().parent / "resume_storage"
STORAGE_DIR.mkdir(exist_ok=True)

MAX_RESUMES = 5

def get_user_resume_path(user_id: str) -> Path:
    return STORAGE_DIR / f"{user_id}.json"

def load_user_resumes(user_id: str):
    path = get_user_resume_path(user_id)
    if not path.exists():
        return []
    with open(path, "r") as f:
        return json.load(f)

def save_user_resumes(user_id: str, resumes):
    with open(get_user_resume_path(user_id), "w") as f:
        json.dump(resumes, f, indent=2)

def add_resume(user_id: str, filename: str, resume_text: str):
    resumes = load_user_resumes(user_id)
    if len(resumes) >= MAX_RESUMES:
        return {"error": "Resume limit exceeded"}

    is_primary = len(resumes) == 0
    new_entry = {
        "filename": filename,
        "content": resume_text,
        "is_primary": is_primary
    }
    resumes.append(new_entry)
    save_user_resumes(user_id, resumes)
    return new_entry

def get_primary_resume(user_id: str):
    for resume in load_user_resumes(user_id):
        if resume.get("is_primary"):
            return resume
    return None
