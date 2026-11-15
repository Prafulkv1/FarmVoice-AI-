import {
  Globe,
  Bell,
  BellOff,
  CheckCircle,
  Volume2,
  VolumeX,
  Play,
  Languages,
} from "lucide-react";
import { PREFERRED_LANGUAGES } from "../../utils/profileValidation";

const DIALECT_OPTIONS = {
  Kannada: [
    { value: "standard", label: "Standard Kannada (ಶಿಷ್ಟ ಕನ್ನಡ)" },
    { value: "uttara_karnataka", label: "North Karnataka (ಉತ್ತರ ಕರ್ನಾಟಕ - ಧಾರವಾಡ, ಬೆಳಗಾವಿ, ಬಾಗಲಕೋಟೆ)" },
    { value: "dakshina_karnataka", label: "South Karnataka (ದಕ್ಷಿಣ ಕರ್ನಾಟಕ - ಮೈಸೂರು, ಮಂಡ್ಯ, ಹಾಸನ)" },
    { value: "karavali", label: "Coastal Karnataka (ಕರಾವಳಿ ಕನ್ನಡ - ಮಂಗಳೂರು, ಉಡುಪಿ)" },
  ],
  Hindi: [
    { value: "standard", label: "Standard Hindi (मानक हिन्दी)" },
    { value: "eastern_hindi", label: "Eastern Hindi (पूर्वी हिन्दी / अवधी - पूर्वांचल, बिहार)" },
    { value: "western_hindi", label: "Western Hindi (पश्चिमी हिन्दी - हरियाणा, पश्चिमी यूपी)" },
  ],
  Telugu: [
    { value: "standard", label: "Standard Telugu (ప్రామాణిక తెలుగు)" },
    { value: "telangana", label: "Telangana Dialect (తెలంగాణ యాస)" },
    { value: "rayalaseema", label: "Rayalaseema & Coastal (రాయలసీమ / కోస్తా)" },
  ],
  Tamil: [
    { value: "standard", label: "Standard Tamil (செந்தமிழ்)" },
    { value: "kongu", label: "Kongu Tamil (கொங்கு தமிழ் - கோவை, ஈரோடு)" },
    { value: "madurai", label: "Southern / Madurai Tamil (மதுரை / தென் தமிழ்)" },
  ],
  Malayalam: [
    { value: "standard", label: "Standard Malayalam (സാധാരണ മലയാളം)" },
    { value: "malabar", label: "Malabar Malayalam (മലബാർ മലയാളം)" },
  ],
  Marathi: [
    { value: "standard", label: "Standard Marathi (प्रमाण मराठी)" },
    { value: "marathwada_varhadi", label: "Marathwada & Varhadi (मराठवाडा व वऱ्हाडी बोली)" },
  ],
  Bengali: [
    { value: "standard", label: "Standard Bengali (প্রমিত বাংলা)" },
    { value: "rural_bengali", label: "Rural Colloquial Bengali (পল্লী কথ্য বাংলা)" },
  ],
  Punjabi: [
    { value: "standard", label: "Standard Punjabi / Majhi (ਮਾਝੀ ਪੰਜਾਬੀ)" },
    { value: "malwai", label: "Malwai Punjabi (ਮਲਵਈ ਪੰਜਾਬੀ)" },
  ],
  English: [
    { value: "standard", label: "Indian Agricultural English" },
  ],
};

function getDialectLabel(language, dialectValue) {
  const options = DIALECT_OPTIONS[language] || [];
  const found = options.find((o) => o.value === dialectValue);
  return found ? found.label : dialectValue || "Standard";
}

export default function LanguagePreferences({
  form,
  onChange,
  errors = {},
  isEditing = false,
}) {
  const hasNotif = typeof form.notifications_enabled === "boolean";
  const notifEnabled = form.notifications_enabled === true;

  const currentLanguage = form.preferred_language || "Kannada";
  const dialectList = DIALECT_OPTIONS[currentLanguage] || [
    { value: "standard", label: "Standard Dialect" },
  ];

  const voiceEnabled = form.voice_enabled !== false;
  const autoPlayVoice = !!form.auto_play_voice;

  if (!isEditing) {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <div className="section-header-icon">
            <Globe size={22} />
          </div>
          <div className="section-header-text">
            <h3 className="section-title">Language, Dialect &amp; Voice Preferences</h3>
            <p className="section-subtitle">
              Voice assistance language, regional dialect adaptation, and farming alert settings
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
              <span className="view-label">Regional Dialect</span>
              <span className="view-value">
                {getDialectLabel(form.preferred_language, form.preferred_dialect)}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">AI Voice Responses</span>
              <div className="status-badge-wrapper">
                {voiceEnabled ? (
                  <span className="badge badge-success">
                    <Volume2 size={13} /> Enabled
                  </span>
                ) : (
                  <span className="badge badge-secondary">
                    <VolumeX size={13} /> Muted
                  </span>
                )}
              </div>
            </div>

            <div className="view-field">
              <span className="view-label">Auto-Play Voice</span>
              <div className="status-badge-wrapper">
                {autoPlayVoice ? (
                  <span className="badge badge-success">
                    <Play size={13} /> Automatic
                  </span>
                ) : (
                  <span className="badge badge-secondary">Manual Play</span>
                )}
              </div>
            </div>

            <div className="view-field">
              <span className="view-label">Weather &amp; Advisory Alerts</span>
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
          <h3 className="section-title">Language, Dialect &amp; Voice Preferences</h3>
          <p className="section-subtitle">
            Configure how FarmVoice AI speaks to you, adapts to your regional dialect, and delivers alerts.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="form-grid">
          {/* Preferred Language */}
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
                onChange={(e) => {
                  const newLang = e.target.value;
                  onChange("preferred_language", newLang);
                  // Reset dialect to standard if changing language
                  onChange("preferred_dialect", "standard");
                }}
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

          {/* Regional Dialect */}
          <div className="form-group">
            <label className="form-label" htmlFor="preferred_dialect">
              Regional Dialect &amp; Conversational Style
            </label>
            <div className="input-icon-wrapper">
              <Languages size={18} className="input-icon" />
              <select
                id="preferred_dialect"
                name="preferred_dialect"
                className="form-control"
                value={form.preferred_dialect || "standard"}
                onChange={(e) => onChange("preferred_dialect", e.target.value)}
              >
                {dialectList.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="field-hint">
              Select your local region so FarmVoice AI uses familiar phrasing and regional agricultural terminology
            </span>
          </div>

          {/* Voice Response Toggle */}
          <div className="form-group">
            <label className="form-label">
              Voice Assistance Responses
            </label>
            <div className="toggle-button-group">
              <button
                type="button"
                className={`toggle-option ${voiceEnabled ? "active" : ""}`}
                onClick={() => onChange("voice_enabled", true)}
              >
                <Volume2 size={16} />
                <span>Voice Enabled</span>
                {voiceEnabled && <CheckCircle size={15} className="toggle-check" />}
              </button>

              <button
                type="button"
                className={`toggle-option ${!voiceEnabled ? "active" : ""}`}
                onClick={() => onChange("voice_enabled", false)}
              >
                <VolumeX size={16} />
                <span>Voice Muted</span>
                {!voiceEnabled && <CheckCircle size={15} className="toggle-check" />}
              </button>
            </div>
            <span className="field-hint">
              Enable spoken audio output alongside written answers
            </span>
          </div>

          {/* Auto-Play Spoken Response Toggle */}
          <div className="form-group">
            <label className="form-label">
              Auto-Play Spoken Responses
            </label>
            <div className="toggle-button-group">
              <button
                type="button"
                className={`toggle-option ${autoPlayVoice ? "active" : ""}`}
                onClick={() => onChange("auto_play_voice", true)}
              >
                <Play size={16} />
                <span>Auto-Play On</span>
                {autoPlayVoice && <CheckCircle size={15} className="toggle-check" />}
              </button>

              <button
                type="button"
                className={`toggle-option ${!autoPlayVoice ? "active" : ""}`}
                onClick={() => onChange("auto_play_voice", false)}
              >
                <span>Manual Play</span>
                {!autoPlayVoice && <CheckCircle size={15} className="toggle-check" />}
              </button>
            </div>
            <span className="field-hint">
              When enabled, responses automatically play aloud when generated
            </span>
          </div>

          {/* Notification Preference */}
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
