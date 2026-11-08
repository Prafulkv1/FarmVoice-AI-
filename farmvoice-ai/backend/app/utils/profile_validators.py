"""FarmVoice AI - Farmer profile validation helpers."""

import re
from decimal import Decimal, InvalidOperation

MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")
PIN_CODE_REGEX = re.compile(r"^\d{6}$")

SOIL_TYPES = [
    "Alluvial",
    "Black",
    "Red",
    "Laterite",
    "Desert",
    "Mountain",
    "Peaty",
]

IRRIGATION_TYPES = [
    "Rainfed",
    "Canal",
    "Tubewell",
    "Tank",
    "Drip",
    "Sprinkler",
]

PREFERRED_LANGUAGES = [
    "Kannada",
    "Hindi",
    "Telugu",
    "Tamil",
    "Malayalam",
    "Marathi",
    "Bengali",
    "Punjabi",
    "English",
]

MAX_CROPS = 20
MAX_CROP_NAME_LENGTH = 100


def _require_string(field, value):
    """Strip and presence-check a string field.

    Returns the stripped text, or None if missing/empty (caller records error).
    """
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def validate_profile(data):
    """Validate create/update farmer profile payload.

    Returns (errors_dict, None) on failure or (None, cleaned_data) on success.
    """
    errors = {}

    full_name = _require_string("full_name", data.get("full_name"))
    mobile_number = _require_string("mobile_number", data.get("mobile_number"))
    state = _require_string("state", data.get("state"))
    district = _require_string("district", data.get("district"))
    taluk = _require_string("taluk", data.get("taluk"))
    village = _require_string("village", data.get("village"))
    pin_code = _require_string("pin_code", data.get("pin_code"))

    for field, text in (
        ("full_name", full_name),
        ("mobile_number", mobile_number),
        ("state", state),
        ("district", district),
        ("taluk", taluk),
        ("village", village),
        ("pin_code", pin_code),
    ):
        if text is None:
            errors[field] = f"{field.replace('_', ' ').title()} is required."

    if mobile_number and not MOBILE_REGEX.match(mobile_number):
        errors["mobile_number"] = (
            "Please enter a valid 10-digit Indian mobile number."
        )

    if pin_code and not PIN_CODE_REGEX.match(pin_code):
        errors["pin_code"] = "Please enter a valid 6-digit PIN code."

    # Total land size: required, positive decimal (max 2 decimal places)
    land_size_raw = data.get("total_land_size")
    land_size = None
    if land_size_raw is None or land_size_raw == "":
        errors["total_land_size"] = "Total land size is required."
    else:
        try:
            land_size = Decimal(str(land_size_raw).strip())
        except (InvalidOperation, ValueError):
            errors["total_land_size"] = (
                "Please enter a valid land size in acres."
            )
        else:
            if land_size <= 0:
                errors["total_land_size"] = (
                    "Land size must be greater than zero."
                )
            if land_size.as_tuple().exponent < -2:
                errors["total_land_size"] = (
                    "Land size can have at most 2 decimal places."
                )

    soil_type = data.get("soil_type")
    if soil_type not in SOIL_TYPES:
        errors["soil_type"] = "Please select a valid soil type."

    irrigation_type = data.get("irrigation_type")
    if irrigation_type not in IRRIGATION_TYPES:
        errors["irrigation_type"] = "Please select a valid irrigation type."

    farming_experience = data.get("farming_experience")
    if farming_experience is not None and farming_experience != "":
        try:
            farming_experience = int(farming_experience)
        except (ValueError, TypeError):
            errors["farming_experience"] = (
                "Farming experience must be a whole number of years."
            )
        else:
            if farming_experience < 0:
                errors["farming_experience"] = (
                    "Farming experience cannot be negative."
                )
            elif farming_experience > 100:
                errors["farming_experience"] = (
                    "Farming experience seems too high. Please check the value."
                )

    preferred_language = data.get("preferred_language")
    if preferred_language not in PREFERRED_LANGUAGES:
        errors["preferred_language"] = "Please select a preferred language."

    notifications_enabled = data.get("notifications_enabled", True)
    if isinstance(notifications_enabled, str):
        notifications_enabled = notifications_enabled.lower() == "true"
    notifications_enabled = bool(notifications_enabled)

    # Main crops: required, multiple selection
    main_crops = data.get("main_crops")
    cleaned_crops = []
    if not isinstance(main_crops, list) or len(main_crops) == 0:
        errors["main_crops"] = "Select at least one main crop."
    else:
        seen = set()
        for index, crop in enumerate(main_crops):
            crop_name = str(crop).strip() if crop is not None else ""
            key = crop_name.lower()
            if not crop_name:
                errors[f"main_crops[{index}]"] = "Crop name cannot be empty."
                continue
            if len(crop_name) > MAX_CROP_NAME_LENGTH:
                errors[f"main_crops[{index}]"] = (
                    "Crop name must not exceed 100 characters."
                )
                continue
            if key in seen:
                errors[f"main_crops[{index}]"] = f"Duplicate crop: {crop_name}."
                continue
            seen.add(key)
            cleaned_crops.append(crop_name)
        if len(cleaned_crops) > MAX_CROPS:
            errors["main_crops"] = f"Select at most {MAX_CROPS} crops."

    if errors:
        return errors, None

    cleaned = {
        "full_name": full_name,
        "mobile_number": mobile_number,
        "state": state,
        "district": district,
        "taluk": taluk,
        "village": village,
        "pin_code": pin_code,
        "total_land_size": land_size,
        "soil_type": soil_type,
        "irrigation_type": irrigation_type,
        "farming_experience": farming_experience,
        "preferred_language": preferred_language,
        "notifications_enabled": notifications_enabled,
        "main_crops": cleaned_crops,
    }
    return None, cleaned
