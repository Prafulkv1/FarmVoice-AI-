import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, User, Lock, AlertCircle } from "lucide-react";
import { authService } from "../services/authService";
import { validateLogin } from "../utils/validation";
import FormInput from "../components/FormInput";
import "../styles/login.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: vErrors, isValid } = validateLogin(form);
    setErrors(vErrors);
    setServerError("");
    if (!isValid) return;

    setLoading(true);
    try {
      await authService.login({
        username: form.username,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Generic message: never reveal whether username or password was wrong
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Login failed. Please try again.";
      setServerError(typeof msg === "string" ? msg : "Login failed. Please try again.");
      // Intentionally do NOT clear the username
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <div className="brand">
            <div className="brand-icon">
              <Sprout size={22} color="#D6A84B" />
            </div>
            <div className="brand-name">FarmVoice AI</div>
          </div>
          <h1 className="card-title">Farmer Login</h1>
          <p className="card-sub">Sign in to your farmer account</p>
        </div>

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
            showPassword
            onTogglePassword={() => setShowPassword((s) => !s)}
          />
          <div className="forgot-wrapper">
            <a href="#" className="forgot-link">
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="account-footer">
          New Farmer?{" "}
          <a href="/register" className="create-link">
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}
