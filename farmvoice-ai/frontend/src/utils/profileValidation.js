/** Frontend validation helpers and real-time profile completion calculation. */

export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const PIN_CODE_REGEX = /^\d{6}$/;

export const SOIL_TYPES = [
  "Alluvial",
  "Black Soil",
  "Red Soil",
  "Laterite Soil",
  "Desert Soil",
  "Mountain Soil",
  "Peaty Soil",
  "Other",
];

// Accepted aliases from database/backend
export const ALL_VALID_SOIL_TYPES = [
  "Alluvial",
  "Black Soil",
  "Black",
  "Red Soil",
  "Red",
  "Laterite Soil",
  "Laterite",
  "Desert Soil",
  "Desert",
  "Mountain Soil",
  "Mountain",
  "Peaty Soil",
  "Peaty",
  "Other",
];

export const IRRIGATION_TYPES = [
  "Rainfed",
  "Canal",
  "Tubewell",
  "Tank",
  "Drip Irrigation",
  "Sprinkler Irrigation",
  "Other",
];

// Accepted aliases from database/backend
export const ALL_VALID_IRRIGATION_TYPES = [
  "Rainfed",
  "Canal",
  "Tubewell",
  "Tank",
  "Drip Irrigation",
  "Drip",
  "Sprinkler Irrigation",
  "Sprinkler",
  "Other",
];

export const PREFERRED_LANGUAGES = [
  "English",
  "Kannada",
  "Hindi",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Punjabi",
];

export const LAND_UNITS = ["Acres", "Hectares"];

export const MAIN_CROPS = [
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
];

export const MAX_CROPS = 20;
export const MAX_CROP_NAME_LENGTH = 100;

export const PROFILE_FIELD_CONFIG = [
  { key: "full_name", label: "Full Name", category: "personal", weight: 7 },
  { key: "mobile_number", label: "Mobile Number", category: "personal", weight: 7 },
  { key: "email", label: "Email Address", category: "personal", weight: 6 },
  { key: "state", label: "State", category: "location", weight: 5 },
  { key: "district", label: "District", category: "location", weight: 5 },
  { key: "taluk", label: "Taluk", category: "location", weight: 5 },
  { key: "village", label: "Village", category: "location", weight: 5 },
  { key: "pin_code", label: "PIN Code", category: "location", weight: 5 },
  { key: "total_land_size", label: "Total Land Size", category: "farming", weight: 10 },
  { key: "soil_type", label: "Soil Type", category: "farming", weight: 10 },
  { key: "irrigation_type", label: "Irrigation Type", category: "farming", weight: 10 },
  { key: "farming_experience", label: "Farming Experience", category: "farming", weight: 5 },
  { key: "main_crops", label: "Main Crops", category: "farming", weight: 5 },
  { key: "preferred_language", label: "Preferred Language", category: "preferences", weight: 10 },
  { key: "notifications_enabled", label: "Notification Preference", category: "preferences", weight: 5 },
];

export const REQUIRED_PROFILE_FIELDS = PROFILE_FIELD_CONFIG.map(({ key, label }) => ({
  key,
  label,
}));

function required(value, label) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "not added yet")
    return `${label} is required.`;
  return null;
}

function maxLength(value, label, max) {
  const text = String(value || "").trim();
  if (text.length > max) return `${label} must not exceed ${max} characters.`;
  return null;
}

/**
 * Validate all profile fields for submission.
 * Returns an errors dictionary where keys are field names. Empty object = valid.
 */
export function validateProfile(data = {}) {
  const errors = {};

  const fullName = String(data.full_name || "").trim();
  const mobileNumber = String(data.mobile_number || "").trim();
  const state = String(data.state || "").trim();
  const district = String(data.district || "").trim();
  const taluk = String(data.taluk || "").trim();
  const village = String(data.village || "").trim();
  const pinCode = String(data.pin_code || "").trim();

  // Personal Information
  const nameErr =
    required(fullName, "Full name") || maxLength(fullName, "Full name", 150);
  if (nameErr) errors.full_name = nameErr;

  const mobErr = required(mobileNumber, "Mobile number");
  if (mobErr) {
    errors.mobile_number = mobErr;
  } else if (!MOBILE_REGEX.test(mobileNumber)) {
    errors.mobile_number =
      "Please enter a valid 10-digit Indian mobile number.";
  }

  // Location Information
  const stateErr = required(state, "State") || maxLength(state, "State", 100);
  if (stateErr) errors.state = stateErr;

  const distErr =
    required(district, "District") || maxLength(district, "District", 100);
  if (distErr) errors.district = distErr;

  const talukErr = required(taluk, "Taluk") || maxLength(taluk, "Taluk", 100);
  if (talukErr) errors.taluk = talukErr;

  const villageErr =
    required(village, "Village") || maxLength(village, "Village", 150);
  if (villageErr) errors.village = villageErr;

  const pinErr = required(pinCode, "PIN code");
  if (pinErr) {
    errors.pin_code = pinErr;
  } else if (!PIN_CODE_REGEX.test(pinCode)) {
    errors.pin_code = "Please enter a valid 6-digit PIN code.";
  }

  // Farming Information
  const landSizeRaw = String(data.total_land_size ?? "").trim();
  if (!landSizeRaw || landSizeRaw.toLowerCase() === "not added yet") {
    errors.total_land_size = "Total land size is required.";
  } else {
    const landSize = parseFloat(landSizeRaw);
    if (Number.isNaN(landSize) || !Number.isFinite(landSize)) {
      errors.total_land_size = "Please enter a valid land size.";
    } else if (landSize <= 0) {
      errors.total_land_size = "Land size must be greater than zero.";
    } else if (landSize > 9999.99) {
      errors.total_land_size = "Land size cannot exceed 9999.99.";
    } else if (
      landSizeRaw.includes(".") &&
      landSizeRaw.split(".")[1].length > 2
    ) {
      errors.total_land_size = "Land size can have at most 2 decimal places.";
    }
  }

  const landUnit = String(data.land_unit || "Acres").trim();
  if (landUnit && !LAND_UNITS.includes(landUnit)) {
    errors.land_unit = "Please select Acres or Hectares.";
  }

  const soilType = String(data.soil_type || "").trim();
  if (!soilType || !ALL_VALID_SOIL_TYPES.includes(soilType)) {
    errors.soil_type = "Please select a valid soil type.";
  }

  const irrigationType = String(data.irrigation_type || "").trim();
  if (
    !irrigationType ||
    !ALL_VALID_IRRIGATION_TYPES.includes(irrigationType)
  ) {
    errors.irrigation_type = "Please select a valid irrigation type.";
  }

  const expRaw = data.farming_experience;
  if (
    expRaw !== undefined &&
    expRaw !== null &&
    String(expRaw).trim() !== "" &&
    String(expRaw).toLowerCase() !== "not added yet"
  ) {
    const exp = parseInt(String(expRaw).trim(), 10);
    if (Number.isNaN(exp) || exp < 0) {
      errors.farming_experience = "Farming experience cannot be negative.";
    } else if (exp > 100) {
      errors.farming_experience = "Farming experience cannot exceed 100 years.";
    }
  }

  // Main Crops
  const crops = Array.isArray(data.main_crops) ? data.main_crops : [];
  if (crops.length === 0) {
    errors.main_crops = "Select at least one crop.";
  } else {
    const seen = new Set();
    const validCrops = [];
    crops.forEach((crop, idx) => {
      const name = String(crop || "").trim();
      if (!name) {
        errors[`main_crops[${idx}]`] = "Crop name cannot be empty.";
        return;
      }
      if (name.length > MAX_CROP_NAME_LENGTH) {
        errors[`main_crops[${idx}]`] =
          `Crop name must not exceed ${MAX_CROP_NAME_LENGTH} characters.`;
        return;
      }
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        validCrops.push(name);
      }
    });

    if (validCrops.length === 0 && !errors.main_crops) {
      errors.main_crops = "Select at least one crop.";
    } else if (validCrops.length > MAX_CROPS) {
      errors.main_crops = `You can select at most ${MAX_CROPS} crops.`;
    }
  }

  // Language & Notifications
  const lang = data.preferred_language;
  if (!lang || !PREFERRED_LANGUAGES.includes(lang)) {
    errors.preferred_language = "Please select a preferred language.";
  }

  if (typeof data.notifications_enabled !== "boolean") {
    errors.notifications_enabled =
      "Please specify your notification preference.";
  }

  return errors;
}

/**
 * Check whether a specific field is considered complete and valid.
 */
export function isFieldCompleted(key, val) {
  if (val === undefined || val === null) return false;

  if (
    key === "full_name" ||
    key === "state" ||
    key === "district" ||
    key === "taluk" ||
    key === "village"
  ) {
    const text = String(val).trim();
    return Boolean(
      text &&
        text.toLowerCase() !== "not added yet" &&
        text.toLowerCase() !== "not provided"
    );
  }

  if (key === "email") {
    const text = String(val).trim();
    return Boolean(text && text.includes("@"));
  }

  if (key === "mobile_number") {
    const text = String(val).trim();
    return MOBILE_REGEX.test(text);
  }

  if (key === "pin_code") {
    const text = String(val).trim();
    return PIN_CODE_REGEX.test(text);
  }

  if (key === "total_land_size") {
    const num = parseFloat(val);
    return !Number.isNaN(num) && num > 0;
  }

  if (key === "soil_type") {
    const text = String(val).trim();
    return ALL_VALID_SOIL_TYPES.includes(text);
  }

  if (key === "irrigation_type") {
    const text = String(val).trim();
    return ALL_VALID_IRRIGATION_TYPES.includes(text);
  }

  if (key === "main_crops") {
    return Array.isArray(val) && val.length > 0;
  }

  if (key === "farming_experience") {
    const text = String(val).trim();
    if (!text || text.toLowerCase() === "not added yet") return false;
    const num = parseInt(text, 10);
    return !Number.isNaN(num) && num >= 0 && num <= 100;
  }

  if (key === "preferred_language") {
    const text = String(val).trim();
    return PREFERRED_LANGUAGES.includes(text);
  }

  if (key === "notifications_enabled") {
    return typeof val === "boolean";
  }

  return false;
}

/**
 * Dynamic Real-Time Completion Calculation
 * Weighted formula:
 *   - Personal Information: 20%
 *   - Location Information: 25%
 *   - Farming Information: 40%
 *   - Language & Notifications: 15%
 * Total = 100%
 */
export function calculateCompletion(form = {}) {
  const completedFields = [];
  const missingFields = [];
  const categoryScores = {
    personal: { score: 0, max: 20 },
    location: { score: 0, max: 25 },
    farming: { score: 0, max: 40 },
    preferences: { score: 0, max: 15 },
  };

  let totalScore = 0;

  PROFILE_FIELD_CONFIG.forEach(({ key, label, category, weight }) => {
    const val = form[key];
    if (isFieldCompleted(key, val)) {
      completedFields.push(label);
      categoryScores[category].score += weight;
      totalScore += weight;
    } else {
      missingFields.push(label);
    }
  });

  const totalFields = PROFILE_FIELD_CONFIG.length; // 15
  const completedCount = completedFields.length;
  const remainingCount = missingFields.length;
  const percentage = Math.max(0, Math.min(100, Math.round(totalScore)));

  return {
    percentage,
    completedCount,
    totalFields,
    remainingCount,
    completedFields,
    missingFields,
    categoryScores,
    isComplete: percentage === 100,
  };
}
