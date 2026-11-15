import { Bell, User, LogOut, Sprout, Sparkles } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { authService } from "../services/authService";
import ThemeToggle from "./ThemeToggle";
import "../styles/dashboard.css";

const PAGE_TITLES = {
  "/dashboard": "Farmer Dashboard",
  "/farm-diary": "Farm Diary & Records",
  "/ai-assistant": "Regional AI Assistant",
  "/weather": "Meteorological & Weather Intel",
  "/government-schemes": "Government Agricultural Schemes",
  "/notifications": "Notifications & Alerts",
  "/my-farm": "My Farm Land & Records",
  "/crop-info": "Crop Information & Tracking",
  "/profile": "Farmer Profile",
};

export default function DashboardHeader() {
  const { user, logout: clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const username = user?.username || "Farmer";
  const farmName = user?.farm_name;
  const currentTitle = PAGE_TITLES[location.pathname] || "FarmVoice AI";

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore network errors; clear local auth state
    }
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        {/* Left: Dynamic Page Title / Breadcrumb */}
        <div className="header-left-pane">
          <div className="header-title-wrap">
            <h1 className="header-page-title">{currentTitle}</h1>
            {farmName && <span className="header-farm-badge">🌾 {farmName}</span>}
          </div>
        </div>

        {/* Center: Welcome greeting */}
        <div className="header-welcome-greeting">
          <span className="welcome-tag">Active Farmer</span>
          <span className="welcome-farmer-name">{username}</span>
        </div>

        {/* Right Actions: Theme Toggle + Notifications + Profile + Logout */}
        <div className="header-actions">
          {/* Theme switcher */}
          <div className="header-theme-toggle-wrap">
            <ThemeToggle />
          </div>

          {/* Notifications shortcut */}
          <Link
            to="/notifications"
            className={`header-icon-btn ${location.pathname === "/notifications" ? "active" : ""}`}
            aria-label="Notifications"
            title="Notifications & Advisories"
          >
            <Bell size={19} />
            <span className="notif-badge-indicator" />
          </Link>

          {/* Profile shortcut */}
          <Link
            to="/profile"
            className={`header-icon-btn ${location.pathname === "/profile" ? "active" : ""}`}
            aria-label="Farmer Profile"
            title="Farmer Profile"
          >
            <User size={19} />
          </Link>

          {/* Logout button */}
          <button
            className="btn-header-logout"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout from session"
          >
            <LogOut size={16} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
