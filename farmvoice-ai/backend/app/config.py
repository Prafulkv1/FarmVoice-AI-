
"""FarmVoice AI - Application configuration."""

import os
from datetime import timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load environment from backend directory if present, otherwise default search
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_file = os.path.join(_backend_dir, ".env")
if os.path.exists(_env_file):
    load_dotenv(_env_file)
else:
    load_dotenv()


class Config:
    """Base configuration loaded from environment variables."""

    # Application security
    SECRET_KEY = os.environ.get(
        "SECRET_KEY", "dev-secret-key-change-me"
    )

    # MySQL database configuration
    MYSQL_USER = os.environ.get("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
    MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.environ.get("MYSQL_PORT", "3306")
    MYSQL_DB = os.environ.get("MYSQL_DB", "farmvoice_ai_db")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{quote_plus(MYSQL_USER)}:"
        f"{quote_plus(MYSQL_PASSWORD)}@{MYSQL_HOST}:{MYSQL_PORT}/"
        f"{MYSQL_DB}?charset=utf8mb4"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 28000,
    }

    # JWT configuration
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY", "dev-jwt-secret-change-me"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(
            os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", "86400")
        )
    )

    JWT_TOKEN_LOCATION = ["cookies"]

    JWT_ACCESS_COOKIE_NAME = os.environ.get(
        "JWT_ACCESS_COOKIE_NAME", "access_token_cookie"
    )

    JWT_COOKIE_SECURE = (
        os.environ.get("JWT_COOKIE_SECURE", "False").lower() == "true"
    )

    JWT_COOKIE_SAMESITE = os.environ.get(
        "JWT_COOKIE_SAMESITE", "Lax"
    )

    JWT_COOKIE_DOMAIN = os.environ.get("JWT_COOKIE_DOMAIN") or None
    if JWT_COOKIE_DOMAIN and JWT_COOKIE_DOMAIN.lower() in ("none", "false", ""):
        JWT_COOKIE_DOMAIN = None

    JWT_COOKIE_CSRF_PROTECT = True

    JWT_CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"]

    JWT_CSRF_IN_COOKIES = True

    JWT_ACCESS_CSRF_COOKIE_NAME = os.environ.get(
        "JWT_ACCESS_CSRF_COOKIE_NAME", "csrf_access_token_cookie"
    )

    JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"

    JWT_ACCESS_CSRF_FIELD_NAME = "csrf_token"

    JWT_ACCESS_COOKIE_PATH = "/"

    JWT_ACCESS_CSRF_COOKIE_PATH = "/"

    # Frontend CORS configuration
    FRONTEND_URL = os.environ.get(
        "FRONTEND_URL", "http://localhost:5173"
    )

    # AI Provider & Model configuration
    AI_PROVIDER = os.environ.get("AI_PROVIDER", "gemini").lower().strip()
    AI_API_KEY = os.environ.get("AI_API_KEY", "").strip()
    AI_MODEL = os.environ.get("AI_MODEL", "gemini-3.5-flash").strip()
    AI_TEMPERATURE = float(os.environ.get("AI_TEMPERATURE", "0.4"))
    AI_MAX_TOKENS = int(os.environ.get("AI_MAX_TOKENS", "1500"))
    AI_TIMEOUT_SECONDS = int(os.environ.get("AI_TIMEOUT_SECONDS", "30"))
    AI_BASE_URL = os.environ.get("AI_BASE_URL", "").strip()

    # Sarvam AI & Regional Voice Configuration
    SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "").strip()
    SARVAM_BASE_URL = os.environ.get("SARVAM_BASE_URL", "https://api.sarvam.ai").strip().rstrip("/")
    SARVAM_SPEECH_MODEL = os.environ.get("SARVAM_SPEECH_MODEL", "saaras:v2").strip()
    SARVAM_TTS_MODEL = os.environ.get("SARVAM_TTS_MODEL", "bulbul:v1").strip()
    SARVAM_DEFAULT_SPEAKER = os.environ.get("SARVAM_DEFAULT_SPEAKER", "meera").strip()
