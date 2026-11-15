import { User, Mail, Phone, Lock, Hash } from "lucide-react";

export default function PersonalInformation({
  form,
  onChange,
  errors = {},
  isEditing = false,
  farmerId = null,
}) {
  const displayFarmerId =
    farmerId || form.farmer_id || form.user_id || form.id || "N/A";

  if (!isEditing) {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <div className="section-header-icon">
            <User size={22} />
          </div>
          <div className="section-header-text">
            <div className="section-title-row">
              <h3 className="section-title">Personal Information</h3>
              <span className="farmer-id-badge">
                <Hash size={13} />
                Farmer ID: {displayFarmerId}
              </span>
            </div>
            <p className="section-subtitle">
              Your identity and contact details linked to your FarmVoice AI
              account
            </p>
          </div>
        </div>

        <div className="section-body">
          <div className="view-grid">
            <div className="view-field">
              <span className="view-label">Farmer ID</span>
              <span className="view-value readonly-val">
                #{displayFarmerId}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">Full Name</span>
              <span
                className={`view-value ${!form.full_name ? "empty-val" : ""}`}
              >
                {form.full_name || "Not added yet"}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">
                Email Address
                <span className="readonly-badge">
                  <Lock size={11} /> Read-only
                </span>
              </span>
              <span className={`view-value ${!form.email ? "empty-val" : ""}`}>
                {form.email || "Not added yet"}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">Mobile Number</span>
              <span
                className={`view-value ${!form.mobile_number ? "empty-val" : ""}`}
              >
                {form.mobile_number || "Not added yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-section-card edit-card">
      <div className="section-header">
        <div className="section-header-icon">
          <User size={22} />
        </div>
        <div className="section-header-text">
          <div className="section-title-row">
            <h3 className="section-title">Personal Information</h3>
            <span className="farmer-id-badge">
              <Hash size={13} />
              Farmer ID: {displayFarmerId}
            </span>
          </div>
          <p className="section-subtitle">
            Update your contact details. Email address and Farmer ID are
            permanently tied to your registration.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="farmer_id">
              Farmer ID <span className="readonly-tag">(Locked)</span>
            </label>
            <div className="input-icon-wrapper">
              <Hash size={18} className="input-icon" />
              <input
                id="farmer_id"
                type="text"
                className="form-control is-readonly"
                value={`#${displayFarmerId}`}
                readOnly
                disabled
              />
            </div>
            <span className="field-hint">
              Unique farmer registration identifier.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="full_name">
              Full Name <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="full_name"
                name="full_name"
                type="text"
                className={`form-control ${errors.full_name ? "is-invalid" : ""}`}
                placeholder="Enter your full name"
                value={form.full_name || ""}
                onChange={(e) => onChange("full_name", e.target.value)}
                maxLength={150}
              />
            </div>
            {errors.full_name && (
              <span className="field-error">{errors.full_name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="readonly-tag">(Locked)</span>
            </label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-control is-readonly"
                value={form.email || ""}
                readOnly
                disabled
              />
            </div>
            <span className="field-hint">
              Registered account email cannot be changed.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mobile_number">
              Mobile Number <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Phone size={18} className="input-icon" />
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                className={`form-control ${errors.mobile_number ? "is-invalid" : ""}`}
                placeholder="10-digit mobile number"
                value={form.mobile_number || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  onChange("mobile_number", val);
                }}
                maxLength={10}
              />
            </div>
            {errors.mobile_number ? (
              <span className="field-error">{errors.mobile_number}</span>
            ) : (
              <span className="field-hint">
                Valid 10-digit Indian mobile number
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
