import {
  Calendar,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
} from "lucide-react";

function getWeatherIcon(iconName, size = 22) {
  switch (iconName) {
    case "sun":
      return <Sun size={size} className="w-icon-sun" />;
    case "cloud-rain":
      return <CloudRain size={size} className="w-icon-rain" />;
    case "cloud-rain-heavy":
      return <CloudRain size={size} className="w-icon-rain-heavy" />;
    case "cloud-lightning":
      return <CloudLightning size={size} className="w-icon-storm" />;
    case "cloud-drizzle":
      return <CloudDrizzle size={size} className="w-icon-drizzle" />;
    case "fog":
      return <CloudFog size={size} className="w-icon-fog" />;
    case "cloud":
    case "cloud-sun":
    case "sun-cloud":
    default:
      return <Cloud size={size} className="w-icon-cloud" />;
  }
}

export default function WeeklyForecast({ forecast = [], t }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="weather-section-container">
      <div className="section-title-bar">
        <div className="section-title-left">
          <Calendar size={20} className="section-header-icon" />
          <h3 className="section-heading">{t.weeklyForecast}</h3>
        </div>
        <span className="section-count-pill">7 Days</span>
      </div>

      <div className="weekly-forecast-grid">
        {forecast.map((item, index) => {
          const isToday = index === 0;
          return (
            <div
              key={item.date || index}
              className={`weekly-card ${isToday ? "weekly-card-today" : ""}`}
            >
              <div className="weekly-card-header">
                <span className="weekly-day-title">{item.day}</span>
                <span className="weekly-date-sub">{item.date}</span>
              </div>

              <div className="weekly-icon-row">
                <div className="weekly-icon-bubble">
                  {getWeatherIcon(item.icon, 28)}
                </div>
                <span className="weekly-condition-text">{item.condition}</span>
              </div>

              {/* Temperature Range */}
              <div className="weekly-temp-row">
                <span className="weekly-temp-max">{Math.round(item.temp_max)}°</span>
                <div className="temp-bar-track">
                  <div className="temp-bar-fill" />
                </div>
                <span className="weekly-temp-min">{Math.round(item.temp_min)}°</span>
              </div>

              {/* Rain and Wind Metrics */}
              <div className="weekly-metrics-list">
                <div className="weekly-metric-item">
                  <span className="wm-label">
                    <Droplets size={12} className="wm-icon rain-icon" />
                    {t.rainChance}:
                  </span>
                  <span className="wm-val font-semibold">
                    {item.rainfall_probability}%
                  </span>
                </div>

                <div className="weekly-metric-item">
                  <span className="wm-label">
                    <Droplets size={12} className="wm-icon" />
                    {t.rainfall}:
                  </span>
                  <span className="wm-val font-semibold">
                    {item.expected_rainfall} mm
                  </span>
                </div>

                <div className="weekly-metric-item">
                  <span className="wm-label">
                    <Wind size={12} className="wm-icon" />
                    {t.windSpeed}:
                  </span>
                  <span className="wm-val">
                    {item.wind_speed} km/h
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
