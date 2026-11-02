import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Mail, AlertCircle } from "lucide-react";
import { authService } from "../services/authService";
import { validateRegistration } from "../utils/validation";
import FormInput from "../components/FormInput";
import "../styles/register.css";

export default function Register() {
  const [form, setForm] = useState({
    farm_name: "",
    username: "",
    email: "",
    mobile_number: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setServerError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: vErrors, isValid } = validateRegistration(form);
    setErrors(vErrors);
    setServerError("");
    setMessage("");
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await authService.register({
        farm_name: form.farm_name,
        username: form.username,
        email: form.email,
        mobile_number: form.mobile_number,
        password: form.password,
        confirm_password: form.confirm_password,
      });
      if (res.data.success) {
        setMessage(res.data.message || "Registration successful!");
        setLoading(false);
        // Redirect to login after a short delay so the user can read the message
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      } else {
        setServerError(res.data.message || "Registration failed.");
        setLoading(false);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Registration failed. Please try again.";
      setServerError(typeof msg === "string" ? msg : "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-page">
      <div className="auth-split-left">
        <div className="auth-left-pattern" aria-hidden="true" />
        <div className="auth-left-content">
          <div className="auth-left-brand">
            <div className="auth-left-icon">
              <Sprout size={26} color="#FFFFFF" />
            </div>
            <span className="auth-left-name">FarmVoice AI</span>
          </div>
          <div className="auth-left-welcome">
            <h1 className="auth-left-heading">Join FarmVoice AI! 👋</h1>
            <p className="auth-left-desc">
              Create your account and explore intelligent farming assistance
              for better agricultural decisions.
            </p>
          </div>
          <div className="auth-left-footer">
            <span>© 2026 FarmVoice AI. All rights reserved.</span>
          </div>
        </div>
      </div>

      <div className="auth-split-right">
        <div className="auth-right-brand">
          <div className="auth-right-icon">
            <Sprout size={22} color="#3737D9" />
          </div>
          <span className="auth-right-name">FarmVoice AI</span>
        </div>

        <div className="auth-right-form auth-right-form-scroll">
          <h1 className="auth-right-title">Create Your Account</h1>
          <p className="auth-right-sub">
            Already have an account?{" "}
            <a href="/login" className="auth-right-link">
              Log in.
            </a>
          </p>

          {serverError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}
          {message && (
            <div className="alert alert-success">
              <Mail size={18} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
          <FormInput
            id="farm_name"
            label="Farm Name"
            placeholder="Enter your farm name"
            icon="farm"
            value={form.farm_name}
            onChange={handleChange("farm_name")}
            error={errors.farm_name}
          />
          <FormInput
            id="username"
            label="Farmer Username"
            placeholder="Create a username"
            icon="user"
            value={form.username}
            onChange={handleChange("username")}
            error={errors.username}
          />
          <FormInput
            id="email"
            label="Gmail Address"
            placeholder="Enter your email address"
            icon="mail"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          <FormInput
            id="mobile_number"
            label="Mobile Number"
            placeholder="Enter your 10-digit mobile number"
            icon="phone"
            type="tel"
            value={form.mobile_number}
            onChange={handleChange("mobile_number")}
            error={errors.mobile_number}
            maxLength={10}
          />
          <FormInput
            id="password"
            label="Password"
            placeholder="Create a password"
            icon="lock"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            error={errors.password}
            showPassword
            onTogglePassword={() => setShowPassword((s) => !s)}
          />
          <FormInput
            id="confirm_password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            icon="lock"
            type="password"
            value={form.confirm_password}
            onChange={handleChange("confirm_password")}
            error={errors.confirm_password}
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((s) => !s)}
          />

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <a href="/login" className="auth-switch-link">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
