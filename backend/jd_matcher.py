# jd_matcher.py

import os
from openai import OpenAI
from dotenv import load_dotenv
from user_profile import extract_user_info

load_dotenv()


def match_jd(resume_text: str, job_description: str) -> float:
    """
    Uses OpenAI to match a resume against a job description and return a match score.
    """

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")

    client = OpenAI(api_key=api_key)

    prompt = (
        f"Compare the following resume and job description and return a score from 0 to 100 "
        f"indicating how well the resume matches the job:\n\n"
        f"Resume:\n{resume_text}\n\n"
        f"Job Description:\n{job_description}\n\n"
        f"Score (just the number):"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that scores resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        score_text = response.choices[0].message.content.strip()

        # Extract just the number from the response
        import re
        numbers = re.findall(r'\d+\.?\d*', score_text)
        if numbers:
            score = float(numbers[0])
        else:
            print(f"Could not parse score from: {score_text}")
            return 0.0

        return max(0.0, min(100.0, score))  # Clamp between 0 and 100
    except Exception as e:
        print(f"Error from OpenAI API: {e}")
        return 0.0
