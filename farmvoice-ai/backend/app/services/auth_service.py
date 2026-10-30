"""FarmVoice AI - Authentication service layer."""

from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app import db
from app.models.farmer import Farmer


class AuthService:
    """Business logic for registration, login, profile and logout."""

    @staticmethod
    def register(data):
        """Register a new farmer.

        Returns (response_dict, status_code).
        """
        # Check for duplicate username
        existing_username = Farmer.query.filter_by(username=data["username"]).first()
        if existing_username:
            return (
                {
                    "success": False,
                    "message": "Username already exists. Please choose a different username.",
                },
                409,
            )

        # Check for duplicate email
        existing_email = Farmer.query.filter_by(email=data["email"]).first()
        if existing_email:
            return (
                {
                    "success": False,
                    "message": "Email already registered. Please use a different email.",
                },
                409,
            )

        # Hash the password (never store plain text)
        password_hash = generate_password_hash(data["password"])

        farmer = Farmer(
            farm_name=data["farm_name"],
            username=data["username"],
            email=data["email"],
            mobile_number=data["mobile_number"],
            password_hash=password_hash,
        )

        try:
            db.session.add(farmer)
            db.session.flush()  # Obtain the auto-generated farmer_id without committing
            farmer_id = farmer.farmer_id
            db.session.commit()
        except Exception:
            db.session.rollback()
            return (
                {"success": False, "message": "Registration failed. Please try again."},
                500,
            )

        return (
            {
                "success": True,
                "farmer_id": farmer_id,
                "username": farmer.username,
                "message": "Registration successful. Please log in to continue.",
            },
            201,
        )

    @staticmethod
    def login(data):
        """Authenticate a farmer and issue a JWT access token.

        Returns (response_dict, status_code, set_cookie_callable_or_None).
        """
        farmer = Farmer.query.filter_by(username=data["username"]).first()

        # Generic failure message: never reveal whether username or password is wrong
        if not farmer or not check_password_hash(farmer.password_hash, data["password"]):
            return (
                {
                    "success": False,
                    "message": "Invalid username or password.",
                },
                401,
            )

        access_token = create_access_token(identity=str(farmer.farmer_id))

        response = {
            "success": True,
            "message": "Login successful.",
            "farmer": farmer.to_dict(),
            "authenticated": True,
        }

        # The JWT is set as an HttpOnly cookie by Flask-JWT-Extended when
        # JWT_TOKEN_LOCATION=cookies. We return the response and let the
        # view function attach the cookie via set_access_cookies.
        return (
            response,
            200,
            {"access_token": access_token, "farmer_id": farmer.farmer_id},
        )

    @staticmethod
    def profile(farmer_id):
        """Fetch authenticated farmer profile (without password hash)."""
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer not found."},
                404,
            )
        return (
            {"success": True, "farmer": farmer.to_dict()},
            200,
        )

    @staticmethod
    def logout():
        """Logout handler. Cookie clearing is handled in the view."""
        return {"success": True, "message": "Logged out successfully."}
