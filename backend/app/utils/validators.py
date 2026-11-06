"""FarmVoice AI - Request validation helpers."""

import re


EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")
PIN_CODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")

SOIL_TYPES = [
    "Alluvial", "Black", "Red", "Laterite", "Arid/Desert",
    "Forest/Mountain", "Saline/Alkaline", "Peaty",
]
IRRIGATION_TYPES = [
    "Rainfed", "Canal", "Tube well", "Well", "Drip",
    "Sprinkler", "Tank", "Other",
]
PREFERRED_LANGUAGES = [
    "Kannada", "Hindi", "Telugu", "Tamil", "Malayalam",
    "Marathi", "Bengali", "Punjabi", "English",
]


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


def validate_profile(data):
    """Validate farmer profile payload.

    Returns an errors dict on failure, or an empty dict on success.
    All errors are keyed by field name.
    """
    errors = {}

    # --- Location fields (all required) ---
    state = (data.get("state") or "").strip()
    if not state:
        errors["state"] = "State is required."
    elif len(state) > 100:
        errors["state"] = "State must not exceed 100 characters."

    district = (data.get("district") or "").strip()
    if not district:
        errors["district"] = "District is required."
    elif len(district) > 100:
        errors["district"] = "District must not exceed 100 characters."

    taluk = (data.get("taluk") or "").strip()
    if not taluk:
        errors["taluk"] = "Taluk is required."
    elif len(taluk) > 100:
        errors["taluk"] = "Taluk must not exceed 100 characters."

    village = (data.get("village") or "").strip()
    if not village:
        errors["village"] = "Village is required."
    elif len(village) > 100:
        errors["village"] = "Village must not exceed 100 characters."

    pin_code = (data.get("pin_code") or "").strip()
    if not pin_code:
        errors["pin_code"] = "PIN code is required."
    elif not PIN_CODE_REGEX.match(pin_code):
        errors["pin_code"] = "Please enter a valid 6-digit PIN code."

    # --- Farming fields (all required except farming_experience) ---
    total_land_size = data.get("total_land_size")
    if total_land_size is None or total_land_size == "":
        errors["total_land_size"] = "Total land size is required."
    else:
        try:
            land_size = float(total_land_size)
            if land_size <= 0:
                errors["total_land_size"] = "Land size must be greater than zero."
            elif land_size > 9999.99:
                errors["total_land_size"] = "Land size must not exceed 9999.99 acres."
        except (ValueError, TypeError):
            errors["total_land_size"] = "Please enter a valid land size in acres."

    soil_type = (data.get("soil_type") or "").strip()
    if not soil_type:
        errors["soil_type"] = "Soil type is required."
    elif soil_type not in SOIL_TYPES:
        errors["soil_type"] = "Please select a valid soil type."

    irrigation_type = (data.get("irrigation_type") or "").strip()
    if not irrigation_type:
        errors["irrigation_type"] = "Irrigation type is required."
    elif irrigation_type not in IRRIGATION_TYPES:
        errors["irrigation_type"] = "Please select a valid irrigation type."

    farming_experience = data.get("farming_experience")
    if farming_experience is not None and farming_experience != "":
        try:
            exp = int(farming_experience)
            if exp < 0:
                errors["farming_experience"] = "Farming experience cannot be negative."
            elif exp > 100:
                errors["farming_experience"] = "Farming experience must not exceed 100 years."
        except (ValueError, TypeError):
            errors["farming_experience"] = "Please enter a valid number of years."

    # --- Preference fields (required) ---
    preferred_language = (data.get("preferred_language") or "").strip()
    if not preferred_language:
        errors["preferred_language"] = "Preferred language is required."
    elif preferred_language not in PREFERRED_LANGUAGES:
        errors["preferred_language"] = "Please select a valid language."

    notifications_enabled = data.get("notifications_enabled")
    if notifications_enabled is None:
        errors["notifications_enabled"] = "Notification preference is required."
    elif not isinstance(notifications_enabled, bool):
        errors["notifications_enabled"] = "Notification preference must be a boolean value."

    # --- Main crops (optional list) ---
    main_crops = data.get("main_crops")
    if main_crops is not None:
        if not isinstance(main_crops, list):
            errors["main_crops"] = "Main crops must be a list."
        elif len(main_crops) == 0:
            errors["main_crops"] = "Please select at least one crop."
        else:
            for i, crop in enumerate(main_crops):
                if not isinstance(crop, str) or not crop.strip():
                    errors[f"main_crops[{i}]"] = "Crop name cannot be empty."

    return errors
