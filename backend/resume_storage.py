import os
from pathlib import Path
import json
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError

STORAGE_DIR = Path(__file__).resolve().parent / "resume_storage"
STORAGE_DIR.mkdir(exist_ok=True)

MAX_RESUMES = 5

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def upload_resume_to_s3(file_path: str, filename: str, user_id: str) -> str:
    try:
        s3_key = f"resumes/{user_id}/{filename}"
        s3_client.upload_file(file_path, AWS_S3_BUCKET, s3_key)
        s3_url = f"https://{AWS_S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        return s3_url
    except (BotoCoreError, NoCredentialsError) as e:
        print(f"S3 upload error: {e}")
        return ""

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
