import { useEffect } from "react";
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
} from "lucide-react";
import "../styles/dashboard.css";

const cards = [
  {
    icon: Building2,
    title: "My Farm",
    description: "Manage your farm details and land records.",
    placeholder: "Farm records coming soon",
    href: "/my-farm",
  },
  {
    icon: Crop,
    title: "Crop Information",
    description: "Track crop growth, stages and health.",
    placeholder: "Crop data coming soon",
    href: "/crop-info",
  },
  {
    icon: Cloud,
    title: "Weather Updates",
    description: "Localized weather forecasts for your region.",
    placeholder: "Weather data coming soon",
    href: "/weather",
  },
  {
    icon: Sparkles,
    title: "AI Farmer Assistant",
    description: "Ask farming questions in your regional language.",
    placeholder: "AI assistant coming soon",
    href: "/ai-assistant",
  },
];

const upcoming = [
  { title: "Recent Farm Activities", icon: Activity, text: "Your recent farm activities will appear here." },
  { title: "Crop Overview", icon: Crop, text: "Overview of your crops will be displayed here." },
  { title: "Weather Information", icon: Cloud, text: "Weather details for your location coming soon." },
  { title: "AI Assistant", icon: Bot, text: "Chat with your AI farming assistant." },
];

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    // Ensure profile is fresh; safe to call again (cookie sent automatically)
    authService.getProfile().catch(() => {
      // profile errors handled by AuthProvider
    });
  }, []);

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="welcome-section">
          <h1>Welcome to FarmVoice AI</h1>
          <p className="welcome-sub">Your intelligent farming companion.</p>
          <div className="farmer-info">
            <div className="info-item">
              <span className="info-label">Farmer ID</span>
              <span className="info-value">#{user?.farmer_id ?? "—"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{user?.username ?? "—"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Farm Name</span>
              <span className="info-value">{user?.farm_name ?? "—"}</span>
            </div>
          </div>
        </section>

        <section className="cards-section">
          <h2 className="section-title">Quick Access</h2>
          <div className="cards-grid">
            {cards.map((card) => (
              <DashboardCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="placeholders-section">
          <h2 className="section-title">Upcoming Modules</h2>
          <div className="placeholder-grid">
            {upcoming.map((item) => (
              <div className="placeholder-card" key={item.title}>
                <div className="placeholder-icon">{item.icon ? <item.icon size={20} /> : null}</div>
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
      </main>
    </div>
  );
}
