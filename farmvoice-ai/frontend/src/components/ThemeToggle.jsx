import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle({ showLabel = false, className = "" }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? "theme-toggle-dark" : "theme-toggle-light"} ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} theme`}
      title={`Switch to ${isDark ? "Light" : "Dark"} theme`}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isDark ? (
            <Moon size={14} className="theme-toggle-icon icon-moon" />
          ) : (
            <Sun size={14} className="theme-toggle-icon icon-sun" />
          )}
        </span>
      </span>
      {showLabel && (
        <span className="theme-toggle-text">
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
      )}
    </button>
  );
}
