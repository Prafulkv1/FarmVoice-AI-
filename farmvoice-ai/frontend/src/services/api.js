import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive HttpOnly cookies cross-origin (same origin via proxy)
  headers: { "Content-Type": "application/json" },
});

/**
 * Read a cookie by name (used to attach the CSRF double-submit token).
 */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
}

const CSRF_METHODS = ["post", "put", "patch", "delete"];

api.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    if (CSRF_METHODS.includes(method)) {
      const token = getCookie("csrf_access_token_cookie");
      if (token) {
        config.headers["X-CSRF-TOKEN"] = token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
