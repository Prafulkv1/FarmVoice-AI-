import { MapPin, Building, Compass, Home, Navigation } from "lucide-react";

export default function LocationInformation({
  form,
  onChange,
  errors = {},
  isEditing = false,
}) {
  if (!isEditing) {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <div className="section-header-icon">
            <MapPin size={22} />
          </div>
          <div className="section-header-text">
            <h3 className="section-title">Location Information</h3>
            <p className="section-subtitle">
              Your farm and residence geographic location
            </p>
          </div>
        </div>

        <div className="section-body">
          <div className="view-grid location-grid">
            <div className="view-field">
              <span className="view-label">State</span>
              <span className="view-value">{form.state || "Not provided"}</span>
            </div>

            <div className="view-field">
              <span className="view-label">District</span>
              <span className="view-value">{form.district || "Not provided"}</span>
            </div>

            <div className="view-field">
              <span className="view-label">Taluk</span>
              <span className="view-value">{form.taluk || "Not provided"}</span>
            </div>

            <div className="view-field">
              <span className="view-label">Village</span>
              <span className="view-value">{form.village || "Not provided"}</span>
            </div>

            <div className="view-field">
              <span className="view-label">PIN Code</span>
              <span className="view-value">{form.pin_code || "Not provided"}</span>
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
          <MapPin size={22} />
        </div>
        <div className="section-header-text">
          <h3 className="section-title">Location Information</h3>
          <p className="section-subtitle">
            Provide your farm location to receive accurate local weather, mandi rates, and crop advisory.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="state">
              State <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Compass size={18} className="input-icon" />
              <input
                id="state"
                name="state"
                type="text"
                className={`form-control ${errors.state ? "is-invalid" : ""}`}
                placeholder="e.g. Karnataka"
                value={form.state || ""}
                onChange={(e) => onChange("state", e.target.value)}
                maxLength={100}
              />
            </div>
            {errors.state && <span className="field-error">{errors.state}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Building size={18} className="input-icon" />
              <input
                id="district"
                name="district"
                type="text"
                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                placeholder="e.g. Mysuru"
                value={form.district || ""}
                onChange={(e) => onChange("district", e.target.value)}
                maxLength={100}
              />
            </div>
            {errors.district && (
              <span className="field-error">{errors.district}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taluk">
              Taluk <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Navigation size={18} className="input-icon" />
              <input
                id="taluk"
                name="taluk"
                type="text"
                className={`form-control ${errors.taluk ? "is-invalid" : ""}`}
                placeholder="e.g. Nanjangud"
                value={form.taluk || ""}
                onChange={(e) => onChange("taluk", e.target.value)}
                maxLength={100}
              />
            </div>
            {errors.taluk && <span className="field-error">{errors.taluk}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="village">
              Village <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Home size={18} className="input-icon" />
              <input
                id="village"
                name="village"
                type="text"
                className={`form-control ${errors.village ? "is-invalid" : ""}`}
                placeholder="e.g. Hullahalli"
                value={form.village || ""}
                onChange={(e) => onChange("village", e.target.value)}
                maxLength={150}
              />
            </div>
            {errors.village && (
              <span className="field-error">{errors.village}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pin_code">
              PIN Code <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <MapPin size={18} className="input-icon" />
              <input
                id="pin_code"
                name="pin_code"
                type="text"
                className={`form-control ${errors.pin_code ? "is-invalid" : ""}`}
                placeholder="6-digit PIN code"
                value={form.pin_code || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  onChange("pin_code", val);
                }}
                maxLength={6}
              />
            </div>
            {errors.pin_code && (
              <span className="field-error">{errors.pin_code}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
