import {
  CheckCircle2,
  Calendar,
  Clock,
  Eye,
  Edit3,
  User,
  MapPin,
  Sprout,
  Globe,
  Bell,
  BellOff,
  Hash,
  Award,
} from "lucide-react";

export default function ProfileSuccess({
  profile,
  farmer,
  completion,
  lastSavedAt,
  onViewProfile,
  onEditProfile,
}) {
  const displayFarmerId =
    profile?.farmer_id || profile?.user_id || farmer?.farmer_id || "N/A";
  const crops = Array.isArray(profile?.main_crops) ? profile.main_crops : [];
  const landUnit = profile?.land_unit || "Acres";

  const formattedTimestamp = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const completionPct =
    completion?.completion_percentage ?? completion?.percentage ?? 100;

  return (
    <div className="profile-success-card">
      <div className="success-banner-top">
        <div className="success-icon-badge">
          <CheckCircle2 size={42} />
        </div>
        <div className="success-header-text">
          <span className="success-badge-pill">
            <CheckCircle2 size={13} /> Saved in MySQL Database
          </span>
          <h2>Your farmer profile has been saved successfully!</h2>
          <p className="success-timestamp">
            <Clock size={14} />
            <span>Last updated on: {formattedTimestamp}</span>
          </p>
        </div>
      </div>

      {/* Profile Completion Highlight */}
      <div className="success-completion-box">
        <div className="success-completion-header">
          <div className="completion-title-group">
            <Award size={20} className="award-icon" />
            <div>
              <span className="completion-card-label">Profile Completion Status</span>
              <h4>
                {completionPct === 100
                  ? "Your profile is 100% complete!"
                  : `${completionPct}% Complete`}
              </h4>
            </div>
          </div>
          <span className="completion-pct-chip">{completionPct}%</span>
        </div>

        <div className="success-progress-track">
          <div
            className="success-progress-fill"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        <p className="completion-card-subtext">
          {completionPct === 100
            ? "All farming and location parameters are fully recorded. AI advisories and weather forecasts are completely personalized for your farm."
            : "Your profile has been safely saved. You can complete the remaining details anytime to unlock fully tailored AI recommendations."}
        </p>
      </div>

      {/* Updated Information Summary */}
      <div className="success-summary-wrapper">
        <h3 className="summary-main-heading">Summary of Saved Information</h3>

        <div className="summary-cards-grid">
          {/* Personal */}
          <div className="summary-subcard">
            <div className="summary-subcard-title">
              <User size={16} />
              <span>Personal Information</span>
            </div>
            <div className="summary-rows">
              <div className="summary-row">
                <span className="s-label">Farmer ID:</span>
                <span className="s-val">
                  <Hash size={11} className="inline-icon" />
                  {displayFarmerId}
                </span>
              </div>
              <div className="summary-row">
                <span className="s-label">Full Name:</span>
                <span className="s-val">{profile?.full_name || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Email:</span>
                <span className="s-val">{profile?.email || farmer?.email || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Mobile:</span>
                <span className="s-val">{profile?.mobile_number || "—"}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="summary-subcard">
            <div className="summary-subcard-title">
              <MapPin size={16} />
              <span>Location Information</span>
            </div>
            <div className="summary-rows">
              <div className="summary-row">
                <span className="s-label">Village:</span>
                <span className="s-val">{profile?.village || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Taluk:</span>
                <span className="s-val">{profile?.taluk || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">District:</span>
                <span className="s-val">{profile?.district || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">State &amp; PIN:</span>
                <span className="s-val">
                  {profile?.state ? `${profile.state} - ${profile?.pin_code || ""}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Farming */}
          <div className="summary-subcard">
            <div className="summary-subcard-title">
              <Sprout size={16} />
              <span>Farming Information</span>
            </div>
            <div className="summary-rows">
              <div className="summary-row">
                <span className="s-label">Total Land:</span>
                <span className="s-val">
                  {profile?.total_land_size
                    ? `${profile.total_land_size} ${landUnit}`
                    : "—"}
                </span>
              </div>
              <div className="summary-row">
                <span className="s-label">Soil Type:</span>
                <span className="s-val">{profile?.soil_type || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Irrigation:</span>
                <span className="s-val">{profile?.irrigation_type || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Experience:</span>
                <span className="s-val">
                  {profile?.farming_experience !== null &&
                  profile?.farming_experience !== undefined &&
                  profile?.farming_experience !== ""
                    ? `${profile.farming_experience} years`
                    : "—"}
                </span>
              </div>
              <div className="summary-row">
                <span className="s-label">Crops:</span>
                <span className="s-val">
                  {crops.length > 0 ? crops.join(", ") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="summary-subcard">
            <div className="summary-subcard-title">
              <Globe size={16} />
              <span>Preferences</span>
            </div>
            <div className="summary-rows">
              <div className="summary-row">
                <span className="s-label">Language:</span>
                <span className="s-val">{profile?.preferred_language || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Alerts:</span>
                <span className="s-val">
                  {profile?.notifications_enabled ? (
                    <span className="badge badge-success">
                      <Bell size={11} /> Enabled
                    </span>
                  ) : (
                    <span className="badge badge-secondary">
                      <BellOff size={11} /> Disabled
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: View Profile and Edit Profile */}
      <div className="success-actions-footer">
        <button
          type="button"
          className="btn-success-view"
          onClick={onViewProfile}
        >
          <Eye size={17} />
          <span>View Profile</span>
        </button>

        <button
          type="button"
          className="btn-success-edit"
          onClick={onEditProfile}
        >
          <Edit3 size={17} />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
}
