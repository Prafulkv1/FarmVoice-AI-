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
    "Other",
]

IRRIGATION_TYPES = [
    "Rainfed",
    "Canal",
    "Tubewell",
    "Tank",
    "Drip",
    "Sprinkler",
    "Other",
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

MAIN_CROPS = [
    "Rice",
    "Wheat",
    "Cotton",
    "Sugarcane",
    "Ragi",
    "Maize",
    "Pulses",
    "Vegetables",
    "Coconut",
    "Banana",
    "Turmeric",
    "Chilli",
    "Tomato",
    "Millets",
    "Groundnut",
    "Other",
]

MAX_CROPS = 20
MAX_CROP_NAME_LENGTH = 100


def _clean_string(value):
    """Strip string or return None if empty/None."""
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def validate_profile(data):
    """Validate create/update farmer profile payload.

    Returns (errors_dict, None) on failure or (None, cleaned_data) on success.
    """
    errors = {}

    full_name = _clean_string(data.get("full_name"))
    mobile_number = _clean_string(data.get("mobile_number"))
    state = _clean_string(data.get("state"))
    district = _clean_string(data.get("district"))
    taluk = _clean_string(data.get("taluk"))
    village = _clean_string(data.get("village"))
    pin_code = _clean_string(data.get("pin_code"))

    # Required text fields
    required_fields = [
        ("full_name", full_name, "Full Name", 150),
        ("mobile_number", mobile_number, "Mobile Number", 10),
        ("state", state, "State", 100),
        ("district", district, "District", 100),
        ("taluk", taluk, "Taluk", 100),
        ("village", village, "Village", 150),
        ("pin_code", pin_code, "PIN Code", 10),
    ]

    for field, value, label, max_len in required_fields:
        if not value:
            errors[field] = f"{label} is required."
        elif len(value) > max_len:
            errors[field] = f"{label} must not exceed {max_len} characters."

    # Mobile format
    if mobile_number and not errors.get("mobile_number"):
        if not MOBILE_REGEX.match(mobile_number):
            errors["mobile_number"] = (
                "Please enter a valid 10-digit Indian mobile number."
            )

    # PIN code format
    if pin_code and not errors.get("pin_code"):
        if not PIN_CODE_REGEX.match(pin_code):
            errors["pin_code"] = "Please enter a valid 6-digit PIN code."

    # Total land size: required, positive decimal with up to 2 decimal places
    land_size_raw = data.get("total_land_size")
    land_size = None
    if land_size_raw is None or str(land_size_raw).strip() == "":
        errors["total_land_size"] = "Total land size is required."
    else:
        try:
            land_size = Decimal(str(land_size_raw).strip())
            if land_size <= 0:
                errors["total_land_size"] = (
                    "Land size must be greater than zero."
                )
            elif land_size > 9999.99:
                errors["total_land_size"] = (
                    "Land size cannot exceed 9999.99 acres."
                )
            elif land_size.as_tuple().exponent < -2:
                errors["total_land_size"] = (
                    "Land size can have at most 2 decimal places."
                )
        except (InvalidOperation, ValueError, TypeError):
            errors["total_land_size"] = (
                "Please enter a valid land size in acres."
            )

    # Soil type
    soil_type = _clean_string(data.get("soil_type"))
    if not soil_type:
        errors["soil_type"] = "Please select a soil type."
    elif soil_type not in SOIL_TYPES:
        errors["soil_type"] = "Please select a valid soil type from the list."

    # Irrigation type
    irrigation_type = _clean_string(data.get("irrigation_type"))
    if not irrigation_type:
        errors["irrigation_type"] = "Please select an irrigation type."
    elif irrigation_type not in IRRIGATION_TYPES:
        errors["irrigation_type"] = (
            "Please select a valid irrigation type from the list."
        )

    # Farming experience: optional, whole number of years (0-100)
    farming_exp_raw = data.get("farming_experience")
    farming_experience = None
    if farming_exp_raw is not None and str(farming_exp_raw).strip() != "":
        try:
            farming_experience = int(str(farming_exp_raw).strip())
            if farming_experience < 0:
                errors["farming_experience"] = (
                    "Farming experience cannot be negative."
                )
            elif farming_experience > 100:
                errors["farming_experience"] = (
                    "Farming experience cannot exceed 100 years."
                )
        except (ValueError, TypeError):
            errors["farming_experience"] = (
                "Farming experience must be a whole number of years."
            )

    # Preferred language
    preferred_language = _clean_string(data.get("preferred_language")) or "English"
    if preferred_language not in PREFERRED_LANGUAGES:
        errors["preferred_language"] = (
            "Please select a valid preferred language."
        )

    # Notifications enabled
    notif_raw = data.get("notifications_enabled", True)
    if isinstance(notif_raw, str):
        notifications_enabled = notif_raw.lower() in ("true", "1", "yes")
    else:
        notifications_enabled = bool(notif_raw)

    # Main crops: multiple selection, at least 1 required
    main_crops = data.get("main_crops")
    cleaned_crops = []
    if not isinstance(main_crops, list) or len(main_crops) == 0:
        errors["main_crops"] = "Select at least one crop."
    else:
        seen = set()
        for idx, crop in enumerate(main_crops):
            crop_name = _clean_string(crop)
            if not crop_name:
                errors[f"main_crops[{idx}]"] = "Crop name cannot be empty."
                continue
            if len(crop_name) > MAX_CROP_NAME_LENGTH:
                errors[f"main_crops[{idx}]"] = (
                    f"Crop name cannot exceed {MAX_CROP_NAME_LENGTH} characters."
                )
                continue
            key = crop_name.lower()
            if key in seen:
                continue  # Silently deduplicate
            seen.add(key)
            cleaned_crops.append(crop_name)

        if not cleaned_crops and "main_crops" not in errors:
            errors["main_crops"] = "Select at least one crop."
        elif len(cleaned_crops) > MAX_CROPS:
            errors["main_crops"] = f"You can select at most {MAX_CROPS} crops."

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
