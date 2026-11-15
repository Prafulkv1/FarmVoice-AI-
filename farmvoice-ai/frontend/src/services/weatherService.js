import api from "./api";

/**
 * FarmVoice AI - Weather Service Client.
 * Connects to Flask backend endpoints for localized agricultural weather.
 */
export const weatherService = {
  /** Fetch unified weather dashboard bundle (current, 7-day, hourly, rainfall, alerts, advisories). */
  getAllWeather: (forceRefresh = false) =>
    api.get("/api/weather/all", {
      params: forceRefresh ? { refresh: "true" } : {},
    }),

  /** Fetch current weather observation. */
  getCurrentWeather: (forceRefresh = false) =>
    api.get("/api/weather/current", {
      params: forceRefresh ? { refresh: "true" } : {},
    }),

  /** Fetch 7-day daily forecast. */
  getForecast: (forceRefresh = false) =>
    api.get("/api/weather/forecast", {
      params: forceRefresh ? { refresh: "true" } : {},
    }),

  /** Fetch hourly forecast for current day. */
  getHourly: (forceRefresh = false) =>
    api.get("/api/weather/hourly", {
      params: forceRefresh ? { refresh: "true" } : {},
    }),

  /** Fetch available verified weather alerts or clear notice. */
  getAlerts: () => api.get("/api/weather/alerts"),

  /** Fetch saved historical weather snapshots from MySQL. */
  getHistory: () => api.get("/api/weather/history"),
};
