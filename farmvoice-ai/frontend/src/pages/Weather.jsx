import { useAuth } from "../components/AuthProvider";
import { Cloud, Sun, Thermometer, Wind } from "lucide-react";
import "../styles/dashboard.css";

export default function Weather() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Weather</h1>
        <p className="page-sub">
          Localized weather forecasts for your region.
        </p>
      </div>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon"><Cloud size={20} /></div>
          <div>
            <p className="feature-title">Weather Forecast</p>
            <p className="feature-text">
              View localized weather forecasts for your farm region.
            </p>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Sun size={20} /></div>
          <div>
            <p className="feature-title">Temperature</p>
            <p className="feature-text">
              Current and expected temperature for sowing decisions.
            </p>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Thermometer size={20} /></div>
          <div>
            <p className="feature-title">Rainfall</p>
            <p className="feature-text">
              Rainfall alerts to plan irrigation and harvesting.
            </p>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Wind size={20} /></div>
          <div>
            <p className="feature-title">Wind Conditions</p>
            <p className="feature-text">
              Wind speed and direction for spraying operations.
            </p>
          </div>
        </div>
      </section>

      <div className="empty-state">
        <p>
          Weather data is not yet connected to a backend provider. Weather
          features will be available in an upcoming phase.
        </p>
      </div>
    </div>
  );
}
