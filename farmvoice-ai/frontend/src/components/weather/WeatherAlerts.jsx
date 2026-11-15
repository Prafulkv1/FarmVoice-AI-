import {
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function WeatherAlerts({ alertsData, t }) {
  if (!alertsData) return null;

  const alerts = Array.isArray(alertsData.alerts) ? alertsData.alerts : [];
  const hasAlerts = alerts.length > 0;
  const source = alertsData.source || "India Meteorological Department (IMD) / Open-Meteo";
  const lastChecked = alertsData.last_checked || new Date().toLocaleString();

  return (
    <div className="weather-section-container">
      <div className="section-title-bar">
        <div className="section-title-left">
          <ShieldAlert
            size={20}
            className={`section-header-icon ${hasAlerts ? "text-amber" : "text-green"}`}
          />
          <h3 className="section-heading">{t.weatherAlerts}</h3>
        </div>
        <span
          className={`section-count-pill ${
            hasAlerts ? "pill-warning" : "pill-success"
          }`}
        >
          {hasAlerts ? `${alerts.length} Active` : "Normal"}
        </span>
      </div>

      {!hasAlerts ? (
        /* Verified Clear State */
        <div className="alerts-clear-card">
          <div className="clear-icon-bubble">
            <CheckCircle size={24} />
          </div>
          <div className="clear-text-content">
            <h4>{t.noAlerts}</h4>
            <p>{t.verifiedClear}</p>
            <div className="alert-meta-footer">
              <span>
                <strong>{t.source}:</strong> {source}
              </span>
              <span>
                <strong>{t.lastUpdated}:</strong> {lastChecked}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Active Alerts List */
        <div className="alerts-active-list">
          {alerts.map((alert) => (
            <div
              key={alert.id || alert.title}
              className={`alert-banner-item alert-level-${alert.severity_level || "moderate"}`}
            >
              <div className="alert-item-header">
                <div className="alert-item-title-group">
                  <AlertTriangle size={18} className="alert-item-icon" />
                  <h4>{alert.title}</h4>
                </div>
                <span className="alert-severity-badge">
                  {alert.severity || "Warning"}
                </span>
              </div>

              <p className="alert-item-desc">{alert.description}</p>

              <div className="alert-item-grid">
                <div className="alert-meta-col">
                  <span className="alert-meta-label">
                    <MapPin size={12} /> Affected Area
                  </span>
                  <span className="alert-meta-val">
                    {alert.affected_location}
                  </span>
                </div>

                <div className="alert-meta-col">
                  <span className="alert-meta-label">
                    <Clock size={12} /> Duration
                  </span>
                  <span className="alert-meta-val">
                    {alert.start_time} — {alert.end_time}
                  </span>
                </div>

                <div className="alert-meta-col">
                  <span className="alert-meta-label">
                    <ExternalLink size={12} /> Source
                  </span>
                  <span className="alert-meta-val">
                    {alert.source} ({alert.updated_at})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
