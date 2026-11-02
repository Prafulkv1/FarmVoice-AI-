import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Layout,
  Bot,
  Building2,
  Crop,
  Cloud,
  User,
  Menu,
  X,
  Sprout,
} from "lucide-react";

import "../styles/dashboard.css";

const sidebarLinks = [
  { name: "Dashboard", to: "/dashboard", icon: Layout },
  { name: "AI Assistant", to: "/ai-assistant", icon: Bot },
  { name: "My Farm", to: "/my-farm", icon: Building2 },
  { name: "Crop Information", to: "/crop-info", icon: Crop },
  { name: "Weather", to: "/weather", icon: Cloud },
  { name: "Profile", to: "/profile", icon: User },
];

const MOBILE_BREAKPOINT = 768;

const initialExpanded = () => {
  if (typeof window === "undefined") return true;
  return window.innerWidth >= MOBILE_BREAKPOINT;
};

export default function Sidebar() {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (mobile) {
        setExpanded(false);
        setMobileOpen(false);
      } else {
        setExpanded(true);
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

  const toggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      {isMobile && mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <nav
        className={`sidebar ${expanded ? "expanded" : "collapsed"} ${
          isMobile && mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Sprout size={20} color="#D6A84B" />
            </div>
            {expanded && <span className="brand-name">FarmVoice AI</span>}
          </div>
        </div>

        <div className="sidebar-menu">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
              title={!expanded && !isMobile ? link.name : ""}
              onClick={() => {
                if (isMobile) setMobileOpen(false);
              }}
            >
              <link.icon size={20} />
              {expanded && <span>{link.name}</span>}
            </NavLink>
          ))}
        </div>

        <button
          className="sidebar-toggle"
          aria-label={isMobile ? (mobileOpen ? "Close menu" : "Open menu") : "Toggle sidebar"}
          onClick={toggle}
        >
          {isMobile ? (mobileOpen ? <X size={20} /> : <Menu size={20} />) : expanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMobile && !mobileOpen && (
        <button
          className="sidebar-mobile-toggle"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}
