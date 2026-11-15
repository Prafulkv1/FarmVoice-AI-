import api from "./api";

/**
 * Farmer profile service.
 * Reuses the existing Axios instance (api.js), which already:
 *   - uses the existing API base URL (proxied to Flask via Vite)
 *   - sends/receives HttpOnly JWT cookies (withCredentials: true)
 *   - attaches the CSRF double-submit token (X-CSRF-TOKEN) on state-changing requests
 */
export const profileService = {
  /** Fetch the authenticated farmer's profile. */
  getProfile: () => api.get("/api/profile"),

  /** Create a new profile for the authenticated farmer (POST). */
  createProfile: (payload) => api.post("/api/profile", payload),

  /** Update an existing profile for the authenticated farmer (PUT). */
  updateProfile: (payload) => api.put("/api/profile", payload),

  /** Create or update farmer profile based on isNew flag. */
  saveProfile: (payload, isNew = false) =>
    isNew
      ? api.post("/api/profile", payload)
      : api.put("/api/profile", payload),

  /** Get profile completion percentage and missing fields. */
  getCompletion: () => api.get("/api/profile/completion"),
};
