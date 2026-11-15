import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { farmDiaryService } from "../services/farmDiaryService";
import { Crop, Activity, MapPin, ArrowRight, Sprout, Plus } from "lucide-react";
import "../styles/dashboard.css";

export default function CropInfo() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    farmDiaryService
      .listCrops()
      .then((res) => {
        if (res.data?.crops) setCrops(res.data.crops);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page crop-info-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Crop Information &amp; Growth Tracking</h1>
          <p className="page-sub">
            Track cultivated varieties, growth cycles, and acreage across your farmland.
          </p>
        </div>
      </div>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon"><Crop size={22} /></div>
          <div>
            <p className="feature-title">Crop Cycle Monitoring</p>
            <p className="feature-text">
              Track sowing dates, vegetative stages, flowering, and expected harvest timelines.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><Activity size={22} /></div>
          <div>
            <p className="feature-title">Agronomic Health &amp; Advisory</p>
            <p className="feature-text">
              Get targeted pest control and fertilization recommendations via the AI Assistant.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><MapPin size={22} /></div>
          <div>
            <p className="feature-title">Acreage &amp; Land Allocation</p>
            <p className="feature-text">
              Maintain accurate records of land parcel allocations for Kharif and Rabi seasons.
            </p>
          </div>
        </div>
      </section>

      {/* Registered Crops List */}
      <section className="diary-section-detail" style={{ marginTop: "1rem" }}>
        <div className="section-title-row">
          <h2 className="section-title">Your Registered Crops ({crops.length})</h2>
          <Link to="/farm-diary" className="highlight-card-link">
            <span>Manage in Farm Diary</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {crops.length > 0 ? (
          <div className="diary-cards-grid">
            {crops.map((crop, idx) => (
              <div key={idx} className="diary-record-card">
                <div className="record-card-top">
                  <div className="record-icon-box">
                    <Crop size={22} />
                  </div>
                  <span className="record-status-badge">
                    {crop.crop_status || "Active"}
                  </span>
                </div>
                <h3 className="record-title">{crop.crop_name}</h3>
                <div className="record-meta-line">
                  <span>Variety: {crop.crop_variety || "Standard"}</span>
                </div>
                <div className="record-meta-line">
                  <span>Land Area: {crop.land_area ? `${crop.land_area} acres` : "—"}</span>
                </div>
                {crop.sowing_date && (
                  <div className="record-meta-line">
                    <span>Sown: {new Date(crop.sowing_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Sprout size={36} style={{ color: "var(--primary-color)", marginBottom: 8 }} />
            <p>
              No crop records found in your Farm Diary yet. Register crops to track growth stages and receive weather-linked advisories.
            </p>
            <Link to="/farm-diary" className="btn-hero-primary" style={{ marginTop: 14 }}>
              <span>Open Farm Diary</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
