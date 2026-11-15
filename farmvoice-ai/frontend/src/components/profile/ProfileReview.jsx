import {
  User,
  MapPin,
  Sprout,
  Globe,
  Bell,
  BellOff,
  CheckCircle,
  Edit3,
  X,
  Loader2,
  Lock,
  Hash,
} from "lucide-react";

export default function ProfileReview({
  form,
  farmerId,
  onConfirm,
  onEdit,
  onCancel,
  saving = false,
  isNew = false,
}) {
  const displayFarmerId = farmerId || form.farmer_id || form.user_id || "N/A";
  const crops = Array.isArray(form.main_crops) ? form.main_crops : [];
  const landUnit = form.land_unit || "Acres";

  return (
    <div className="review-modal-backdrop" role="dialog" aria-modal="true">
      <div className="review-modal-container">
        {/* Modal Header */}
        <div className="review-modal-header">
          <div className="review-header-title">
            <div className="review-icon-bubble">
              <CheckCircle size={24} />
            </div>
            <div>
              <h2>Review Your Profile Before Saving</h2>
              <p>
                Please verify your details below. You can make edits now or confirm and save to your account.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="review-close-btn"
            onClick={onCancel}
            disabled={saving}
            title="Close review"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 4 Organized Sections */}
        <div className="review-modal-body">
          {/* 1. Personal Information */}
          <div className="review-card">
            <div className="review-card-header">
              <User size={18} />
              <h4>1. Personal Information</h4>
            </div>
            <div className="review-grid">
              <div className="review-field">
                <span className="review-label">Farmer ID</span>
                <span className="review-value">
                  <span className="id-tag">
                    <Hash size={12} />
                    {displayFarmerId}
                  </span>
                </span>
              </div>
              <div className="review-field">
                <span className="review-label">Full Name</span>
                <span className="review-value">{form.full_name || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">
                  Email Address <Lock size={11} className="inline-lock" />
                </span>
                <span className="review-value">{form.email || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">Mobile Number</span>
                <span className="review-value">{form.mobile_number || "—"}</span>
              </div>
            </div>
          </div>

          {/* 2. Location Information */}
          <div className="review-card">
            <div className="review-card-header">
              <MapPin size={18} />
              <h4>2. Location Information</h4>
            </div>
            <div className="review-grid">
              <div className="review-field">
                <span className="review-label">State</span>
                <span className="review-value">{form.state || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">District</span>
                <span className="review-value">{form.district || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">Taluk</span>
                <span className="review-value">{form.taluk || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">Village</span>
                <span className="review-value">{form.village || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">PIN Code</span>
                <span className="review-value">{form.pin_code || "—"}</span>
              </div>
            </div>
          </div>

          {/* 3. Farming Information */}
          <div className="review-card">
            <div className="review-card-header">
              <Sprout size={18} />
              <h4>3. Farming Information</h4>
            </div>
            <div className="review-grid">
              <div className="review-field">
                <span className="review-label">Total Land Size</span>
                <span className="review-value">
                  {form.total_land_size
                    ? `${form.total_land_size} ${landUnit}`
                    : "—"}
                </span>
              </div>
              <div className="review-field">
                <span className="review-label">Soil Type</span>
                <span className="review-value">{form.soil_type || "—"}</span>
              </div>
              <div className="review-field">
                <span className="review-label">Irrigation Type</span>
                <span className="review-value">
                  {form.irrigation_type || "—"}
                </span>
              </div>
              <div className="review-field">
                <span className="review-label">Farming Experience</span>
                <span className="review-value">
                  {form.farming_experience !== null &&
                  form.farming_experience !== undefined &&
                  form.farming_experience !== ""
                    ? `${form.farming_experience} years`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="review-crops-wrap">
              <span className="review-label">Main Crops Cultivated:</span>
              <div className="review-crops-list">
                {crops.length > 0 ? (
                  crops.map((crop) => (
                    <span key={crop} className="review-crop-pill">
                      <Sprout size={12} />
                      {crop}
                    </span>
                  ))
                ) : (
                  <span className="empty-subtext">No crops selected</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Language & Notification Preferences */}
          <div className="review-card">
            <div className="review-card-header">
              <Globe size={18} />
              <h4>4. Language &amp; Notification Preferences</h4>
            </div>
            <div className="review-grid">
              <div className="review-field">
                <span className="review-label">Preferred Language</span>
                <span className="review-value">
                  {form.preferred_language || "—"}
                </span>
              </div>
              <div className="review-field">
                <span className="review-label">Notifications</span>
                <span className="review-value">
                  {form.notifications_enabled ? (
                    <span className="badge badge-success">
                      <Bell size={12} /> Enabled
                    </span>
                  ) : (
                    <span className="badge badge-secondary">
                      <BellOff size={12} /> Disabled
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="review-modal-actions">
          <button
            type="button"
            className="btn-review-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            className="btn-review-edit"
            onClick={onEdit}
            disabled={saving}
          >
            <Edit3 size={16} />
            <span>Edit Information</span>
          </button>

          <button
            type="button"
            className="btn-review-confirm"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={17} className="spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <CheckCircle size={17} />
                <span>{isNew ? "Confirm and Save Profile" : "Confirm and Save Changes"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
