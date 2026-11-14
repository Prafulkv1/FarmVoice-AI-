import { useState } from "react";
import { Sprout, Layers, Droplets, Calendar, Plus, X, Check } from "lucide-react";
import { SOIL_TYPES, IRRIGATION_TYPES, MAIN_CROPS } from "../../utils/profileValidation";

export default function FarmingInformation({
  form,
  onChange,
  errors = {},
  isEditing = false,
}) {
  const [customCrop, setCustomCrop] = useState("");
  const selectedCrops = Array.isArray(form.main_crops) ? form.main_crops : [];

  const toggleCrop = (cropName) => {
    if (!cropName) return;
    const exists = selectedCrops.includes(cropName);
    let updated;
    if (exists) {
      updated = selectedCrops.filter((c) => c !== cropName);
    } else {
      if (selectedCrops.length >= 20) return;
      updated = [...selectedCrops, cropName];
    }
    onChange("main_crops", updated);
  };

  const handleAddCustomCrop = (e) => {
    if (e) e.preventDefault();
    const trimmed = customCrop.trim();
    if (!trimmed) return;
    if (selectedCrops.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomCrop("");
      return;
    }
    if (selectedCrops.length >= 20) return;
    onChange("main_crops", [...selectedCrops, trimmed]);
    setCustomCrop("");
  };

  const removeCrop = (cropName) => {
    onChange(
      "main_crops",
      selectedCrops.filter((c) => c !== cropName)
    );
  };

  if (!isEditing) {
    return (
      <div className="profile-section-card">
        <div className="section-header">
          <div className="section-header-icon">
            <Sprout size={22} />
          </div>
          <div className="section-header-text">
            <h3 className="section-title">Farming Information</h3>
            <p className="section-subtitle">
              Land size, soil conditions, irrigation, and primary crops
            </p>
          </div>
        </div>

        <div className="section-body">
          <div className="view-grid">
            <div className="view-field">
              <span className="view-label">Total Land Size</span>
              <span className="view-value">
                {form.total_land_size
                  ? `${form.total_land_size} acres`
                  : "Not provided"}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">Soil Type</span>
              <span className="view-value">{form.soil_type || "Not provided"}</span>
            </div>

            <div className="view-field">
              <span className="view-label">Irrigation Type</span>
              <span className="view-value">
                {form.irrigation_type || "Not provided"}
              </span>
            </div>

            <div className="view-field">
              <span className="view-label">Farming Experience</span>
              <span className="view-value">
                {form.farming_experience !== null &&
                form.farming_experience !== undefined &&
                form.farming_experience !== ""
                  ? `${form.farming_experience} years`
                  : "Not provided"}
              </span>
            </div>
          </div>

          <div className="view-full-field">
            <span className="view-label">Main Crops Cultivated</span>
            <div className="crops-tags-container">
              {selectedCrops.length > 0 ? (
                selectedCrops.map((crop) => (
                  <span key={crop} className="crop-tag">
                    <Sprout size={13} />
                    {crop}
                  </span>
                ))
              ) : (
                <span className="empty-text">No crops selected yet</span>
              )}
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
          <Sprout size={22} />
        </div>
        <div className="section-header-text">
          <h3 className="section-title">Farming Information</h3>
          <p className="section-subtitle">
            Configure your farm size, soil type, irrigation source, and current crops.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="total_land_size">
              Total Land Size (in acres) <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Layers size={18} className="input-icon" />
              <input
                id="total_land_size"
                name="total_land_size"
                type="number"
                step="0.01"
                min="0.01"
                max="9999.99"
                className={`form-control ${errors.total_land_size ? "is-invalid" : ""}`}
                placeholder="e.g. 4.5"
                value={form.total_land_size ?? ""}
                onChange={(e) => onChange("total_land_size", e.target.value)}
              />
            </div>
            {errors.total_land_size ? (
              <span className="field-error">{errors.total_land_size}</span>
            ) : (
              <span className="field-hint">Decimal values accepted (e.g. 2.75)</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="soil_type">
              Soil Type <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Sprout size={18} className="input-icon" />
              <select
                id="soil_type"
                name="soil_type"
                className={`form-control ${errors.soil_type ? "is-invalid" : ""}`}
                value={form.soil_type || ""}
                onChange={(e) => onChange("soil_type", e.target.value)}
              >
                <option value="">-- Select Soil Type --</option>
                {SOIL_TYPES.map((soil) => (
                  <option key={soil} value={soil}>
                    {soil}
                  </option>
                ))}
              </select>
            </div>
            {errors.soil_type && (
              <span className="field-error">{errors.soil_type}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="irrigation_type">
              Irrigation Type <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <Droplets size={18} className="input-icon" />
              <select
                id="irrigation_type"
                name="irrigation_type"
                className={`form-control ${errors.irrigation_type ? "is-invalid" : ""}`}
                value={form.irrigation_type || ""}
                onChange={(e) => onChange("irrigation_type", e.target.value)}
              >
                <option value="">-- Select Irrigation Method --</option>
                {IRRIGATION_TYPES.map((irr) => (
                  <option key={irr} value={irr}>
                    {irr}
                  </option>
                ))}
              </select>
            </div>
            {errors.irrigation_type && (
              <span className="field-error">{errors.irrigation_type}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="farming_experience">
              Farming Experience (years) <span className="optional-tag">(Optional)</span>
            </label>
            <div className="input-icon-wrapper">
              <Calendar size={18} className="input-icon" />
              <input
                id="farming_experience"
                name="farming_experience"
                type="number"
                min="0"
                max="100"
                className={`form-control ${errors.farming_experience ? "is-invalid" : ""}`}
                placeholder="e.g. 12"
                value={form.farming_experience ?? ""}
                onChange={(e) => onChange("farming_experience", e.target.value)}
              />
            </div>
            {errors.farming_experience && (
              <span className="field-error">{errors.farming_experience}</span>
            )}
          </div>
        </div>

        {/* Crops Selection */}
        <div className="crops-form-section">
          <label className="form-label">
            Main Crops <span className="req-star">*</span>
            <span className="selected-counter">
              ({selectedCrops.length} selected)
            </span>
          </label>
          <p className="field-hint">
            Click on common crops to select or deselect. You can also type custom crops below.
          </p>

          <div className="crop-selector-pills">
            {MAIN_CROPS.map((crop) => {
              const active = selectedCrops.includes(crop);
              return (
                <button
                  key={crop}
                  type="button"
                  className={`crop-pill-btn ${active ? "active" : ""}`}
                  onClick={() => toggleCrop(crop)}
                >
                  {active ? <Check size={14} /> : <Sprout size={14} />}
                  <span>{crop}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom crop */}
          <div className="custom-crop-row">
            <div className="input-icon-wrapper custom-crop-input">
              <Sprout size={18} className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Add other crop (e.g. Coffee, Ginger)"
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomCrop();
                  }
                }}
                maxLength={100}
              />
            </div>
            <button
              type="button"
              className="btn-add-crop"
              onClick={handleAddCustomCrop}
              disabled={!customCrop.trim() || selectedCrops.length >= 20}
            >
              <Plus size={16} /> Add Crop
            </button>
          </div>

          {/* Currently selected crops tags with remove option */}
          {selectedCrops.length > 0 && (
            <div className="active-crops-chips">
              <span className="chips-title">Selected:</span>
              {selectedCrops.map((crop) => (
                <span key={crop} className="active-crop-chip">
                  <span>{crop}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => removeCrop(crop)}
                    title={`Remove ${crop}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errors.main_crops && (
            <span className="field-error block-error">{errors.main_crops}</span>
          )}
        </div>
      </div>
    </div>
  );
}
