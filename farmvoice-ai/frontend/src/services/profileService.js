import api from "./api";

/**
 * Farmer profile service.
 * Reuses the existing Axios instance (api.js), which already:
 *   - uses the existing API base URL (VITE_API_BASE_URL, proxied to Flask via Vite)
 *   - sends/receives HttpOnly JWT cookies (withCredentials: true)
 *   - attaches the CSRF double-submit token (X-CSRF-TOKEN) on state-changing requests
 */
export const profileService = {
  /** Fetch the authenticated farmer's profile. */
  getProfile: () => api.get("/api/profile"),

  /** Create or update the authenticated farmer's profile. */
  saveProfile: (payload) => api.put("/api/profile", payload),
};
