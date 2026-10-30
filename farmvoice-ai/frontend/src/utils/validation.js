/** Frontend validation helpers mirroring the backend rules. */

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;

export function validateRegistration(data) {
  const errors = {};

  const farm_name = String(data.farm_name || "").trim();
  const username = String(data.username || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const mobile_number = String(data.mobile_number || "").trim();
  const password = data.password || "";
  const confirm_password = data.confirm_password || "";

  if (!farm_name) errors.farm_name = "Farm name is required.";
  else if (farm_name.length > 150) errors.farm_name = "Farm name must not exceed 150 characters.";

  if (!username) errors.username = "Username is required.";
  else if (username.length < 3) errors.username = "Username must be at least 3 characters.";
  else if (username.length > 100) errors.username = "Username must not exceed 100 characters.";
  else if (!USERNAME_REGEX.test(username))
    errors.username = "Username can only contain letters, numbers and underscores.";

  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Please enter a valid email address.";
  else if (email.length > 150) errors.email = "Email must not exceed 150 characters.";

  if (!mobile_number) errors.mobile_number = "Mobile number is required.";
  else if (!MOBILE_REGEX.test(mobile_number))
    errors.mobile_number = "Please enter a valid 10-digit Indian mobile number.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters.";

  if (!confirm_password) errors.confirm_password = "Please confirm your password.";
  else if (confirm_password !== password)
    errors.confirm_password = "Confirm password does not match the password.";

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateLogin(data) {
  const errors = {};
  const username = String(data.username || "").trim();
  const password = data.password || "";

  if (!username) errors.username = "Username is required.";
  if (!password) errors.password = "Password is required.";

  return { errors, isValid: Object.keys(errors).length === 0 };
}
