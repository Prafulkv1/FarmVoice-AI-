import { Bell, User, LogOut, Sprout } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/dashboard.css";

export default function DashboardHeader() {
  const { user, logout: clearAuth } = useAuth();
  const navigate = useNavigate();

  const username = user?.username || "Farmer";
  const farmName = user?.farm_name;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore network errors; still clear local state
    }
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-icon"><Sprout size={22} color="#D6A84B" /></div>
          <div>
            <div className="brand-name">FarmVoice AI</div>
            <div className="brand-sub">Farmer Dashboard</div>
          </div>
        </div>

        <div className="header-welcome">
          <span className="welcome-text">Welcome back,</span>
          <span className="welcome-user">{username}</span>
          {farmName && <span className="welcome-farm">· {farmName}</span>}
        </div>

        <div className="header-actions">
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className="icon-btn" aria-label="Profile">
            <User size={20} />
          </button>
          <button className="btn-logout" onClick={handleLogout} aria-label="Logout">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}