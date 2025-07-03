def extract_user_info(resume_text):
    lines = resume_text.splitlines()
    name = lines[0].strip() if lines else "Unknown"
    email = next((line for line in lines if "@" in line), "email@example.com")
    location = next((line for line in lines if "Newark" in line or "DE" in line), "Location Unknown")

    return {
        "name": name,
        "email": email,
        "location": location
    }
