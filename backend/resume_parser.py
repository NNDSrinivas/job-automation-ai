import re
from docx import Document
from user_profile import extract_user_info

def parse_resume(file_path: str) -> dict:
    document = Document(file_path)
    full_text = []
    for para in document.paragraphs:
        full_text.append(para.text)
    text = "\n".join(full_text)

    extracted_data = {
        "name": extract_name_from_filename(file_path),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "location": extract_location(text),
        "skills": extract_skills(text),
        "summary": extract_summary(text)
    }

    return extracted_data

def extract_name_from_filename(file_path: str) -> str:
    import os
    filename = os.path.basename(file_path)
    name_part = filename.split("_Resume")[0].replace("_", " ")
    return name_part.strip()

def extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+", text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    match = re.search(r"(\+\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})", text)
    return match.group(0) if match else ""

def extract_location(text: str) -> str:
    lines = text.splitlines()
    for line in lines:
        if "location" in line.lower():
            return line.split(":")[-1].strip()
    return ""

def extract_skills(text: str) -> list:
    keywords = ["Java", "Spring Boot", "Python", "FastAPI", "React", "Node.js", "Docker", "Kubernetes", "AWS"]
    return [word for word in keywords if word.lower() in text.lower()]

def extract_summary(text: str) -> str:
    summary = ""
    lines = text.splitlines()
    capturing = False
    for line in lines:
        if "PROFESSIONAL SUMMARY" in line.upper():
            capturing = True
            continue
        if capturing:
            if line.strip() == "":
                break
            summary += line.strip() + " "
    return summary.strip()
