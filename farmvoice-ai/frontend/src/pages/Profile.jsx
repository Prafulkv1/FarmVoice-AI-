import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  Sprout,
  Globe,
} from "lucide-react";

import { useAuth } from "../components/AuthProvider";
import { profileService } from "../services/profileService";
import { validateProfile } from "../utils/profileValidation";

import PersonalInformation from "../components/profile/PersonalInformation";
import LocationInformation from "../components/profile/LocationInformation";
import FarmingInformation from "../components/profile/FarmingInformation";
import LanguagePreferences from "../components/profile/LanguagePreferences";

import "../styles/dashboard.css";

const initialForm = {
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

const SECTIONS = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Manage your personal details",
    icon: User,
  },
  {
    id: "location",
    title: "Location Information",
    description: "Enter your farm location",
    icon: MapPin,
  },
  {
    id: "farming",
    title: "Farming Information",
    description: "Manage your farm details",
    icon: Sprout,
  },
  {
    id: "language",
    title: "Language Preferences",
    description: "Choose your preferred language",
    icon: Globe,
  },
];

const componentMap = {
  personal: PersonalInformation,
  location: LocationInformation,
  farming: FarmingInformation,
  language: LanguagePreferences,
};

const mapProfileToForm = (profile, user) => {
  return {
    ...initialForm,
    ...(profile || {}),

    full_name:
      profile?.full_name ||
      profile?.farmer_name ||
      user?.full_name ||
      user?.name ||
      user?.username ||
      "",

    email: profile?.email || user?.email || "",

    mobile_number:
      profile?.mobile_number ||
      user?.mobile_number ||
      user?.phone ||
      "",

    total_land_size:
      profile?.total_land_size != null
        ? String(profile.total_land_size)
        : "",

    farming_experience:
      profile?.farming_experience != null
        ? String(profile.farming_experience)
        : "",

    preferred_language:
      profile?.preferred_language || "English",

    notifications_enabled:
      profile?.notifications_enabled ?? true,

    main_crops: Array.isArray(profile?.main_crops)
      ? profile.main_crops
      : [],
  };
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, checking } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [activeSection, setActiveSection] = useState("personal");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setServerError("");

      const response = await profileService.getProfile();

      const profileData =
        response?.data?.profile ||
        response?.data?.farmer ||
        response?.data?.user ||
        response?.profile ||
        response?.farmer ||
        response?.data ||
        response;

      setForm(mapProfileToForm(profileData, user));
    } catch (error) {
      console.error("Profile fetching error:", error);

      if (error?.response?.status === 401) {
        navigate("/login");
        return;
      }

      setServerError(
        error?.response?.data?.message ||
          "Unable to load profile information."
      );

      setForm(mapProfileToForm(null, user));
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    if (checking) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [checking, isAuthenticated, navigate, fetchProfile]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => {
      if (!prev[key]) return prev;

      const updatedErrors = { ...prev };
      delete updatedErrors[key];
      return updatedErrors;
    });

    setSuccessMessage("");
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setServerError("");

    const validationErrors = validateProfile(form) || {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.keys(validationErrors)[0];

      const sectionMap = {
        full_name: "personal",
        mobile_number: "personal",
        state: "location",
        district: "location",
        taluk: "location",
        village: "location",
        pin_code: "location",
        total_land_size: "farming",
        soil_type: "farming",
        irrigation_type: "farming",
        farming_experience: "farming",
        main_crops: "farming",
        preferred_language: "language",
      };

      setActiveSection(sectionMap[firstError] || "personal");
      return;
    }

    try {
      setSaving(true);

      await profileService.saveProfile(form);

      setSuccessMessage("Profile updated successfully!");
      setErrors({});

      await fetchProfile();
    } catch (error) {
      console.error("Profile saving error:", error);

      setServerError(
        error?.response?.data?.message ||
          "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="profile-loading">
        <Loader2 size={32} className="spin" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader2 size={32} className="spin" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const ActiveComponent = componentMap[activeSection];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal details and farming information.</p>
        </div>
      </div>

      {successMessage && (
        <div className="profile-alert success">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div className="profile-alert error">
          <AlertCircle size={20} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-heading">
            <h3>Profile Settings</h3>
            <p>Update your information</p>
          </div>

          <nav className="profile-section-nav">
            {SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`profile-nav-item ${
                    activeSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={19} />

                  <div className="profile-nav-text">
                    <span>{section.title}</span>
                    <small>{section.description}</small>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="profile-content">
          <form onSubmit={handleSubmit}>
            {ActiveComponent && (
              <ActiveComponent
                value={form}
                onChange={handleChange}
                error={errors}
                email={form.email}
                user={user}
              />
            )}

            <div className="profile-form-actions">
              <button
                type="submit"
                className="btn-save-profile"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
