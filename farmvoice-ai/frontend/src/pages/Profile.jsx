import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sprout,
  Mail,
  ChevronRight,
  Info,
} from "lucide-react";

import { useAuth } from "../components/AuthProvider";
import { profileService } from "../services/profileService";
import {
  validateProfile,
  calculateCompletion,
} from "../utils/profileValidation";

import PersonalInformation from "../components/profile/PersonalInformation";
import LocationInformation from "../components/profile/LocationInformation";
import FarmingInformation from "../components/profile/FarmingInformation";
import LanguagePreferences from "../components/profile/LanguagePreferences";

import "../styles/profile.css";

const defaultFormState = {
  full_name: "",
  email: "",
  mobile_number: "",
  state: "",
  district: "",
  taluk: "",
  village: "",
  pin_code: "",
  total_land_size: "",
  soil_type: "",
  irrigation_type: "",
  farming_experience: "",
  preferred_language: "English",
  notifications_enabled: true,
  main_crops: [],
};

export default function Profile() {
  const navigate = useNavigate();

  const { user, isAuthenticated, checking } = useAuth();

  const [form, setForm] = useState(defaultFormState);
  const [originalForm, setOriginalForm] = useState(defaultFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  // Calculate dynamic profile completion percentage
  const completion = useMemo(() => {
    return calculateCompletion(form);
  }, [form]);

  // Extract avatar initials
  const initials = useMemo(() => {
    const name = (form.full_name || user?.farm_name || user?.username || "Farmer").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "FA";
  }, [form.full_name, user]);

  // Fetch farmer profile from MySQL backend
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setServerError("");
      const res = await profileService.getProfile();
      const data = res.data;

      if (data && data.profile) {
        // Existing profile retrieved
        const p = data.profile;
        const normalized = {
          full_name: p.full_name || user?.farm_name || user?.username || "",
          email: p.email || data.email || user?.email || "",
          mobile_number: p.mobile_number || user?.mobile_number || "",
          state: p.state || "",
          district: p.district || "",
          taluk: p.taluk || "",
          village: p.village || "",
          pin_code: p.pin_code || "",
          total_land_size:
            p.total_land_size !== null && p.total_land_size !== undefined
              ? String(p.total_land_size)
              : "",
          soil_type: p.soil_type || "",
          irrigation_type: p.irrigation_type || "",
          farming_experience:
            p.farming_experience !== null && p.farming_experience !== undefined
              ? String(p.farming_experience)
              : "",
          preferred_language: p.preferred_language || "English",
          notifications_enabled: p.notifications_enabled !== false,
          main_crops: Array.isArray(p.main_crops) ? p.main_crops : [],
        };
        setForm(normalized);
        setOriginalForm(normalized);
        setIsNewProfile(false);
      } else {
        // No profile created yet for this farmer account
        const initial = {
          ...defaultFormState,
          full_name: user?.farm_name || user?.username || "",
          email: user?.email || data?.email || "",
          mobile_number: user?.mobile_number || "",
        };
        setForm(initial);
        setOriginalForm(initial);
        setIsNewProfile(true);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setServerError("Access denied. You do not have permission to view this profile.");
        return;
      }
      if (err.response?.status === 500) {
        setServerError("Server encountered an error while loading your profile. Please retry.");
        return;
      }
      if (!err.response) {
        setServerError("Unable to connect to the FarmVoice AI server. Please check backend connection.");
        return;
      }
      setServerError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  // Authentication and initial profile loading
  useEffect(() => {
    if (!checking) {
      if (!isAuthenticated) {
        navigate("/login");
      } else {
        loadProfile();
      }
    }
  }, [checking, isAuthenticated, navigate, loadProfile]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    setSuccessMessage("");
    setServerError("");
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
  };

  const handleCancelEdit = () => {
    setForm(originalForm);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
    setIsEditing(false);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    setSuccessMessage("");
    setServerError("");

    // Frontend validation
    const valErrors = validateProfile(form);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      setServerError("Please correct the highlighted fields before saving your profile.");
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);
      const res = await profileService.saveProfile(form);

      if (res.data?.success) {
        const saved = res.data.profile;
        const normalized = {
          full_name: saved.full_name || form.full_name,
          email: saved.email || form.email,
          mobile_number: saved.mobile_number || form.mobile_number,
          state: saved.state || "",
          district: saved.district || "",
          taluk: saved.taluk || "",
          village: saved.village || "",
          pin_code: saved.pin_code || "",
          total_land_size:
            saved.total_land_size !== null && saved.total_land_size !== undefined
              ? String(saved.total_land_size)
              : "",
          soil_type: saved.soil_type || "",
          irrigation_type: saved.irrigation_type || "",
          farming_experience:
            saved.farming_experience !== null && saved.farming_experience !== undefined
              ? String(saved.farming_experience)
              : "",
          preferred_language: saved.preferred_language || "English",
          notifications_enabled: saved.notifications_enabled !== false,
          main_crops: Array.isArray(saved.main_crops) ? saved.main_crops : [],
        };

        setForm(normalized);
        setOriginalForm(normalized);
        setIsEditing(false);
        setIsNewProfile(false);
        setErrors({});
        setSuccessMessage(res.data.message || "Profile saved successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Save profile error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 400 || err.response?.status === 422) {
        const beErrors = err.response?.data?.errors;
        if (beErrors && typeof beErrors === "object") {
          setErrors(beErrors);
        }
        setServerError(
          err.response?.data?.message || "Validation failed. Please review your details."
        );
      } else if (err.response?.status === 500) {
        setServerError("Server error occurred while saving profile. Please try again.");
      } else if (!err.response) {
        setServerError("Network error: unable to reach the server. Please check backend connection.");
      } else {
        setServerError(err.response?.data?.message || "Failed to save profile.");
      }
      window.scrollTo({ top: 120, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // Authentication loading
  if (checking || loading) {
    return (
      <div className="profile-container">
        <div className="profile-state-screen">
          <Loader2 size={36} className="spin" />
          <h3>Loading Farmer Profile</h3>
          <p>Connecting to FarmVoice AI database...</p>
        </div>
      </div>
    );
  }

  const farmerDisplayName =
    form.full_name || user?.farm_name || user?.username || "Farmer";

  // Profile loading
  return (
    <div className="profile-container">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-hero-main">
            <div className="profile-hero-avatar">{initials}</div>
            <div className="profile-hero-details">
              <h1>{farmerDisplayName}</h1>
              <p className="profile-hero-email">
                <Mail size={15} />
                <span>{form.email || user?.email || "No email available"}</span>
              </p>
            </div>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-hero-completion">
              <div className="completion-label-row">
                <span>Profile Completion</span>
                <span className="completion-percentage-text">
                  {completion.percentage}%
                </span>
              </div>
              <div className="completion-progress-track">
                <div
                  className="completion-progress-fill"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
              <p className="completion-subtext">
                {completion.isComplete
                  ? "All required profile sections are complete!"
                  : `${completion.missing.length} required field(s) pending`}
              </p>
            </div>

            <div className="profile-hero-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="btn-hero-edit"
                  onClick={handleStartEdit}
                >
                  <Edit3 size={17} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-hero-cancel"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X size={17} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    className="btn-hero-save"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={17} className="spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert Banners */}
      {successMessage && (
        <div className="profile-alert success">
          <CheckCircle2 size={20} className="profile-alert-icon" />
          <div className="profile-alert-content">
            <strong>Success!</strong>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className="profile-alert-close"
            onClick={() => setSuccessMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {serverError && (
        <div className="profile-alert error">
          <AlertCircle size={20} className="profile-alert-icon" />
          <div className="profile-alert-content">
            <strong>Action Needed</strong>
            <span>{serverError}</span>
          </div>
          <button
            type="button"
            className="profile-alert-close"
            onClick={() => setServerError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Empty Profile State for Newly Registered Farmers */}
      {isNewProfile && !isEditing && (
        <div className="welcome-empty-banner">
          <div className="welcome-icon-bubble">
            <Sprout size={32} />
          </div>
          <h2>Welcome to FarmVoice AI, {farmerDisplayName}!</h2>
          <p>
            You haven't set up your farming details yet. Completing your profile
            enables customized AI voice assistance in your native language, accurate
            weather updates for your village, and tailored crop management advice.
          </p>
          <button
            type="button"
            className="btn-start-profile"
            onClick={handleStartEdit}
          >
            <span>Complete Your Profile Now</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Profile Form / Sections */}
      <form onSubmit={handleSaveProfile} noValidate>
        <div className="profile-sections-wrapper">
          {/* Section A: Personal Information */}
          <PersonalInformation
            form={form}
            onChange={handleFieldChange}
            errors={errors}
            isEditing={isEditing}
          />

          {/* Section B: Location Information */}
          <LocationInformation
            form={form}
            onChange={handleFieldChange}
            errors={errors}
            isEditing={isEditing}
          />

          {/* Section C: Farming Information */}
          <FarmingInformation
            form={form}
            onChange={handleFieldChange}
            errors={errors}
            isEditing={isEditing}
          />

          {/* Section D: Language & Notification Preferences */}
          <LanguagePreferences
            form={form}
            onChange={handleFieldChange}
            errors={errors}
            isEditing={isEditing}
          />

          {/* Bottom Action Bar in Edit Mode */}
          {isEditing && (
            <div className="profile-bottom-actions">
              <button
                type="button"
                className="btn-bottom-cancel"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="btn-bottom-save"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
