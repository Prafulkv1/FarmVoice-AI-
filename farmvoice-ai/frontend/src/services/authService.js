import api from "./api";

export const authService = {
  /** Register a new farmer. */
  register: (payload) => api.post("/api/auth/register", payload),

  /** Login a farmer (sets HttpOnly JWT cookie). */
  login: (payload) => api.post("/api/auth/login", payload),

  /** Fetch the authenticated farmer's profile. */
  getProfile: () => api.get("/api/auth/profile"),

  /** Logout (clears JWT cookies). */
  logout: () => api.post("/api/auth/logout"),
};
