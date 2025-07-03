from openai import OpenAI
import os
import re
from datetime import datetime

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_user_details(resume_text):
    name_match = re.search(r'(?i)([A-Z][a-z]+\s+[A-Z][a-z]+)', resume_text)
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', resume_text)
    location_match = re.search(r'(Newark,\s*DE|[A-Z][a-z]+,\s*[A-Z]{2})', resume_text)

    name = name_match.group(1).strip() if name_match else "Your Name"
    email = email_match.group(0).strip() if email_match else "youremail@example.com"
    location = location_match.group(1).strip() if location_match else "Your City, ST"

    return name, location, email

def generate_cover_letter(resume_text, job_description, company, position):
    name, location, email = extract_user_details(resume_text)
    today = datetime.today().strftime("%B %d, %Y")

    prompt = f"""Write a professional and concise cover letter using the details below. Format the letter properly and keep it specific.

Full Name: {name}
Location: {location}
Email: {email}
Date: {today}
Company: {company}
Position: {position}

Resume:
{resume_text}

Job Description:
{job_description}
"""
    resp = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content.strip()

