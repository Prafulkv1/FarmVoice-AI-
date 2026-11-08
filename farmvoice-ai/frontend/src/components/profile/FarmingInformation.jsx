import { useState } from "react";
import FormInput from "../FormInput";
import { Leaf, Plus, X } from "lucide-react";
import "../../styles/dashboard.css";

const SOIL_TYPES = [
  "Alluvial",
  "Black",
  "Red",
  "Laterite",
  "Desert",
  "Mountain",
  "Peaty",
];

const IRRIGATION_TYPES = ["Rainfed", "Canal", "Tubewell", "Tank", "Drip", "Sprinkler"];

const COMMON_CROPS = [
  "Rice",
  "Wheat",
  "Cotton",
  "Sugarcane",
  "Ragi",
  "Maize",
  "Pulses",
  "Vegetables",
  "Coconut",
  "Banana",
  "Turmeric",
  "Chilli",
  "Tomato",
  "Millets",
  "Groundnut",
  "Other",
];

export default function FarmingInformation({ value, onChange, error }) {
  const [newCrop, setNewCrop] = useState("");
  const crops = Array.isArray(value.main_crops) ? value.main_crops : [];

  const addCrop = (name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    if (crops.includes(trimmed)) return;
    if (crops.length >= 20) return;
    onChange("main_crops", [...crops, trimmed]);
    setNewCrop("");
  };

  const removeCrop = (name) => {
    onChange(
      "main_crops",
      crops.filter((c) => c !== name)
    );
  };

  const handleNewCropChange = (e) => setNewCrop(e.target.value);
  const handleAddCrop = () => {
    addCrop(newCrop);
  };

  const isSelected = (crop) => crops.includes(crop);

  return (
    <section className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-icon">
          <Leaf size={20} />
        </div>
        <div>
          <h3 className="profile-section-title">Farming Information</h3>
          <p className="profile-section-desc">
            Tell us about your land and farming practices. Farming experience
            is optional.
          </p>
        </div>
      </div>

      <div className="profile-section-body">
        <div className="profile-form-grid">
          <FormInput
            id="total_land_size"
            label="Total Land Size (acres)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 3.5"
            icon={null}
            value={value.total_land_size || ""}
            onChange={(v) => onChange("total_land_size", v)}
            error={error.total_land_size}
          />
          <div className="form-group full-width">
            <label className="form-label">Soil Type</label>
            <select
              className="form-select"
              value={value.soil_type || ""}
              onChange={(e) => onChange("soil_type", e.target.value)}
            >
              <option value="">Select soil type</option>
              {SOIL_TYPES.map((soil) => (
                <option key={soil} value={soil}>
                  {soil}
                </option>
              ))}
            </select>
            {error.soil_type && (
              <span className="form-error">{error.soil_type}</span>
            )}
          </div>
          <div className="form-group full-width">
            <label className="form-label">Irrigation Type</label>
            <select
              className="form-select"
              value={value.irrigation_type || ""}
              onChange={(e) => onChange("irrigation_type", e.target.value)}
            >
              <option value="">Select irrigation type</option>
              {IRRIGATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {error.irrigation_type && (
              <span className="form-error">{error.irrigation_type}</span>
            )}
          </div>
          <FormInput
            id="farming_experience"
            label="Farming Experience (years, optional)"
            type="number"
            min="0"
            placeholder="e.g. 10"
            icon={null}
            value={value.farming_experience || ""}
            onChange={(v) => onChange("farming_experience", v)}
            error={error.farming_experience}
          />
        </div>

        <div className="form-group full-width crops-group">
          <label className="form-label">Main Crops Grown</label>
          <p className="form-hint">
            Select all crops you grow on your farm.
          </p>
          <div className="crop-pills">
            {COMMON_CROPS.map((crop) => (
              <button
                key={crop}
                type="button"
                className={`crop-pill ${isSelected(crop) ? "crop-pill-active" : ""}`}
                onClick={() => addCrop(crop)}
                aria-pressed={isSelected(crop)}
              >
                {isSelected(crop) ? <X size={14} /> : <Leaf size={14} />}
                {crop}
              </button>
            ))}
          </div>
          <div className="input-wrapper-inline custom-crop-form">
            <input
              className="form-input"
              placeholder="Add another crop (e.g. Areca nut)"
              value={newCrop}
              onChange={handleNewCropChange}
            />
            <button
              type="button"
              className="btn-add-crop"
              onClick={handleAddCrop}
              disabled={
                !newCrop.trim() ||
                crops.includes(newCrop.trim()) ||
                crops.length >= 20
              }
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {crops.map((crop) => (
            <span key={crop} className="selected-chip">
              {crop}
              <button
                type="button"
                className="chip-remove"
                onClick={() => removeCrop(crop)}
                aria-label={`Remove ${crop}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {error.main_crops && <span className="form-error">{error.main_crops}</span>}
          {error["main_crops[0]"] && (
            <span className="form-error">{error["main_crops[0]"]}</span>
          )}
        </div>
      </div>
    </section>
  );
}
