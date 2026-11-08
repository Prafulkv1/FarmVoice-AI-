import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { profileService } from "../services/profileService";
import { validateProfile } from "../utils/profileValidation";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  Globe,
} from "lucide-react";
import PersonalInformation from "../components/profile/PersonalInformation";
import LocationInformation from "../components/profile/LocationInformation";
import FarmingInformation from "../components/profile/FarmingInformation";
import LanguagePreferences from "../components/profile/LanguagePreferences";
import "../styles/dashboard.css";

const initialForm = {
  full_name: "",
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
    key: "personal",
    title: "Personal Information",
    Icon: User,
    desc: "Your name, email and mobile number.",
  },
  {
    key: "location",
    title: "Location Information",
    Icon: MapPin,
    desc: "State, district, taluk, village and PIN code.",
  },
  {
    key: "farming",
    title: "Farming Information",
    Icon: Sprout,
    desc: "Land size, soil type, irrigation and main crops.",
  },
  {
    key: "preferences",
    title: "Language & Notifications",
    Icon: Globe,
    desc: "Preferred language and notification settings.",
  },
];

function mapProfileToForm(profile, registration = {}) {
  return {
    full_name: (profile && profile.full_name) || registration.farm_name || "",
    mobile_number: (profile && profile.mobile_number) || registration.mobile_number || "",
    state: profile.state || "",
    district: profile.district || "",
    taluk: profile.taluk || "",
    village: profile.village || "",
    pin_code: profile.pin_code || "",
    total_land_size:
      profile.total_land_size != null ? String(profile.total_land_size) : "",
    soil_type: profile.soil_type || "",
    irrigation_type: profile.irrigation_type || "",
    farming_experience:
      profile.farming_experience != null
        ? String(profile.farming_experience)
        : "",
    preferred_language: profile.preferred_language || "English",
    notifications_enabled: profile.notifications_enabled ?? true,
    main_crops: Array.isArray(profile.main_crops)
      ? [...profile.main_crops]
      : [],
  };
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user ? Number(user.farmer_id) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.username || "");

  // Registration details from the authenticated account (never re-entered by the farmer).
  const registration = {
    farm_name: user?.farm_name || "",
    username: user?.username || "",
    email: user?.email || "",
    mobile_number: user?.mobile_number || "",
  };
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const fetchProfile = async () => {
    setLoading(true);
    setServerError("");
    try {
      const res = await profileService.getProfile();
      const data = res.data;
      if (data && data.profile) {
        setProfileExists(true);
        setForm(mapProfileToForm(data.profile, registration));
      } else {
        setProfileExists(false);
        setForm({
          ...initialForm,
          full_name: registration.farm_name,
          mobile_number: registration.mobile_number,
          preferred_language: "English",
          notifications_enabled: true,
        });
      }
      // Use the authoritative registration details from the backend when available.
      if (data && data.farmer) {
        setUsername(data.farmer.username || registration.username);
        setEmail(data.farmer.email || registration.email);
      } else {
        setUsername(registration.username);
        setEmail(registration.email);
      }
      if (data && data.email) setEmail(data.email);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setServerError(
        err.response?.data?.message ||
          "Unable to load your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const { errors: validationErrors, isValid } = validateProfile(form);
    setErrors(validationErrors);
    if (!isValid) return;

    setSaving(true);
    try {
      const res = await profileService.saveProfile(form);
      const data = res.data;
      if (data.success) {
        setProfileExists(true);
        setSuccessMessage(data.message || "Profile saved successfully.");
        if (data.profile) {
          setForm(mapProfileToForm(data.profile, registration));
          if (data.profile.email) setEmail(data.profile.email);
        }
        setErrors({});
        setTimeout(() => setSuccessMessage(""), 6000);
      } else {
        setServerError(data.message || "Failed to save profile.");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setServerError(err.response.data?.message || "Failed to save profile.");
        if (err.response.data?.errors) {
          setErrors(err.response.data.errors);
        }
      } else {
        setServerError(
          "Unable to connect to the server. Please try again later.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Manage your farmer profile information.</p>
        </div>
        <div className="profile-loading">
          <Loader2 size={24} /> Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">
          Complete and update your farming information. This helps FarmVoice AI
          personalize guidance for your region and farm.
        </p>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} /> {serverError}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {SECTIONS.map((section) => {
          const componentMap = {
            personal: PersonalInformation,
            location: LocationInformation,
            farming: FarmingInformation,
            preferences: LanguagePreferences,
          };
          const Component = componentMap[section.key];
          return (
            <Component
              key={section.key}
              value={form}
              onChange={handleChange}
              error={errors}
              email={section.key === "personal" ? email : undefined}
              username={section.key === "personal" ? username : undefined}
              farmerName={section.key === "personal" ? registration.farm_name : undefined}
            />
          );
        })}

        <div className="profile-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Save size={16} className="btn-icon" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} className="btn-icon" />
                {profileExists ? "Update Profile" : "Save Profile"}
              </>
            )}
          </button>
          <p className="actions-hint">
            Your information is stored securely in MySQL and linked to your
            registered account.
          </p>
        </div>
      </form>
    </div>
  );
}

