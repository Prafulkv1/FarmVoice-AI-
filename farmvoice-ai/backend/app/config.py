
"""FarmVoice AI - Application configuration."""

import os
from datetime import timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv

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

    JWT_COOKIE_DOMAIN = None

    JWT_COOKIE_CSRF_PROTECT = True

    JWT_CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"]

    JWT_CSRF_IN_COOKIES = True

    JWT_ACCESS_CSRF_COOKIE_NAME = os.environ.get(
        "JWT_ACCESS_CSRF_COOKIE_NAME", "csrf_access_token"
    )

    JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"

    JWT_ACCESS_CSRF_FIELD_NAME = "csrf_token"

    JWT_ACCESS_COOKIE_PATH = "/api"

    JWT_ACCESS_CSRF_COOKIE_PATH = "/api"

    # Frontend CORS configuration
    FRONTEND_URL = os.environ.get(
        "FRONTEND_URL", "http://localhost:5173"
    )
