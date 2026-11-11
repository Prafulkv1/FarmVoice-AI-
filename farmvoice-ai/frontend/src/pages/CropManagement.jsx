import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { farmDiaryService } from "../services/farmDiaryService";
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Droplet,
  Sprout,
  ArrowRight,
} from "lucide-react";
import "../styles/dashboard.css";
import "../styles/components.css";

const initialCrop = {
  crop_name: "",
  crop_variety: "",
  land_area: "",
  sowing_date: "",
  expected_harvest_date: "",
  season: "Kharif",
  crop_status: "Planned",
};

const SEASONS = ["Kharif", "Rabi", "Zaid", "Other"];
const STATUSES = ["Planned", "Growing", "Harvested"];

export default function CropManagement() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [formData, setFormData] = useState(initialCrop);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const res = await farmDiaryService.listCrops();
      setCrops(res.data?.crops || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch crops");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.crop_name.trim()) errors.crop_name = "Crop name is required.";
    if (formData.land_area && parseFloat(formData.land_area) <= 0) {
      errors.land_area = "Land area must be greater than zero.";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (editingCrop) {
        await farmDiaryService.updateCrop(editingCrop.crop_id, formData);
      } else {
        await farmDiaryService.addCrop(formData);
      }
      setError("");
      setShowForm(false);
      setEditingCrop(null);
      fetchCrops();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save crop");
    }
  };

  const handleEdit = (crop) => {
    setEditingCrop(crop);
    setFormData({
      crop_name: crop.crop_name,
      crop_variety: crop.crop_variety || "",
      land_area: crop.land_area || "",
      sowing_date: crop.sowing_date || "",
      expected_harvest_date: crop.expected_harvest_date || "",
      season: crop.season || "Kharif",
      crop_status: crop.crop_status || "Planned",
    });
    setShowForm(true);
  };

  const handleDelete = async (cropId) => {
    if (window.confirm("Are you sure you want to delete this crop and all its records?")) {
      try {
        await farmDiaryService.deleteCrop(cropId);
        setError("");
        fetchCrops();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete crop");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <aside className="sidebar-container">
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading crops...</p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <div className="welcome-banner">
          <div className="welcome-banner-text">
            <h1>Crop Management</h1>
            <p className="welcome-sub">Register, edit, and track your cultivated crops.</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="dashboard-shell">
        <aside className="sidebar-container">
          <div className="dashboard-main">
            <section className="cards-section">
              <div className="cards-grid">
                <div
                  className="dashboard-card card-clickable"
                  style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
                  onClick={() => setShowForm(!showForm)}
                >
                  <div className="dashboard-card-icon">
                    <Plus size={20} />
                  </div>
                  <div className="dashboard-card-body">
                    <div className="dashboard-card-title">{showForm ? "Cancel" : "Add New Crop"}</div>
                    <div className="dashboard-card-text">{showForm ? "Close the form" : "Register a new crop"}</div>
                  </div>
                  <div className="dashboard-card-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </section>

            {showForm && (
              <section className="cards-section">
                <div className="dashboard-card">
                  <div className="dashboard-card-body">
                    <div className="dashboard-card-title">{editingCrop ? "Edit Crop" : "Add New Crop"}</div>
                    <form onSubmit={handleSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Crop Name *</label>
                          <input
                            type="text"
                            name="crop_name"
                            value={formData.crop_name}
                            onChange={handleChange}
                            className={formErrors.crop_name ? "form-input error" : "form-input"}
                            placeholder="e.g. Rice"
                          />
                          {formErrors.crop_name && <div className="form-error">{formErrors.crop_name}</div>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Crop Variety</label>
                          <input
                            type="text"
                            name="crop_variety"
                            value={formData.crop_variety}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g. Basmati"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Land Area (acres)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="land_area"
                            value={formData.land_area}
                            onChange={handleChange}
                            className={formErrors.land_area ? "form-input error" : "form-input"}
                            placeholder="e.g. 5.5"
                          />
                          {formErrors.land_area && <div className="form-error">{formErrors.land_area}</div>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Sowing Date</label>
                          <input
                            type="date"

            <section className="cards-section">
              <div className="cards-grid">
                {crops.map((crop) => (
                  <div key={crop.crop_id} className="dashboard-card">
                    <div className="dashboard-card-icon">
                      <Crop size={20} />
                    </div>
                    <div className="dashboard-card-body">
                      <div className="dashboard-card-title">{crop.crop_name}</div>
                      <div className="dashboard-card-text">{crop.crop_variety || "No variety"}</div>
                      <div className="dashboard-card-subtext">
                        {crop.land_area ? `${crop.land_area} acres` : "No area"}
                        {" | "}
                        <span style={{ color: crop.crop_status === "Growing" ? "var(--color-primary-light)" : crop.crop_status === "Harvested" ? "var(--color-text-secondary)" : "var(--color-text-secondary)" }}>
                          {crop.crop_status}
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-card-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(crop)}
                        aria-label="Edit crop"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: "var(--color-error)" }}
                        onClick={() => handleDelete(crop.crop_id)}
                        aria-label="Delete crop"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {crops.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Sprout size={40} />
                  </div>
                  <p>No crops registered yet</p>
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    Add your first crop
                  </button>
                </div>
              )}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
                            name="sowing_date"
                            value={formData.sowing_date}
                            onChange={handleChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expected Harvest Date</label>
                          <input
                            type="date"
                            name="expected_harvest_date"
                            value={formData.expected_harvest_date}
                            onChange={handleChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Season</label>
                          <select
                            name="season"
                            value={formData.season}
                            onChange={handleChange}
                            className="form-input"
                          >
                            {SEASONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Crop Status</label>
                          <select
                            name="crop_status"
                            value={formData.crop_status}
                            onChange={handleChange}
                            className="form-input"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          <SaveIcon /> {editingCrop ? "Update Crop" : "Add Crop"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowForm(false);
                            setEditingCrop(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </section>
            )}