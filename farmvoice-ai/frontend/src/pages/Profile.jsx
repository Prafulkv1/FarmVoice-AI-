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
  ListChecks,
  Eye,
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
import ProfileReview from "../components/profile/ProfileReview";
import ProfileSuccess from "../components/profile/ProfileSuccess";

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
  land_unit: "Acres",
  soil_type: "",
  irrigation_type: "",
  farming_experience: "",
  preferred_language: "",
  notifications_enabled: null,
  main_crops: [],
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, checking, updateUser } = useAuth();

  const [savedProfile, setSavedProfile] = useState(defaultFormState);
  const [form, setForm] = useState(defaultFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [showMissingList, setShowMissingList] = useState(false);

  // Review before saving modal state
  const [showReview, setShowReview] = useState(false);

  // Success confirmation screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Real-time profile completion percentage
  const currentFormForScore = isEditing ? form : savedProfile;
  const completion = useMemo(() => {
    return calculateCompletion(currentFormForScore);
  }, [currentFormForScore]);

  // Extract avatar initials
  const initials = useMemo(() => {
    const name = (
      form.full_name ||
      user?.farm_name ||
      user?.full_name ||
      user?.username ||
      "Farmer"
    ).trim();
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
        // Existing profile retrieved from MySQL
        const p = data.profile;
        const normalized = {
          farmer_id: p.user_id || data.farmer?.farmer_id || user?.farmer_id,
          user_id: p.user_id || data.farmer?.farmer_id || user?.farmer_id,
          full_name: p.full_name || data.farmer?.farm_name || "",
          email: p.email || data.farmer?.email || "",
          mobile_number: p.mobile_number || data.farmer?.mobile_number || "",
          state: p.state || "",
          district: p.district || "",
          taluk: p.taluk || "",
          village: p.village || "",
          pin_code: p.pin_code || "",
          total_land_size:
            p.total_land_size !== null && p.total_land_size !== undefined
              ? String(p.total_land_size)
              : "",
          land_unit: p.land_unit || "Acres",
          soil_type: p.soil_type || "",
          irrigation_type: p.irrigation_type || "",
          farming_experience:
            p.farming_experience !== null && p.farming_experience !== undefined
              ? String(p.farming_experience)
              : "",
          preferred_language: p.preferred_language || "",
          notifications_enabled:
            typeof p.notifications_enabled === "boolean"
              ? p.notifications_enabled
              : null,
          main_crops: Array.isArray(p.main_crops) ? p.main_crops : [],
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
        setSavedProfile(normalized);
        setForm(normalized);
        setIsNewProfile(false);
        setIsEditing(false);
        setLastSavedAt(p.updated_at || p.created_at || null);
      } else {
        // No profile exists yet - populate ONLY real registered credentials
        const regFarmer = data?.farmer || user || {};
        const initial = {
          farmer_id: regFarmer.farmer_id || regFarmer.user_id || "",
          user_id: regFarmer.farmer_id || regFarmer.user_id || "",
          full_name: regFarmer.farm_name || regFarmer.full_name || "",
          email: regFarmer.email || data?.email || "",
          mobile_number: regFarmer.mobile_number || "",
          state: "",
          district: "",
          taluk: "",
          village: "",
          pin_code: "",
          total_land_size: "",
          land_unit: "Acres",
          soil_type: "",
          irrigation_type: "",
          farming_experience: "",
          preferred_language: "",
          notifications_enabled: null,
          main_crops: [],
        };
        setSavedProfile(initial);
        setForm(initial);
        setIsNewProfile(true);
        setIsEditing(false);
        setLastSavedAt(null);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setServerError(
          "Access denied. You do not have permission to view this profile."
        );
        return;
      }
      if (err.response?.status === 500) {
        setServerError(
          "Server encountered an error while loading your profile. Please retry."
        );
        return;
      }
      if (!err.response) {
        setServerError(
          "Unable to connect to the FarmVoice AI server. Please check backend connection."
        );
        return;
      }
      setServerError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

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
    setShowSuccess(false);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
  };

  const handleCancelEdit = () => {
    setForm(savedProfile);
    setErrors({});
    setSuccessMessage("");
    setServerError("");
    setIsEditing(false);
    setShowSuccess(false);
  };

  // Step 1: Pre-validation & opening the Review Confirmation Modal
  const handleOpenReview = (e) => {
    if (e) e.preventDefault();
    setSuccessMessage("");
    setServerError("");

    // Validate using the strict 15-field validation rules
    const valErrors = validateProfile(form);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      setServerError(
        "Please correct the highlighted fields before reviewing your profile."
      );
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    // Clear any previous error and open the review screen
    setErrors({});
    setShowReview(true);
  };

  // Step 2: Return from review modal back to editing
  const handleEditFromReview = () => {
    setShowReview(false);
  };

  // Step 3: Cancel from review modal without saving
  const handleCancelReview = () => {
    setShowReview(false);
  };

  // Step 4: Confirm and submit to MySQL via Flask backend
  const handleConfirmAndSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setServerError("");

      // Choose POST for initial creation, PUT for updating
      const res = isNewProfile
        ? await profileService.createProfile(form)
        : await profileService.updateProfile(form);

      if (res.data?.success) {
        const saved = res.data.profile;
        const normalized = {
          farmer_id: saved.user_id || form.farmer_id,
          user_id: saved.user_id || form.user_id,
          full_name: saved.full_name || form.full_name,
          email: saved.email || form.email,
          mobile_number: saved.mobile_number || form.mobile_number,
          state: saved.state || "",
          district: saved.district || "",
          taluk: saved.taluk || "",
          village: saved.village || "",
          pin_code: saved.pin_code || "",
          total_land_size:
            saved.total_land_size !== null &&
            saved.total_land_size !== undefined
              ? String(saved.total_land_size)
              : "",
          land_unit: saved.land_unit || form.land_unit || "Acres",
          soil_type: saved.soil_type || "",
          irrigation_type: saved.irrigation_type || "",
          farming_experience:
            saved.farming_experience !== null &&
            saved.farming_experience !== undefined
              ? String(saved.farming_experience)
              : "",
          preferred_language: saved.preferred_language || "",
          notifications_enabled:
            typeof saved.notifications_enabled === "boolean"
              ? saved.notifications_enabled
              : null,
          main_crops: Array.isArray(saved.main_crops) ? saved.main_crops : [],
          created_at: saved.created_at,
          updated_at: saved.updated_at,
        };

        setSavedProfile(normalized);
        setForm(normalized);
        setIsEditing(false);
        setIsNewProfile(false);
        setErrors({});
        setShowReview(false);
        setShowSuccess(true);
        setLastSavedAt(
          saved.updated_at || saved.created_at || new Date().toISOString()
        );
        setSuccessMessage(
          res.data.message || "Your farmer profile has been saved successfully!"
        );

        // Synchronize in-memory auth context so top nav and headers reflect updated farmer info
        if (updateUser && res.data.farmer) {
          updateUser(res.data.farmer);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setShowReview(false); // Close modal so user sees error and form fields

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
          err.response?.data?.message ||
            "Validation failed. Please review your details and correct any errors."
        );
      } else if (err.response?.status === 409) {
        setServerError(
          "Profile record already exists. Switched to update mode."
        );
        setIsNewProfile(false);
      } else if (err.response?.status === 500) {
        setServerError(
          "Database error occurred while saving your profile. Please check MySQL server and try again."
        );
      } else if (!err.response) {
        setServerError(
          "Network error: unable to reach the server. Please check your backend connection."
        );
      } else {
        setServerError(
          err.response?.data?.message || "Failed to save profile."
        );
      }
      window.scrollTo({ top: 120, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleViewProfileFromSuccess = () => {
    setShowSuccess(false);
    setIsEditing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditProfileFromSuccess = () => {
    setShowSuccess(false);
    setIsEditing(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

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
  const activeFarmerId =
    form.farmer_id || form.user_id || user?.farmer_id || "N/A";

  return (
    <div className="profile-container">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-hero-main">
            <div className="profile-hero-avatar">{initials}</div>
            <div className="profile-hero-details">
              <div className="hero-name-row">
                <h1>{farmerDisplayName}</h1>
                <span className="hero-farmer-id">ID: #{activeFarmerId}</span>
              </div>
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
              <div className="completion-subtext">
                <span>
                  {completion.isComplete
                    ? "Profile is 100% complete!"
                    : `${completion.completedCount} of ${completion.totalFields} completed`}
                </span>
                {!completion.isComplete && (
                  <span
                    className="completion-count-badge"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowMissingList(!showMissingList)}
                    title="Click to toggle missing fields list"
                  >
                    <ListChecks size={12} />
                    {completion.remainingCount} pending
                  </span>
                )}
              </div>

              {!completion.isComplete && showMissingList && (
                <div className="missing-fields-box">
                  <div className="missing-fields-title">
                    <ListChecks size={12} />
                    <span>Pending fields to reach 100%:</span>
                  </div>
                  <div className="missing-pills-wrap">
                    {completion.missingFields.map((field) => (
                      <span key={field} className="missing-pill">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-hero-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="btn-hero-edit"
                  onClick={handleStartEdit}
                >
                  <Edit3 size={17} />
                  <span>{isNewProfile ? "Complete Profile" : "Edit Profile"}</span>
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
                    onClick={handleOpenReview}
                    disabled={saving}
                  >
                    <Save size={17} />
                    <span>{isNewProfile ? "Save Profile" : "Save Changes"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert Banners */}
      {successMessage && !showSuccess && (
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

      {/* Save Confirmation Screen (Section 5) */}
      {showSuccess && (
        <ProfileSuccess
          profile={savedProfile}
          farmer={user}
          completion={completion}
          lastSavedAt={lastSavedAt}
          onViewProfile={handleViewProfileFromSuccess}
          onEditProfile={handleEditProfileFromSuccess}
        />
      )}

      {/* Empty Profile State for Newly Registered Farmers */}
      {isNewProfile && !isEditing && !showSuccess && (
        <div className="welcome-empty-banner">
          <div className="welcome-icon-bubble">
            <Sprout size={32} />
          </div>
          <h2>Welcome to FarmVoice AI, {farmerDisplayName}!</h2>
          <p>
            You haven&apos;t set up your farming details yet. Completing your profile
            enables customized AI voice assistance in your native language,
            accurate weather updates for your village, and tailored crop
            management advice.
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

      {/* Profile Sections (Form / View) - rendered when not showing success screen */}
      {!showSuccess && (
        <form onSubmit={handleOpenReview} noValidate>
          <div className="profile-sections-wrapper">
            {/* Section A: Personal Information */}
            <PersonalInformation
              form={isEditing ? form : savedProfile}
              onChange={handleFieldChange}
              errors={errors}
              isEditing={isEditing}
              farmerId={activeFarmerId}
            />

            {/* Section B: Location Information */}
            <LocationInformation
              form={isEditing ? form : savedProfile}
              onChange={handleFieldChange}
              errors={errors}
              isEditing={isEditing}
            />

            {/* Section C: Farming Information */}
            <FarmingInformation
              form={isEditing ? form : savedProfile}
              onChange={handleFieldChange}
              errors={errors}
              isEditing={isEditing}
            />

            {/* Section D: Language & Notification Preferences */}
            <LanguagePreferences
              form={isEditing ? form : savedProfile}
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
                  <Save size={18} />
                  <span>{isNewProfile ? "Save Profile" : "Save Changes"}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Review Confirmation Modal (Section 4) */}
      {showReview && (
        <ProfileReview
          form={form}
          farmerId={activeFarmerId}
          onConfirm={handleConfirmAndSave}
          onEdit={handleEditFromReview}
          onCancel={handleCancelReview}
          saving={saving}
          isNew={isNewProfile}
        />
      )}
    </div>
  );
}
