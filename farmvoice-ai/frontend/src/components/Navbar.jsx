import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sprout, Menu, X, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";
import "../styles/navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId, path = "/") => {
    setOpen(false);
    if (sectionId) {
      if (location.pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      navigate(`${path}#${sectionId}`);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <div className="brand-leaf-badge">
            <Sprout size={22} className="brand-leaf-icon" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">
              FarmVoice <span className="brand-accent">AI</span>
            </span>
            <span className="brand-tagline">Smart AgriTech</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive && !location.hash ? "active" : ""}`
            }
            onClick={() => handleNavClick("hero")}
          >
            Home
          </NavLink>
          <a
            href="#features"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("features");
            }}
          >
            Features
          </a>
          <a
            href="#about"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("about");
            }}
          >
            About
          </a>
          <a
            href="#how-it-works"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("how-it-works");
            }}
          >
            How It Works
          </a>
          <a
            href="#contact"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("contact");
            }}
          >
            Contact
          </a>
        </div>

        {/* Right Actions: Theme Toggle + Auth buttons */}
        <div className="navbar-actions">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-nav-primary">
              <UserCheck size={16} />
              <span>Dashboard</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <div className="navbar-auth-group">
              <Link to="/login" className="btn-nav-ghost">
                Login
              </Link>
              <Link to="/register" className="btn-nav-primary">
                <span>Register</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            className="navbar-mobile-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-links">
            <Link
              to="/"
              className="mobile-link"
              onClick={() => {
                setOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home
            </Link>
            <a
              href="#features"
              className="mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("features");
              }}
            >
              Features
            </a>
            <a
              href="#about"
              className="mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("about");
              }}
            >
              About
            </a>
            <a
              href="#how-it-works"
              className="mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("how-it-works");
              }}
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("contact");
              }}
            >
              Contact
            </a>
          </div>

          <div className="mobile-drawer-footer">
            <div className="mobile-theme-row">
              <span className="mobile-theme-label">Theme Mode</span>
              <ThemeToggle showLabel={true} />
            </div>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-nav-primary mobile-full-btn"
                onClick={() => setOpen(false)}
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="mobile-auth-stack">
                <Link
                  to="/login"
                  className="btn-nav-ghost mobile-full-btn"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-nav-primary mobile-full-btn"
                  onClick={() => setOpen(false)}
                >
                  Register as Farmer
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
