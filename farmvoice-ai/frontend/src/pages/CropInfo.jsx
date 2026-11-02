import { useAuth } from "../components/AuthProvider";
import { Crop, Activity, MapPin } from "lucide-react";
import "../styles/dashboard.css";

export default function CropInfo() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Crop Information</h1>
        <p className="page-sub">
          Track crop growth, stages and health.
        </p>
      </div>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon"><Crop size={20} /></div>
          <div>
            <p className="feature-title">Crop Tracking</p>
            <p className="feature-text">
              Add and track the crops grown on your farm with growth stages.
            </p>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Activity size={20} /></div>
          <div>
            <p className="feature-title">Crop Health</p>
            <p className="feature-text">
              Monitor crop health and receive care recommendations.
            </p>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><MapPin size={20} /></div>
          <div>
            <p className="feature-title">Land Records</p>
            <p className="feature-text">
              Maintain records of your farmland and crop zones.
            </p>
          </div>
        </div>
      </section>

      <div className="empty-state">
        <p>
          No crop data has been added yet. Crop information features will be
          available in an upcoming phase.
        </p>
      </div>
    </div>
  );
}
