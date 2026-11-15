import {
  MapPin,
  RefreshCw,
  Droplets,
  Wind,
  Compass,
  Gauge,
  Cloud,
  Sunrise,
  Sunset,
  Clock,
  Thermometer,
  Globe,
  History,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../utils/weatherTranslations";

export default function CurrentWeather({
  current,
  location,
  t,
  currentLanguage,
  onLanguageChange,
  onRefresh,
  refreshing,
  onOpenHistory,
}) {
  if (!current) return null;

  const locName =
    location?.location_name ||
    location?.resolved_city ||
    current?.location_name ||
    "Farm Location";

  return (
    <div className="current-weather-card">
      {/* Location & Controls Header */}
      <div className="current-weather-header">
        <div className="location-info-group">
          <div className="location-icon-bubble">
            <MapPin size={22} />
          </div>
          <div>
            <span className="location-tag">{t.locationBased}</span>
            <h2 className="location-name">{locName}</h2>
          </div>
        </div>

        <div className="weather-top-controls">
          {/* Language Selector */}
          <div className="weather-lang-select-wrap">
            <Globe size={15} className="lang-icon" />
            <select
              className="weather-lang-select"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              title="Select Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* History Button */}
          <button
            type="button"
            className="btn-weather-history"
            onClick={onOpenHistory}
            title={t.viewHistory}
          >
            <History size={16} />
            <span className="btn-label-desktop">{t.viewHistory}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn-weather-refresh"
            onClick={onRefresh}
            disabled={refreshing}
            title={t.refresh}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            <span className="btn-label-desktop">
              {refreshing ? t.refreshing : t.refresh}
            </span>
          </button>
        </div>
      </div>

      {/* Main Temperature & Condition Display */}
      <div className="current-main-row">
        <div className="temp-hero-section">
          <div className="temp-number-wrap">
            <span className="temp-hero-value">{Math.round(current.temperature)}</span>
            <span className="temp-hero-unit">°C</span>
          </div>

          <div className="temp-sub-details">
            <span className="condition-badge">{current.condition}</span>
            <div className="feels-and-range">
              <span>
                {t.feelsLike}: <strong>{current.feels_like}°C</strong>
              </span>
              {(current.temp_min !== null || current.temp_max !== null) && (
                <span className="min-max-inline">
                  <Thermometer size={14} />
                  {current.temp_min}°C / {current.temp_max}°C
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="current-timestamp-badge">
          <Clock size={14} />
          <span>
            {t.lastUpdated}: {current.last_updated}
          </span>
        </div>
      </div>

      {/* 8-Metric Meteorological Grid */}
      <div className="current-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon-wrap icon-blue">
            <Droplets size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.humidity}</span>
            <span className="metric-value">{current.humidity}%</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-teal">
            <Wind size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.windSpeed}</span>
            <span className="metric-value">{current.wind_speed} km/h</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-cyan">
            <Compass size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.windDirection}</span>
            <span className="metric-value">{current.wind_direction}</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-indigo">
            <Droplets size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.rainfall}</span>
            <span className="metric-value">{current.rainfall} mm</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-purple">
            <Gauge size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.pressure}</span>
            <span className="metric-value">{current.pressure} hPa</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-gray">
            <Cloud size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.cloudCover}</span>
            <span className="metric-value">{current.cloud_cover}%</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-amber">
            <Sunrise size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.sunrise}</span>
            <span className="metric-value">{current.sunrise}</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap icon-orange">
            <Sunset size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-label">{t.sunset}</span>
            <span className="metric-value">{current.sunset}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
