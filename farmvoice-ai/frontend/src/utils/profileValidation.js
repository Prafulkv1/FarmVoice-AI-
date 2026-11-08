/** Frontend validation helpers for the farmer profile, mirroring the backend rules. */

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
];

export const IRRIGATION_TYPES = [
  "Rainfed",
  "Canal",
  "Tubewell",
  "Tank",
  "Drip",
  "Sprinkler",
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

export const MAX_CROPS = 20;
export const MAX_CROP_NAME_LENGTH = 100;

function required(field, value, label) {
  const text = String(value || "").trim();
  if (!text) return `${label} is required.`;
  return null;
}

function maxLength(field, value, label, max) {
  const text = String(value || "").trim();
  if (text.length > max) return `${label} must not exceed ${max} characters.`;
  return null;
}

export function validateProfile(data) {
  const errors = {};

  const full_name = String(data.full_name || "").trim();
  const mobile_number = String(data.mobile_number || "").trim();
  const state = String(data.state || "").trim();
  const district = String(data.district || "").trim();
  const taluk = String(data.taluk || "").trim();
  const village = String(data.village || "").trim();
  const pin_code = String(data.pin_code || "").trim();

  errors.full_name = required("full_name", full_name, "Full name") || maxLength("full_name", full_name, "Full name", 150);
  errors.mobile_number = required("mobile_number", mobile_number, "Mobile number");
  errors.state = required("state", state, "State");
  errors.district = required("district", district, "District");
  errors.taluk = required("taluk", taluk, "Taluk");
  errors.village = required("village", village, "Village");
  errors.pin_code = required("pin_code", pin_code, "PIN code");

  if (mobile_number && !MOBILE_REGEX.test(mobile_number)) {
    errors.mobile_number = "Please enter a valid 10-digit Indian mobile number.";
  }

  if (pin_code && !PIN_CODE_REGEX.test(pin_code)) {
    errors.pin_code = "Please enter a valid 6-digit PIN code.";
  }

  // Total land size: required, positive decimal (max 2 decimal places)
  const landSizeRaw = String(data.total_land_size || "").trim();
  if (!landSizeRaw) {
    errors.total_land_size = "Total land size is required.";
  } else {
    const landSize = parseFloat(landSizeRaw);
    if (Number.isNaN(landSize) || !isFinite(landSize)) {
      errors.total_land_size = "Please enter a valid land size in acres.";
    } else if (landSize <= 0) {
      errors.total_land_size = "Land size must be greater than zero.";
    } else if (landSizeRaw.includes(".") && landSizeRaw.split(".")[1].length > 2) {
      errors.total_land_size = "Land size can have at most 2 decimal places.";
    }
  }

  if (!SOIL_TYPES.includes(data.soil_type)) {
    errors.soil_type = "Please select a valid soil type.";
  }

  if (!IRRIGATION_TYPES.includes(data.irrigation_type)) {
    errors.irrigation_type = "Please select a valid irrigation type.";
  }

  const farmingExperience = data.farming_experience;
  if (farmingExperience !== undefined && farmingExperience !== null && farmingExperience !== "") {
    const exp = parseInt(String(farmingExperience), 10);
    if (Number.isNaN(exp) || exp < 0) {
      errors.farming_experience = "Farming experience cannot be negative.";
    } else if (exp > 100) {
      errors.farming_experience = "Farming experience seems too high. Please check the value.";
    }
  }

  if (!PREFERRED_LANGUAGES.includes(data.preferred_language)) {
    errors.preferred_language = "Please select a preferred language.";
  }

  // Main crops: required, multiple selection
  const mainCrops = Array.isArray(data.main_crops) ? data.main_crops : [];
  const cleanedCrops = [];
  const cropErrors = {};

  if (mainCrops.length === 0) {
    errors.main_crops = "Select at least one main crop.";
  } else {
    const seen = new Set();
    mainCrops.forEach((crop, index) => {
      const name = String(crop || "").trim();
      const key = name.toLowerCase();
      if (!name) {
        cropErrors[`main_crops[${index}]`] = "Crop name cannot be empty.";
        return;
      }
      if (name.length > MAX_CROP_NAME_LENGTH) {
        cropErrors[`main_crops[${index}]`] = "Crop name must not exceed 100 characters.";
        return;
      }
      if (seen.has(key)) {
        cropErrors[`main_crops[${index}]`] = `Duplicate crop: ${name}.`;
        return;
      }
      seen.add(key);
      cleanedCrops.push(name);
    });
    if (cleanedCrops.length > MAX_CROPS) {
      errors.main_crops = `Select at most ${MAX_CROPS} crops.`;
    }
  }
  Object.assign(errors, cropErrors);

  const isValid = Object.keys(errors).length === 0;
  return { errors, isValid };
}
