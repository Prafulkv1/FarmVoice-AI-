import {
  Clock,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
} from "lucide-react";

function getWeatherIcon(iconName, size = 18) {
  switch (iconName) {
    case "sun":
      return <Sun size={size} className="w-icon-sun" />;
    case "cloud-rain":
    case "cloud-rain-heavy":
      return <CloudRain size={size} className="w-icon-rain" />;
    case "cloud-lightning":
      return <CloudLightning size={size} className="w-icon-storm" />;
    case "cloud-drizzle":
      return <CloudDrizzle size={size} className="w-icon-drizzle" />;
    case "fog":
      return <CloudFog size={size} className="w-icon-fog" />;
    default:
      return <Cloud size={size} className="w-icon-cloud" />;
  }
}

export default function HourlyForecast({ hourly = [], t }) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="weather-section-container">
      <div className="section-title-bar">
        <div className="section-title-left">
          <Clock size={20} className="section-header-icon" />
          <h3 className="section-heading">{t.hourlyForecast}</h3>
        </div>
        <span className="section-count-pill">{hourly.length} Hours</span>
      </div>

      <div className="hourly-scroll-container">
        <div className="hourly-track">
          {hourly.map((item, idx) => (
            <div key={item.time || idx} className="hourly-card">
              <span className="hourly-time-label">{item.hour}</span>
              <div className="hourly-icon-wrap">
                {getWeatherIcon(item.icon, 22)}
              </div>
              <span className="hourly-temp-value">
                {Math.round(item.temperature)}°C
              </span>
              <span className="hourly-condition-sub">{item.condition}</span>

              <div className="hourly-indicators">
                <div className="hourly-indicator-row" title="Rainfall Probability">
                  <Droplets size={11} className="ind-rain" />
                  <span>{item.rainfall_probability}%</span>
                </div>
                <div className="hourly-indicator-row" title="Wind Speed">
                  <Wind size={11} className="ind-wind" />
                  <span>{item.wind_speed} km/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
