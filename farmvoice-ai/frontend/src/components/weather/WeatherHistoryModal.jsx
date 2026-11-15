import { History, X, Calendar, Droplets, Wind, Thermometer, MapPin } from "lucide-react";

export default function WeatherHistoryModal({ isOpen, onClose, history = [], t }) {
  if (!isOpen) return null;

  return (
    <div className="weather-modal-backdrop" role="dialog" aria-modal="true">
      <div className="weather-modal-container">
        <div className="weather-modal-header">
          <div className="wm-header-title">
            <History size={20} />
            <div>
              <h3>{t.historyTitle}</h3>
              <p>{t.historySubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="wm-close-btn"
            onClick={onClose}
            title={t.close}
          >
            <X size={20} />
          </button>
        </div>

        <div className="weather-modal-body">
          {history.length === 0 ? (
            <div className="history-empty-state">
              <History size={36} className="text-muted" />
              <p>{t.noHistory}</p>
            </div>
          ) : (
            <div className="history-table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Location</th>
                    <th>Condition</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Rainfall</th>
                    <th>Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec) => (
                    <tr key={rec.id}>
                      <td className="hist-time">
                        <Calendar size={12} className="inline-icon" />
                        {rec.recorded_at ? new Date(rec.recorded_at).toLocaleString() : "—"}
                      </td>
                      <td className="hist-loc">
                        <MapPin size={12} className="inline-icon" />
                        {rec.location}
                      </td>
                      <td>
                        <span className="hist-cond-pill">{rec.weather_condition}</span>
                      </td>
                      <td className="hist-val font-semibold">
                        {rec.temperature !== null ? `${rec.temperature}°C` : "—"}
                      </td>
                      <td className="hist-val">
                        {rec.humidity !== null ? `${rec.humidity}%` : "—"}
                      </td>
                      <td className="hist-val">
                        {rec.rainfall !== null ? `${rec.rainfall} mm` : "0.0 mm"}
                      </td>
                      <td className="hist-val">
                        {rec.wind_speed !== null ? `${rec.wind_speed} km/h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="weather-modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
