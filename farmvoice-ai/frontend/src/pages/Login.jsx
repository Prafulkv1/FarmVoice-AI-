import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, AlertCircle } from "lucide-react";
import { authService } from "../services/authService";
import { validateLogin } from "../utils/validation";
import FormInput from "../components/FormInput";
import { useAuth } from "../components/AuthProvider";
import "../styles/login.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: setAuth, isAuthenticated } = useAuth();

  // If the user already has a valid session, send them straight to the dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: vErrors, isValid } = validateLogin(form);
    setErrors(vErrors);
    setServerError("");
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await authService.login({
        username: form.username,
        password: form.password,
      });

      if (res.data && res.data.success) {
        // Establish local authentication state immediately so protected
        // routes work without requiring a manual page refresh.
        if (res.data.farmer) {
          setAuth(res.data.farmer);
        } else {
          setAuth({
            farmer_id: res.data.farmer_id,
            username: form.username,
            authenticated: true,
          });
        }
        navigate("/dashboard", { replace: true });
      } else {
        setServerError(res.data?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      // Backend unavailable or network error
      if (!err.response) {
        setServerError(
          "Unable to connect to the server. Please try again later.",
        );
      } else {
        // Generic message: never reveal whether username or password was wrong
        const msg =
          err.response.data?.message ||
          err.response.data?.errors ||
          "Login failed. Please try again.";
        setServerError(
          typeof msg === "string" ? msg : "Login failed. Please try again.",
        );
      }
      // Intentionally do NOT clear the username
    } finally {
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
            <h1 className="auth-left-heading">Hello, FarmVoice AI! 👋</h1>
            <p className="auth-left-desc">
              Your smart farming companion. Get personalized agricultural
              guidance, regional-language AI assistance, and smarter farming
              insights.
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

        <div className="auth-right-form">
          <h1 className="auth-right-title">Welcome Back!</h1>
          <p className="auth-right-sub">
            Don&rsquo;t have an account?{" "}
            <a href="/register" className="auth-right-link">
              Create a new account now.
            </a>
          </p>

          {serverError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              id="username"
              label="Username"
              placeholder="Enter your username"
              icon="user"
              value={form.username}
              onChange={handleChange("username")}
              error={errors.username}
            />
            <FormInput
              id="password"
              label="Password"
              placeholder="Enter your password"
              icon="lock"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((s) => !s)}
            />
            <div className="auth-forgot">
              <a href="#" className="auth-forgot-link">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="auth-switch">
            New Farmer?{" "}
            <a href="/register" className="auth-switch-link">
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
