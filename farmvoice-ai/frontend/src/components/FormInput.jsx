import { useState } from "react";
import { User, Lock, Mail, Phone, Building2, Eye, EyeOff } from "lucide-react";
import "../styles/components.css";

const ICONS = {
  user: <User size={16} />,
  lock: <Lock size={16} />,
  mail: <Mail size={16} />,
  phone: <Phone size={16} />,
  farm: <Building2 size={16} />,
};

export default function FormInput({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  icon,
  showPassword = false,
  onTogglePassword,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password" && !show;
  const displayType = isPassword ? "password" : "text";

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrapper">
        {ICONS[icon] && <span className="input-icon">{ICONS[icon]}</span>}
        <input
          id={id}
          type={displayType}
          className={`form-input${error ? " error" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {icon === "lock" && showPassword && (
          <button
            type="button"
            className="toggle-password"
            onClick={onTogglePassword}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} className="toggle-icon" /> : <Eye size={16} className="toggle-icon" />}
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
