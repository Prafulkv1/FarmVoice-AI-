import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Cloud,
  Loader2,
  AlertCircle,
  MapPin,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../components/AuthProvider";
import { weatherService } from "../services/weatherService";
import { getTranslation } from "../utils/weatherTranslations";

import CurrentWeather from "../components/weather/CurrentWeather";
import WeeklyForecast from "../components/weather/WeeklyForecast";
import HourlyForecast from "../components/weather/HourlyForecast";
import RainfallChart from "../components/weather/RainfallChart";
import WeatherAlerts from "../components/weather/WeatherAlerts";
import WeatherAdvisory from "../components/weather/WeatherAdvisory";
import WeatherHistoryModal from "../components/weather/WeatherHistoryModal";

import "../styles/weather.css";

export default function Weather() {
  const { user } = useAuth();

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLocationRequired, setIsLocationRequired] = useState(false);

  // Language management
  const [currentLanguage, setCurrentLanguage] = useState(
    user?.preferred_language || "English"
  );

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const t = useMemo(() => {
    return getTranslation(currentLanguage);
  }, [currentLanguage]);

  const loadWeather = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setIsLocationRequired(false);

      const res = await weatherService.getAllWeather(isRefresh);
      if (res.data?.success) {
        setWeatherData(res.data);
        if (res.data.preferred_language && !user?.preferred_language) {
          setCurrentLanguage(res.data.preferred_language);
        }
      }
    } catch (err) {
      console.error("Error loading weather data:", err);
      if (err.response?.status === 400 && err.response?.data?.error === "PROFILE_LOCATION_REQUIRED") {
        setIsLocationRequired(true);
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to fetch localized weather data. Please check your backend connection."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleRefresh = () => {
    loadWeather(true);
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      const res = await weatherService.getHistory();
      if (res.data?.success) {
        setHistoryList(res.data.history || []);
      }
    } catch (err) {
      console.error("Failed to load weather history:", err);
    }
  };

  return (
    <div className="weather-page-container">
      {/* Top Banner / Incomplete Location State */}
      {isLocationRequired && (
        <div className="location-incomplete-banner">
          <div className="incomplete-banner-left">
            <div className="incomplete-icon-bubble">
              <MapPin size={26} />
            </div>
            <div className="incomplete-text-group">
              <h3>{t.profileIncompleteTitle}</h3>
              <p>{t.profileIncompleteDesc}</p>
            </div>
          </div>
          <Link to="/profile" className="btn-complete-profile">
            <span>{t.completeProfileBtn}</span>
            <ChevronRight size={18} />
          </Link>
        </div>
      )}

      {/* General Error Banner */}
      {error && (
        <div className="profile-alert error">
          <AlertCircle size={20} className="profile-alert-icon" />
          <div className="profile-alert-content">
            <strong>Weather Service Notice</strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-retry-link"
            onClick={() => loadWeather()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Screen */}
      {loading ? (
        <div className="profile-state-screen">
          <Loader2 size={38} className="spin text-green" />
          <h3>Connecting to Agricultural Meteorological Systems</h3>
          <p>Fetching real-time weather and precipitation models for your farm...</p>
        </div>
      ) : weatherData ? (
        <>
          {/* Section A: Current Weather */}
          <CurrentWeather
            current={weatherData.current}
            location={weatherData.location}
            t={t}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onOpenHistory={handleOpenHistory}
          />

          {/* Section 7: Weather-Based Farming Advisory */}
          <WeatherAdvisory
            advisories={weatherData.advisories}
            farmerCrops={weatherData.farmer_crops}
            t={t}
          />

          {/* Section E: Weather Alerts (IMD & Forecast Notices) */}
          <WeatherAlerts alertsData={weatherData.alerts} t={t} />

          {/* Section C: Hourly Weather Forecast */}
          <HourlyForecast hourly={weatherData.hourly_forecast} t={t} />

          {/* Section B: Seven-Day Weather Forecast */}
          <WeeklyForecast forecast={weatherData.daily_forecast} t={t} />

          {/* Section D: Rainfall Monitoring & Trend Chart */}
          <RainfallChart rainfall={weatherData.rainfall} t={t} />
        </>
      ) : null}

      {/* Weather History Modal */}
      <WeatherHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={historyList}
        t={t}
      />
    </div>
  );
}
