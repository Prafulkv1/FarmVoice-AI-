import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import {
  Sprout,
  Home,
  User,
  Mail,
  Layout,
  Bot,
  Building2,
  Crop,
  Cloud,
  Menu,
  X,
} from "lucide-react";
import "../styles/navbar.css";

const publicLinks = [
  { name: "Home", to: "/", icon: <Home size={16} /> },
  { name: "About", to: "/about", icon: <User size={16} /> },
  { name: "Contact", to: "/contact", icon: <Mail size={16} /> },
];

const dashboardLinks = [
  { name: "Dashboard", to: "/dashboard", icon: <Layout size={16} /> },
  { name: "AI Assistant", to: "/ai-assistant", icon: <Bot size={16} /> },
  { name: "My Farm", to: "/my-farm", icon: <Building2 size={16} /> },
  { name: "Crop Information", to: "/crop-info", icon: <Crop size={16} /> },
  { name: "Weather", to: "/weather", icon: <Cloud size={16} /> },
  { name: "Profile", to: "/profile", icon: <User size={16} /> },
];

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, checking } = useAuth();
  const [open, setOpen] = useState(false);

  const links = checking ? [] : isAuthenticated ? dashboardLinks : publicLinks;

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname === to;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon"><Sprout size={20} color="#D6A84B" /></div>
          <span className="brand-name">FarmVoice AI</span>
        </div>

        <div className="navbar-menu" data-open={open}>
          {links.map((link) => (
            <a
              key={link.name}
              href={link.to}
              onClick={() => setOpen(false)}
              className={`nav-link${isActive(link.to) ? " active" : ""}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
        </div>

        <button className="navbar-toggle" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}