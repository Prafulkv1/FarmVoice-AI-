/** Frontend validation helpers for the farmer profile, mirroring backend rules. */

export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const PIN_CODE_REGEX = /^\d{6}$/;

export const SOIL_TYPES = [
  "Alluvial",
  "Black",
  "Red",
  "Laterite",
  "Desert",
  "Mountain",
  "Peaty",
  "Other",
];

export const IRRIGATION_TYPES = [
  "Rainfed",
  "Canal",
  "Tubewell",
  "Tank",
  "Drip",
  "Sprinkler",
  "Other",
];

export const PREFERRED_LANGUAGES = [
  "Kannada",
  "Hindi",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Punjabi",
  "English",
];

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

function required(value, label) {
  const text = String(value || "").trim();
  if (!text) return `${label} is required.`;
  return null;
}

function maxLength(value, label, max) {
  const text = String(value || "").trim();
  if (text.length > max) return `${label} must not exceed ${max} characters.`;
  return null;
}

/**
 * Validate all profile fields.
 * Returns an errors dictionary where keys are field names.
 * An empty object means valid.
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
  const nameErr = required(fullName, "Full name") || maxLength(fullName, "Full name", 150);
  if (nameErr) errors.full_name = nameErr;

  const mobErr = required(mobileNumber, "Mobile number");
  if (mobErr) {
    errors.mobile_number = mobErr;
  } else if (!MOBILE_REGEX.test(mobileNumber)) {
    errors.mobile_number = "Please enter a valid 10-digit Indian mobile number.";
  }

  // Location Information
  const stateErr = required(state, "State") || maxLength(state, "State", 100);
  if (stateErr) errors.state = stateErr;

  const distErr = required(district, "District") || maxLength(district, "District", 100);
  if (distErr) errors.district = distErr;

  const talukErr = required(taluk, "Taluk") || maxLength(taluk, "Taluk", 100);
  if (talukErr) errors.taluk = talukErr;

  const villageErr = required(village, "Village") || maxLength(village, "Village", 150);
  if (villageErr) errors.village = villageErr;

  const pinErr = required(pinCode, "PIN code");
  if (pinErr) {
    errors.pin_code = pinErr;
  } else if (!PIN_CODE_REGEX.test(pinCode)) {
    errors.pin_code = "Please enter a valid 6-digit PIN code.";
  }

  // Farming Information
  const landSizeRaw = String(data.total_land_size || "").trim();
  if (!landSizeRaw) {
    errors.total_land_size = "Total land size is required.";
  } else {
    const landSize = parseFloat(landSizeRaw);
    if (Number.isNaN(landSize) || !Number.isFinite(landSize)) {
      errors.total_land_size = "Please enter a valid land size in acres.";
    } else if (landSize <= 0) {
      errors.total_land_size = "Land size must be greater than zero.";
    } else if (landSize > 9999.99) {
      errors.total_land_size = "Land size cannot exceed 9999.99 acres.";
    } else if (landSizeRaw.includes(".") && landSizeRaw.split(".")[1].length > 2) {
      errors.total_land_size = "Land size can have at most 2 decimal places.";
    }
  }

  if (!data.soil_type || !SOIL_TYPES.includes(data.soil_type)) {
    errors.soil_type = "Please select a valid soil type.";
  }

  if (!data.irrigation_type || !IRRIGATION_TYPES.includes(data.irrigation_type)) {
    errors.irrigation_type = "Please select a valid irrigation type.";
  }

  const expRaw = data.farming_experience;
  if (expRaw !== undefined && expRaw !== null && String(expRaw).trim() !== "") {
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
        errors[`main_crops[${idx}]`] = `Crop name must not exceed ${MAX_CROP_NAME_LENGTH} characters.`;
        return;
      }
      const key = name.toLowerCase();
      if (seen.has(key)) {
        return; // deduplicate
      }
      seen.add(key);
      validCrops.push(name);
    });

    if (validCrops.length === 0 && !errors.main_crops) {
      errors.main_crops = "Select at least one crop.";
    } else if (validCrops.length > MAX_CROPS) {
      errors.main_crops = `You can select at most ${MAX_CROPS} crops.`;
    }
  }

  // Language & Notifications
  const lang = data.preferred_language || "English";
  if (!PREFERRED_LANGUAGES.includes(lang)) {
    errors.preferred_language = "Please select a valid preferred language.";
  }

  return errors;
}

/**
 * Helper to calculate completion percentage in frontend.
 */
export function calculateCompletion(form = {}) {
  const fields = [
    { key: "full_name", label: "Full Name", weight: 10 },
    { key: "mobile_number", label: "Mobile Number", weight: 10 },
    { key: "state", label: "State", weight: 8 },
    { key: "district", label: "District", weight: 8 },
    { key: "taluk", label: "Taluk", weight: 8 },
    { key: "village", label: "Village", weight: 8 },
    { key: "pin_code", label: "PIN Code", weight: 8 },
    { key: "total_land_size", label: "Total Land Size", weight: 10 },
    { key: "soil_type", label: "Soil Type", weight: 10 },
    { key: "irrigation_type", label: "Irrigation Type", weight: 10 },
    { key: "main_crops", label: "Main Crops", weight: 10 },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;
  const missing = [];
  const completed = [];

  fields.forEach(({ key, label, weight }) => {
    totalWeight += weight;
    const val = form[key];
    let isDone = false;

    if (key === "main_crops") {
      isDone = Array.isArray(val) && val.length > 0;
    } else if (val !== undefined && val !== null && String(val).trim() !== "") {
      isDone = true;
    }

    if (isDone) {
      earnedWeight += weight;
      completed.push(label);
    } else {
      missing.push(label);
    }
  });

  const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { percentage, missing, completed, isComplete: percentage === 100 };
}
