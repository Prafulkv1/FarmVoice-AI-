import { Globe, Bell, BellOff, CheckCircle } from "lucide-react";
import { PREFERRED_LANGUAGES } from "../../utils/profileValidation";

export default function LanguagePreferences({
  form,
  onChange,
  errors = {},
  isEditing = false,
}) {
  const hasNotif = typeof form.notifications_enabled === "boolean";
  const notifEnabled = form.notifications_enabled === true;

  if (!isEditing) {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <div className="section-header-icon">
            <Globe size={22} />
          </div>
          <div className="section-header-text">
            <h3 className="section-title">Language &amp; Notification Preferences</h3>
            <p className="section-subtitle">
              Voice assistance language and regional farming alert settings
            </p>
          </div>
        </div>

        <div className="section-body">
          <div className="view-grid">
            <div className="view-field">
              <span className="view-label">Preferred Language</span>
              <span className={`view-value ${!form.preferred_language ? "empty-val" : ""}`}>
                {form.preferred_language || "Not added yet"}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">Notifications</span>
              <div className="status-badge-wrapper">
                {!hasNotif ? (
                  <span className="badge badge-secondary">Not configured yet</span>
                ) : notifEnabled ? (
                  <span className="badge badge-success">
                    <Bell size={13} /> Enabled
                  </span>
                ) : (
                  <span className="badge badge-secondary">
                    <BellOff size={13} /> Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-section-card edit-card">
      <div className="section-header">
        <div className="section-header-icon">
          <Globe size={22} />
        </div>
        <div className="section-header-text">
          <h3 className="section-title">Language &amp; Notification Preferences</h3>
          <p className="section-subtitle">
            Configure how FarmVoice AI speaks to you and delivers critical weather alerts.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="preferred_language">
              Preferred Language <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Globe size={18} className="input-icon" />
              <select
                id="preferred_language"
                name="preferred_language"
                className={`form-control ${errors.preferred_language ? "is-invalid" : ""}`}
                value={form.preferred_language || ""}
                onChange={(e) => onChange("preferred_language", e.target.value)}
              >
                <option value="">-- Select Preferred Language --</option>
                {PREFERRED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            {errors.preferred_language ? (
              <span className="field-error">{errors.preferred_language}</span>
            ) : (
              <span className="field-hint">
                AI voice assistant and alerts will use this language
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Notification Preference <span className="req-star">*</span>
            </label>
            <div className="toggle-button-group">
              <button
                type="button"
                className={`toggle-option ${hasNotif && notifEnabled ? "active" : ""}`}
                onClick={() => onChange("notifications_enabled", true)}
              >
                <Bell size={16} />
                <span>Enable Notifications</span>
                {hasNotif && notifEnabled && (
                  <CheckCircle size={15} className="toggle-check" />
                )}
              </button>

              <button
                type="button"
                className={`toggle-option ${hasNotif && !notifEnabled ? "active" : ""}`}
                onClick={() => onChange("notifications_enabled", false)}
              >
                <BellOff size={16} />
                <span>Disable Notifications</span>
                {hasNotif && !notifEnabled && (
                  <CheckCircle size={15} className="toggle-check" />
                )}
              </button>
            </div>
            {errors.notifications_enabled ? (
              <span className="field-error">{errors.notifications_enabled}</span>
            ) : (
              <span className="field-hint">
                {hasNotif
                  ? notifEnabled
                    ? "You will receive periodic weather forecasts, mandi price updates, and advisory."
                    : "All automatic alerts and reminders are currently muted."
                  : "Please select whether you wish to receive notifications."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
