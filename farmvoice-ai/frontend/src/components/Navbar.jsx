import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sprout, Home, User, Phone, Mail, LogOut, Menu, X } from "lucide-react";
import "../styles/navbar.css";

const links = [
  { name: "Home", to: "/", icon: <Home size={16} /> },
  { name: "About", to: "/about", icon: <User size={16} /> },
  { name: "Contact", to: "/contact", icon: <Mail size={16} /> },
  { name: "Register", to: "/register", icon: <User size={16} /> },
  { name: "Login", to: "/login", icon: <LogOut size={16} /> },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

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