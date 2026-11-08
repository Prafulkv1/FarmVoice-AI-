import FormInput from "../FormInput";
import { Globe, Bell } from "lucide-react";
import "../../styles/dashboard.css";

const PREFERRED_LANGUAGES = [
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

export default function LanguagePreferences({ value, onChange, error }) {
  return (
    <section className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-icon">
          <Globe size={20} />
        </div>
        <div>
          <h3 className="profile-section-title">Language &amp; Notifications</h3>
          <p className="profile-section-desc">
            Choose your preferred regional language and notification settings.
          </p>
        </div>
      </div>

      <div className="profile-section-body">
        <div className="profile-form-grid">
          <div className="form-group full-width">
            <label className="form-label">Preferred Language</label>
            <select
              className="form-select"
              value={value.preferred_language || "English"}
              onChange={(e) => onChange("preferred_language", e.target.value)}
            >
              {PREFERRED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            {error.preferred_language && (
              <span className="form-error">{error.preferred_language}</span>
            )}
          </div>

          <div className="form-group full-width notification-group">
            <div className="notification-label-row">
              <div className="notification-icon">
                <Bell size={18} />
              </div>
              <div>
                <label className="form-label">Notifications</label>
                <p className="form-hint">
                  Receive farming updates and alerts in your preferred language.
                </p>
              </div>
            </div>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${value.notifications_enabled !== false ? "toggle-active" : ""}`}
                onClick={() => onChange("notifications_enabled", true)}
                aria-pressed={value.notifications_enabled !== false}
              >
                Enable
              </button>
              <button
                type="button"
                className={`toggle-btn ${value.notifications_enabled === false ? "toggle-active" : ""}`}
                onClick={() => onChange("notifications_enabled", false)}
                aria-pressed={value.notifications_enabled === false}
              >
                Disable
              </button>
            </div>
            {error.notifications_enabled !== undefined && (
              <span className="form-error">{error.notifications_enabled}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
