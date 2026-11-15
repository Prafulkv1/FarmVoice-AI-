
import requests
from app.config import Config

API_KEY = Config.AI_API_KEY
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

if not API_KEY:
    raise RuntimeError("Gemini API key is not loaded.")

headers = {
    "x-goog-api-key": API_KEY,
    "Content-Type": "application/json",
}

# Retrieve models available to this API key.
list_response = requests.get(
    f"{BASE_URL}/models",
    headers=headers,
    params={"pageSize": 1000},
    timeout=30,
)

print("Model list HTTP status:", list_response.status_code)

if not list_response.ok:
    print(list_response.text)
    raise SystemExit()

models = list_response.json().get("models", [])

# Test preferred models only if the API reports generateContent support.
preferred = [
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
]

available = {
    model["name"].removeprefix("models/"): model
    for model in models
    if "generateContent" in model.get("supportedGenerationMethods", [])
}

candidates = [name for name in preferred if name in available]

if not candidates:
    print("No preferred model supporting generateContent was found.")
    print("Available models:", list(available.keys()))
    raise SystemExit()

for model in candidates:
    print(f"\nTesting model: {model}")

    response = requests.post(
        f"{BASE_URL}/models/{model}:generateContent",
        headers=headers,
        json={
            "contents": [
                {
                    "parts": [
                        {"text": "Reply with: FarmVoice AI connection successful."}
                    ]
                }
            ]
        },
        timeout=60,
    )

    print("HTTP status:", response.status_code)

    try:
        result = response.json()
    except ValueError:
        print("Response:", response.text[:2000])
        continue

    if response.ok:
        text = (
            result.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "No text returned")
        )
        print("SUCCESS:", text)
        break

    print("API error:", result)
else:
    print("\nAll tested models failed. See the API errors above.")
