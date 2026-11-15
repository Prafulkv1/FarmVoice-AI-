import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Cloud,
  ShieldCheck,
  Bell,
  Building2,
  Crop,
  User,
  Menu,
  X,
  Sprout,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import "../styles/dashboard.css";

const sidebarLinks = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "Farm Diary", to: "/farm-diary", icon: BookOpen },
  { name: "AI Assistant", to: "/ai-assistant", icon: Bot },
  { name: "Weather", to: "/weather", icon: Cloud },
  { name: "Government Schemes", to: "/government-schemes", icon: ShieldCheck },
  { name: "Notifications", to: "/notifications", icon: Bell },
  { name: "My Farm", to: "/my-farm", icon: Building2 },
  { name: "Crop Information", to: "/crop-info", icon: Crop },
  { name: "Profile", to: "/profile", icon: User },
];

const MOBILE_BREAKPOINT = 860;

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
        {/* Sidebar Header / Brand */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-badge">
              <Sprout size={20} className="brand-leaf-icon" />
            </div>
            {expanded && (
              <div className="sidebar-brand-meta">
                <span className="brand-name">
                  FarmVoice <span className="brand-accent">AI</span>
                </span>
                <span className="brand-subtitle">Farmer Portal</span>
              </div>
            )}
          </div>
          {!isMobile && (
            <button
              className="sidebar-collapse-btn"
              onClick={toggle}
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="sidebar-menu">
          <div className="sidebar-menu-label">
            {expanded ? "MAIN MENU" : "•••"}
          </div>
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
              <span className="sidebar-item-icon-box">
                <link.icon size={19} />
              </span>
              {expanded && <span className="sidebar-item-text">{link.name}</span>}
              {expanded && (
                <span className="sidebar-active-indicator" aria-hidden="true" />
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Branding / Status Area */}
        {expanded && (
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-badge">
              <Sparkles size={14} className="badge-sparkle" />
              <span>AgriTech v2.0</span>
            </div>
            <p className="sidebar-footer-text">
              Connected to meteorological &amp; agricultural models.
            </p>
          </div>
        )}
      </nav>

      {/* Floating Hamburger Button for Mobile screens */}
      {isMobile && !mobileOpen && (
        <button
          className="sidebar-mobile-toggle"
          aria-label="Open sidebar menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
      )}
    </>
  );
}
