import { useAuth } from "../components/AuthProvider";
import { Link } from "react-router-dom";
import { Building2, MapPin, Calendar, Phone, Mail, Sprout, ArrowRight, ShieldCheck, User } from "lucide-react";
import "../styles/dashboard.css";

export default function MyFarm() {
  const { user } = useAuth();
  const farmName = user?.farm_name || "Farm Name Not Set";
  const farmerId = user?.farmer_id || user?.user_id || "—";
  const email = user?.email || "—";
  const mobile = user?.mobile_number || "—";
  const username = user?.username || "Farmer";

  return (
    <div className="page my-farm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Farm Land &amp; Holdings</h1>
          <p className="page-sub">
            Overview of your agricultural holding identity, registration, and land credentials.
          </p>
        </div>
      </div>

      {/* Farm Identity Card */}
      <div className="welcome-banner" style={{ marginBottom: "2rem" }}>
        <div className="welcome-banner-text">
          <div className="welcome-badge">
            <span className="live-dot" />
            <span>Registered Holding</span>
          </div>
          <h2 className="welcome-heading" style={{ fontSize: "2rem" }}>{farmName}</h2>
          <p className="welcome-sub">
            Farmer Account: <strong>{username}</strong> &bull; Holding ID: #{farmerId}
          </p>
        </div>
      </div>

      <section className="farm-summary">
        <div className="section-title-row">
          <h2 className="section-title">Farm Profile Details</h2>
          <Link to="/profile" className="highlight-card-link">
            <span>Edit Full Profile</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon"><Building2 size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Farm / Holding Name</div>
              <div className="summary-value">{farmName}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon"><User size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Registered Farmer ID</div>
              <div className="summary-value">#{farmerId}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon"><Mail size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Registered Email</div>
              <div className="summary-value">{email}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon"><Phone size={24} /></div>
            <div className="summary-body">
              <div className="summary-label">Mobile Number</div>
              <div className="summary-value">{mobile}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Land & Soil Card Link */}
      <section className="feature-grid" style={{ marginTop: "1rem" }}>
        <div className="feature-card">
          <div className="feature-icon"><MapPin size={22} /></div>
          <div>
            <p className="feature-title">Location &amp; Soil Records</p>
            <p className="feature-text">
              Maintain precise records of your village, district, pin code, and total acreage in your 15-point farmer profile.
            </p>
          </div>
          <Link to="/profile" className="placeholder-link-arrow">
            <span>Manage Location in Profile</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><Sprout size={22} /></div>
          <div>
            <p className="feature-title">Cultivated Crops &amp; Diary</p>
            <p className="feature-text">
              Log daily agricultural operations, fertilizer applications, and harvests in your digital Farm Diary.
            </p>
          </div>
          <Link to="/farm-diary" className="placeholder-link-arrow">
            <span>Open Farm Diary</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
