import { useAuth } from "../components/AuthProvider";
import { Building2, MapPin, Calendar, Crop } from "lucide-react";
import "../styles/dashboard.css";

export default function MyFarm() {
  const { user } = useAuth();
  const farmName = user?.farm_name || "Not set";
  const farmerId = user?.farmer_id || "—";
  const email = user?.email || "—";
  const mobile = user?.mobile_number || "—";

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Farm</h1>
        <p className="page-sub">Manage your farm details and land records.</p>
      </div>

      <section className="farm-summary">
        <h2 className="section-title">Farm Summary</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon"><Building2 size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Farm Name</div>
              <div className="summary-value">{farmName}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon"><MapPin size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Farmer ID</div>
              <div className="summary-value">#{farmerId}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon"><Calendar size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Registered Email</div>
              <div className="summary-value">{email}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon"><Crop size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Mobile Number</div>
              <div className="summary-value">{mobile}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="empty-state">
        <p>
          Land records and farm activity tracking are not yet connected to the
          backend. Farm management features will be available in an upcoming
          phase.
        </p>
      </div>
    </div>
  );
}
