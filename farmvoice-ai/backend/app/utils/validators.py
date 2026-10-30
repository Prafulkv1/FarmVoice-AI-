"""FarmVoice AI - Request validation helpers."""

import re


EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")


def validate_registration(data):
    """Validate registration payload.

    Returns (errors_dict, None) on failure or (None, cleaned_data) on success.
    """
    errors = {}

    farm_name = (data.get("farm_name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    mobile_number = (data.get("mobile_number") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not farm_name:
        errors["farm_name"] = "Farm name is required."
    elif len(farm_name) > 150:
        errors["farm_name"] = "Farm name must not exceed 150 characters."

    if not username:
        errors["username"] = "Username is required."
    elif len(username) < 3:
        errors["username"] = "Username must be at least 3 characters."
    elif len(username) > 100:
        errors["username"] = "Username must not exceed 100 characters."
    elif not re.match(r"^[A-Za-z0-9_]+$", username):
        errors["username"] = "Username can only contain letters, numbers and underscores."

    if not email:
        errors["email"] = "Email address is required."
    elif not EMAIL_REGEX.match(email):
        errors["email"] = "Please enter a valid email address."
    elif len(email) > 150:
        errors["email"] = "Email must not exceed 150 characters."

    if not mobile_number:
        errors["mobile_number"] = "Mobile number is required."
    elif not MOBILE_REGEX.match(mobile_number):
        errors["mobile_number"] = "Please enter a valid 10-digit Indian mobile number."

    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."

    if not confirm_password:
        errors["confirm_password"] = "Please confirm your password."
    elif confirm_password != password:
        errors["confirm_password"] = "Confirm password does not match the password."

    if errors:
        return errors, None

    cleaned = {
        "farm_name": farm_name,
        "username": username,
        "email": email,
        "mobile_number": mobile_number,
        "password": password,
    }
    return None, cleaned


def validate_login(data):
    """Validate login payload.

    Returns (errors_dict, None) on failure or (None, cleaned_data) on success.
    """
    errors = {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username:
        errors["username"] = "Username is required."
    if not password:
        errors["password"] = "Password is required."

    if errors:
        return errors, None
    return None, {"username": username, "password": password}
