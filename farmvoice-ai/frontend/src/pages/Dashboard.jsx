import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { authService } from "../services/authService";
import { farmDiaryService } from "../services/farmDiaryService";
import { weatherService } from "../services/weatherService";
import DashboardCard from "../components/DashboardCard";
import {
  Building2,
  Crop,
  Cloud,
  Sparkles,
  Activity,
  Bot,
  Calendar,
  TrendingUp,
  MapPin,
  ShieldCheck,
  BookOpen,
  Bell,
  ArrowRight,
  Sun,
  Droplets,
  Wind,
} from "lucide-react";
import "../styles/dashboard.css";

const quickActions = [
  {
    icon: Sparkles,
    title: "Ask AI Assistant",
    description: "Get farming advice in your regional language with voice.",
    href: "/ai-assistant",
    accent: "var(--primary-color)",
  },
  {
    icon: Cloud,
    title: "Check Weather",
    description: "Localized agricultural forecasts and rain models.",
    href: "/weather",
    accent: "#0288D1",
  },
  {
    icon: ShieldCheck,
    title: "Government Schemes",
    description: "Explore PM-KISAN, PMFBY, and farmer subsidies.",
    href: "/government-schemes",
    accent: "#388E3C",
  },
  {
    icon: BookOpen,
    title: "Farm Diary",
    description: "Log daily farm activities, expenses, and harvests.",
    href: "/farm-diary",
    accent: "#E65100",
  },
  {
    icon: Building2,
    title: "Manage My Farm",
    description: "View and update your farm details and land records.",
    href: "/my-farm",
    accent: "#5C6BC0",
  },
  {
    icon: Crop,
    title: "Crop Information",
    description: "Track crop growth stages, variety, and health.",
    href: "/crop-info",
    accent: "#7CB342",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [cropCount, setCropCount] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    // Refresh profile in background
    authService.getProfile().catch(() => {});

    // Attempt to read actual crop count if available
    farmDiaryService
      .listCrops()
      .then((res) => {
        if (res.data?.crops) {
          setCropCount(res.data.crops.length);
        }
      })
      .catch(() => {});

    // Attempt to read current weather if available
    weatherService
      .getCurrentWeather()
      .then((res) => {
        if (res.data?.current) {
          setCurrentWeather(res.data.current);
        }
      })
      .catch(() => {});
  }, []);

  const username = user?.username || "Farmer";
  const farmName = user?.farm_name;
  const landArea = user?.total_land_size
    ? `${user.total_land_size} ${user.land_unit || "Acres"}`
    : "—";

  const stats = [
    {
      icon: Crop,
      label: "Registered Crops",
      value: cropCount !== null ? cropCount : "—",
      note: cropCount !== null ? "From your Farm Diary" : "Crop tracking active",
      color: "var(--primary-color)",
    },
    {
      icon: MapPin,
      label: "Farm Area",
      value: landArea,
      note: user?.total_land_size ? "Verified land record" : "Update in profile",
      color: "#2E7D32",
    },
    {
      icon: Cloud,
      label: "Weather Intel",
      value: currentWeather?.temperature ? `${Math.round(currentWeather.temperature)}°C` : "—",
      note: currentWeather?.weather_description || "Localized forecast active",
      color: "#0288D1",
    },
    {
      icon: Activity,
      label: "AI Queries",
      value: "Active",
      note: "Voice & text assistant ready",
      color: "#FBC02D",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-section">
        <div className="welcome-banner">
          <div className="welcome-banner-text">
            <div className="welcome-badge">
              <span className="live-dot" />
              <span>Active Agricultural Portal</span>
            </div>
            <h1 className="welcome-heading">Welcome back, {username}! 👋</h1>
            <p className="welcome-sub">
              {farmName ? `Managing ${farmName}` : "Here is your farm overview and agricultural operations."}
            </p>
            <div className="welcome-meta">
              <span className="welcome-meta-item">
                <Calendar size={15} /> {date}
              </span>
              <span className="welcome-meta-item">
                <TrendingUp size={15} /> Real-time Agricultural Intel
              </span>
            </div>
          </div>
          <div className="welcome-illustration">
            <SproutIllustration />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section-title-row">
          <h2 className="section-title">Farm Overview</h2>
          <span className="section-title-sub">Current status of your farm holdings</span>
        </div>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon-wrap" style={{ color: stat.color }}>
                <stat.icon size={22} />
              </div>
              <div className="stat-body">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-note">{stat.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="cards-section">
        <div className="section-title-row">
          <h2 className="section-title">Quick Access</h2>
          <span className="section-title-sub">Essential farmer tools and services</span>
        </div>
        <div className="cards-grid">
          {quickActions.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      {/* Weather & Advisories Quick Highlights */}
      <section className="dashboard-split-section">
        <div className="dashboard-highlight-card">
          <div className="highlight-card-header">
            <div className="header-icon-pill weather-pill">
              <Cloud size={18} />
              <span>Weather &amp; Precipitation</span>
            </div>
            <Link to="/weather" className="highlight-card-link">
              <span>Full Forecast</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="highlight-card-body">
            {currentWeather ? (
              <div className="weather-preview-box">
                <div className="weather-preview-temp">
                  <Sun size={28} className="temp-icon" />
                  <span className="temp-degree">{Math.round(currentWeather.temperature)}°C</span>
                  <span className="temp-condition">{currentWeather.weather_description}</span>
                </div>
                <div className="weather-preview-meta">
                  <span>Humidity: {currentWeather.humidity}%</span>
                  <span>Wind: {currentWeather.wind_speed} km/h</span>
                </div>
              </div>
            ) : (
              <p className="highlight-text-muted">
                Localized weather and rain models are active. View the dedicated weather module for 7-day hourly forecasts and IMD advisory alerts.
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-highlight-card">
          <div className="highlight-card-header">
            <div className="header-icon-pill notif-pill">
              <Bell size={18} />
              <span>Advisories &amp; Schemes</span>
            </div>
            <Link to="/notifications" className="highlight-card-link">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="highlight-card-body">
            <div className="advisory-preview-item">
              <div className="advisory-dot" />
              <div>
                <h4 className="advisory-title">Kharif Season Support Active</h4>
                <p className="advisory-desc">
                  Explore eligible subsidies under PM-KISAN, PMFBY crop insurance, and Soil Health testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Modules / Phase Notice */}
      <section className="placeholders-section">
        <div className="section-title-row">
          <h2 className="section-title">Farm Modules & Roadmap</h2>
          <span className="section-title-sub">Continuously expanding features for Indian farmers</span>
        </div>
        <div className="placeholder-grid">
          {[
            {
              title: "Recent Farm Activities",
              icon: Activity,
              text: "Record and review daily land preparation, irrigation, and pesticide sprays in your Farm Diary.",
              link: "/farm-diary",
            },
            {
              title: "Crop Overview",
              icon: Crop,
              text: "Register crop varieties, track acreage, and monitor flowering to harvesting timelines.",
              link: "/crop-info",
            },
            {
              title: "Meteorological Intelligence",
              icon: Cloud,
              text: "Real-time rain forecast charts, soil moisture indicators, and IMD extreme weather alerts.",
              link: "/weather",
            },
            {
              title: "Multilingual AI Assistant",
              icon: Bot,
              text: "Ask questions in Hindi, Telugu, Tamil, Marathi, Punjabi, and 5 other regional languages.",
              link: "/ai-assistant",
            },
          ].map((item) => (
            <Link to={item.link} className="placeholder-card" key={item.title}>
              <div className="placeholder-icon">
                <item.icon size={22} />
              </div>
              <h4 className="placeholder-title">{item.title}</h4>
              <p className="placeholder-text">{item.text}</p>
              <span className="placeholder-link-arrow">
                <span>Open Module</span>
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
        <p className="coming-soon">
          🌾 FarmVoice AI connects your farm to regional meteorological stations, government welfare schemes, and language-first agricultural intelligence.
        </p>
      </section>
    </div>
  );
}

function SproutIllustration() {
  return (
    <svg
      width="130"
      height="130"
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="dashboard-sprout-svg"
    >
      <circle cx="65" cy="65" r="62" fill="rgba(255,255,255,0.12)" />
      <circle cx="65" cy="65" r="48" fill="rgba(255,255,255,0.08)" />
      {/* Plant Stem */}
      <path
        d="M65 96 V52"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Left Leaf */}
      <path
        d="M65 58 C42 58 36 40 36 30 C52 30 65 46 65 58Z"
        fill="rgba(255,255,255,0.9)"
      />
      {/* Right Leaf */}
      <path
        d="M65 70 C88 70 94 52 94 42 C78 42 65 58 65 70Z"
        fill="rgba(255,255,255,0.8)"
      />
      {/* Base Mounded Soil */}
      <ellipse cx="65" cy="98" rx="26" ry="8" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
