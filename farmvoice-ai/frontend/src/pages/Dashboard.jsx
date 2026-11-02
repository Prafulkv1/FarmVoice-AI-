import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { authService } from "../services/authService";
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
} from "lucide-react";
import "../styles/dashboard.css";

const quickActions = [
  {
    icon: Sparkles,
    title: "Ask AI Assistant",
    description: "Get farming advice in your regional language.",
    href: "/ai-assistant",
    accent: "var(--color-primary)",
  },
  {
    icon: Building2,
    title: "Manage My Farm",
    description: "View and update your farm details.",
    href: "/my-farm",
    accent: "var(--color-secondary)",
  },
  {
    icon: Crop,
    title: "Crop Information",
    description: "Track crop growth and health.",
    href: "/crop-info",
    accent: "var(--color-accent)",
  },
  {
    icon: Cloud,
    title: "Check Weather",
    description: "Localized weather forecasts.",
    href: "/weather",
    accent: "var(--color-primary-light)",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    authService.getProfile().catch(() => {});
  }, []);

  const username = user?.username || "Farmer";
  const farmName = user?.farm_name;

  const stats = [
    {
      icon: Crop,
      label: "Registered Crops",
      value: "—",
      note: "Crop tracking coming soon",
    },
    {
      icon: MapPin,
      label: "Farm Area",
      value: "—",
      note: "Land records coming soon",
    },
    {
      icon: Cloud,
      label: "Weather",
      value: "—",
      note: "Weather integration pending",
    },
    {
      icon: Activity,
      label: "AI Queries",
      value: "—",
      note: "Activity tracking pending",
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <div className="welcome-banner">
          <div className="welcome-banner-text">
            <h1>Welcome back, {username} 👋</h1>
            <p className="welcome-sub">
              Here is your farm overview. {farmName ? `Farm: ${farmName}` : ""}
            </p>
            <div className="welcome-meta">
              <span className="welcome-meta-item">
                <Calendar size={14} /> {date}
              </span>
              <span className="welcome-meta-item">
                <TrendingUp size={14} /> FarmVoice AI Dashboard
              </span>
            </div>
          </div>
          <div className="welcome-illustration">
            <SproutIcon />
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">Overview</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon">
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

      <section className="cards-section">
        <h2 className="section-title">Quick Access</h2>
        <div className="cards-grid">
          {quickActions.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="placeholders-section">
        <h2 className="section-title">Upcoming Modules</h2>
        <div className="placeholder-grid">
          {[
            { title: "Recent Farm Activities", icon: Activity, text: "Your recent farm activities will appear here." },
            { title: "Crop Overview", icon: Crop, text: "Overview of your crops will be displayed here." },
            { title: "Weather Information", icon: Cloud, text: "Weather details for your location coming soon." },
            { title: "AI Assistant", icon: Bot, text: "Chat with your AI farming assistant." },
          ].map((item) => (
            <div className="placeholder-card" key={item.title}>
              <div className="placeholder-icon">
                <item.icon size={20} />
              </div>
              <h4 className="placeholder-title">{item.title}</h4>
              <p className="placeholder-text">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="coming-soon">
          AI assistant, crop information, weather updates, government schemes,
          market prices and reminders will be implemented in upcoming phases.
        </p>
      </section>
    </div>
  );
}

function SproutIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="rgba(255,255,255,0.15)" />
      <path d="M60 90 V50" stroke="rgba(255,255,255,0.9)" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 55 C40 55 35 40 35 30 C50 30 60 45 60 55Z" fill="rgba(255,255,255,0.85)" />
      <path d="M60 65 C80 65 85 50 85 40 C70 40 60 55 60 65Z" fill="rgba(255,255,255,0.7)" />
      <ellipse cx="60" cy="92" rx="20" ry="6" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
