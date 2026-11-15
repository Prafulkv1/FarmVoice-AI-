import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("AI_API_KEY")

if not api_key:
    raise ValueError("AI_API_KEY is missing from .env")

url = "https://generativelanguage.googleapis.com/v1beta/models"

response = requests.get(
    url,
    params={"key": api_key},
    timeout=30
)

response.raise_for_status()

for model in response.json().get("models", []):
    methods = model.get("supportedGenerationMethods", [])

    if "generateContent" in methods:
        print(model["name"], methods)