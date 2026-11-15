import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { farmDiaryService } from "../services/farmDiaryService";
import {
  Crop,
  Activity,
  Award,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import "../styles/dashboard.css";
import "../styles/components.css";

export default function FarmDiary() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [cropsRes, activitiesRes, harvestsRes, expensesRes] =
        await Promise.all([
          farmDiaryService.listCrops().catch(() => ({ data: { crops: [] } })),
          farmDiaryService
            .listActivities()
            .catch(() => ({ data: { activities: [] } })),
          farmDiaryService
            .listHarvest()
            .catch(() => ({ data: { harvest_records: [] } })),
          farmDiaryService
            .listExpenses()
            .catch(() => ({ data: { expenses: [] } })),
        ]);

      if (cropsRes.data?.crops) setCrops(cropsRes.data.crops);
      if (activitiesRes.data?.activities)
        setActivities(activitiesRes.data.activities);
      if (harvestsRes.data?.harvest_records)
        setHarvests(harvestsRes.data.harvest_records);
      if (expensesRes.data?.expenses) setExpenses(expensesRes.data.expenses);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch farm diary data",
      );
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Crop,
      label: "Registered Crops",
      value: crops.length,
      note: "Total cultivated crops",
      color: "var(--primary-color)",
    },
    {
      icon: Activity,
      label: "Currently Growing",
      value: crops.filter((c) => c.crop_status === "Growing" || !c.crop_status)
        .length,
      note: "Crops in active growth",
      color: "#2E7D32",
    },
    {
      icon: Clock,
      label: "Activities Recorded",
      value: activities.length,
      note: "Daily farm operations",
      color: "#0288D1",
    },
    {
      icon: Award,
      label: "Harvest Records",
      value: harvests.length,
      note: "Logged yield batches",
      color: "#FBC02D",
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="auth-loading">
          <div className="loading-spinner-ring" />
          <p>Loading your farm diary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page diary-page">
      {/* Banner */}
      <section className="welcome-section">
        <div className="welcome-banner">
          <div className="welcome-banner-text">
            <div className="welcome-badge">
              <span className="live-dot" />
              <span>Digital Farm Ledger</span>
            </div>
            <h1 className="welcome-heading">Farm Diary &amp; Operations</h1>
            <p className="welcome-sub">
              Log daily cultivation tasks, monitor crop growth stages, and track
              harvest yields and expenses.
            </p>
            <div className="welcome-meta">
              <span className="welcome-meta-item">
                <Calendar size={14} />{" "}
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="welcome-meta-item">
                <Sparkles size={14} /> FarmVoice AI Ledger
              </span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon-wrap" style={{ color: stat.color }}>
                <stat.icon size={22} />
              </div>
              <div className="stat-body">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-note">{stat.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diary Category Navigation Tabs */}
      <div className="diary-tab-bar">
        {[
          { key: "overview", label: "Overview & Timeline" },
          { key: "crops", label: `My Crops (${crops.length})` },
          { key: "activities", label: `Activities (${activities.length})` },
          { key: "harvests", label: `Harvests (${harvests.length})` },
          { key: "expenses", label: `Expenses (${expenses.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`diary-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="diary-overview-grid">
          {/* Recent Activities Section */}
          <div className="diary-panel-card">
            <div className="diary-panel-header">
              <div className="panel-title-wrap">
                <Activity size={18} className="panel-icon" />
                <h3 className="panel-title">Recent Farming Activities</h3>
              </div>
              <button
                className="panel-action-btn"
                onClick={() => setActiveTab("activities")}
              >
                View all ({activities.length})
              </button>
            </div>

            <div className="panel-body">
              {activities.length > 0 ? (
                <div className="diary-timeline">
                  {activities.slice(0, 4).map((act, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-top">
                          <span className="timeline-type">
                            {act.activity_type || "Farming Task"}
                          </span>
                          <span className="timeline-date">
                            {act.activity_date
                              ? new Date(act.activity_date).toLocaleDateString()
                              : "Recent"}
                          </span>
                        </div>
                        <p className="timeline-desc">
                          {act.activity_description || "Activity recorded"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel-notice">
                  <p>No farming activities logged yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Crops Overview Section */}
          <div className="diary-panel-card">
            <div className="diary-panel-header">
              <div className="panel-title-wrap">
                <Crop size={18} className="panel-icon" />
                <h3 className="panel-title">Active Cultivated Crops</h3>
              </div>
              <button
                className="panel-action-btn"
                onClick={() => setActiveTab("crops")}
              >
                View all ({crops.length})
              </button>
            </div>

            <div className="panel-body">
              {crops.length > 0 ? (
                <div className="diary-crops-list">
                  {crops.slice(0, 4).map((crop, idx) => (
                    <div key={idx} className="crop-summary-chip">
                      <div className="crop-chip-icon">
                        <Crop size={18} />
                      </div>
                      <div className="crop-chip-info">
                        <div className="crop-chip-name">{crop.crop_name}</div>
                        <div className="crop-chip-meta">
                          {crop.crop_variety || "Standard Variety"} &bull;{" "}
                          {crop.land_area
                            ? `${crop.land_area} acres`
                            : "Acreage not specified"}
                        </div>
                      </div>
                      <span className="crop-chip-status">
                        {crop.crop_status || "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel-notice">
                  <p>
                    No crops registered yet. Add crops to track sowing to
                    harvest.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Crops */}
      {activeTab === "crops" && (
        <div className="diary-section-detail">
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
                  <span>Variety: {crop.crop_variety || "Not specified"}</span>
                </div>
                <div className="record-meta-line">
                  <span>
                    Land Area:{" "}
                    {crop.land_area ? `${crop.land_area} acres` : "—"}
                  </span>
                </div>
                {crop.sowing_date && (
                  <div className="record-meta-line">
                    <span>
                      Sown on: {new Date(crop.sowing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {crops.length === 0 && (
              <div className="empty-state">
                <p>No crops have been added to your Farm Diary yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Activities */}
      {activeTab === "activities" && (
        <div className="diary-section-detail">
          <div className="diary-cards-grid">
            {activities.map((act, idx) => (
              <div key={idx} className="diary-record-card">
                <div className="record-card-top">
                  <div className="record-icon-box">
                    <Activity size={20} />
                  </div>
                  <span className="record-date-badge">
                    {act.activity_date
                      ? new Date(act.activity_date).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <h3 className="record-title">
                  {act.activity_type || "Farming Activity"}
                </h3>
                <p className="record-desc">
                  {act.activity_description || "Details recorded in diary"}
                </p>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="empty-state">
                <p>No farm activities logged yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Harvests */}
      {activeTab === "harvests" && (
        <div className="diary-section-detail">
          <div className="diary-cards-grid">
            {harvests.map((h, idx) => (
              <div key={idx} className="diary-record-card">
                <div className="record-card-top">
                  <div
                    className="record-icon-box"
                    style={{ background: "#FFF9C4", color: "#F57F17" }}
                  >
                    <Award size={20} />
                  </div>
                  <span className="record-date-badge">
                    {h.harvest_date
                      ? new Date(h.harvest_date).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <h3 className="record-title">
                  {h.quantity_harvested} {h.quantity_unit || "kg"}
                </h3>
                <p className="record-desc">Harvest recorded from crop plot</p>
              </div>
            ))}
            {harvests.length === 0 && (
              <div className="empty-state">
                <p>No harvest entries recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Expenses */}
      {activeTab === "expenses" && (
        <div className="diary-section-detail">
          <div className="diary-cards-grid">
            {expenses.map((exp, idx) => (
              <div key={idx} className="diary-record-card">
                <div className="record-card-top">
                  <div
                    className="record-icon-box"
                    style={{ background: "#E8F5E9", color: "#2E7D32" }}
                  >
                    <DollarSign size={20} />
                  </div>
                  <span className="record-amount-badge">₹{exp.amount}</span>
                </div>
                <h3 className="record-title">
                  {exp.expense_category || "Farm Expense"}
                </h3>
                <p className="record-desc">
                  {exp.description || "Operational farming cost"}
                </p>
                <div className="record-meta-line">
                  <span>
                    Date:{" "}
                    {exp.expense_date
                      ? new Date(exp.expense_date).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="empty-state">
                <p>No farming expenses logged yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
