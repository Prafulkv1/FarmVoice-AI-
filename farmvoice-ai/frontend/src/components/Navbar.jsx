import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Sprout, Menu, X } from "lucide-react";
import "../styles/navbar.css";

const publicLinks = [
  { name: "Home", to: "/login" },
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setOpen(false)}>
          <div className="brand-icon">
            <Sprout size={20} color="#2E7D32" />
          </div>
          <div className="brand-name">FarmVoice AI</div>
        </div>

        <div className={`navbar-menu ${open ? "open" : ""}`}>
          {publicLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {link.name}
            </NavLink>
          ))}
          {location.pathname === "/login" ? (
            <NavLink
              to="/register"
              className="nav-link auth-link register-link"
              onClick={() => setOpen(false)}
            >
              Create Account
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className="nav-link auth-link login-link"
              onClick={() => setOpen(false)}
            >
              Login
            </NavLink>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}
