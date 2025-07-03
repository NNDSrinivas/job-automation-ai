from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

# Load your environment variables from backend/.env
load_dotenv(dotenv_path=Path("backend") / ".env")
api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Test: list available models
models = client.models.list()

# Print model IDs to verify everything works
for model in models.data:
    print(model.id)
