import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { farmDiaryService } from "../services/farmDiaryService";
import DashboardCard from "../components/DashboardCard";
import {
  LayoutDashboard,
  Crop,
  Activity,
  Droplet,
  Bug,
  Award,
  DollarSign,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles,
  User,
  MapPin,
  Edit3,
  Trash2,
} from "lucide-react";
import "../styles/dashboard.css";
import "../styles/components.css";

const CropCard = ({ crop, onClick }) => (
  <div
    className="dashboard-card card-clickable"
    style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
    onClick={() => onClick(crop)}
  >
    <div className="dashboard-card-icon">
      <Crop size={20} />
    </div>
    <div className="dashboard-card-body">
      <div className="dashboard-card-title">{crop.crop_name}</div>
      <div className="dashboard-card-text">{crop.crop_variety || "No variety"}</div>
      <div className="dashboard-card-subtext">
        {crop.land_area ? `${crop.land_area} acres` : "No area specified"}
      </div>
    </div>
    <div className="dashboard-card-arrow">
      <ArrowRight size={16} />
    </div>
  </div>
);
const ActivityCard = ({ activity }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-icon">
      <Activity size={18} />
    </div>
    <div className="dashboard-card-body">
      <div className="dashboard-card-title">{activity.activity_type}</div>
      <div className="dashboard-card-text">{activity.activity_description}</div>
      <div className="dashboard-card-subtext">
        {new Date(activity.activity_date).toLocaleDateString()}
      </div>
    </div>
  </div>
);

const HarvestCard = ({ harvest }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-icon">
      <Award size={18} />
    </div>
    <div className="dashboard-card-body">
      <div className="dashboard-card-title">
        {harvest.quantity_harvested} {harvest.quantity_unit}
      </div>
      <div className="dashboard-card-text">Harvested from a crop</div>
      <div className="dashboard-card-subtext">
        {new Date(harvest.harvest_date).toLocaleDateString()}
      </div>
    </div>
  </div>
);

const ExpenseCard = ({ expense }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-icon">
      <DollarSign size={18} />
    </div>
    <div className="dashboard-card-body">
      <div className="dashboard-card-title">{expense.expense_category}</div>
      <div className="dashboard-card-text">{expense.description}</div>
      <div className="dashboard-card-subtext">
        ₹{expense.amount} - {new Date(expense.expense_date).toLocaleDateString()}
      </div>
    </div>
  </div>
);

export default function FarmDiary() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [cropsRes, activitiesRes, harvestsRes, expensesRes] = await Promise.all([
        farmDiaryService.listCrops(),
        farmDiaryService.listActivities(),
        farmDiaryService.listHarvest(),
        farmDiaryService.listExpenses(),
      ]);

      if (cropsRes.data?.crops) setCrops(cropsRes.data.crops);
      if (activitiesRes.data?.activities) setActivities(activitiesRes.data.activities);
      if (harvestsRes.data?.harvest_records) setHarvests(harvestsRes.data.harvest_records);
      if (expensesRes.data?.expenses) setExpenses(expensesRes.data.expenses);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch farm diary data");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Crop,
      label: "Registered Crops",
      value: crops.length,
      note: "Total crops registered",
      color: "var(--color-primary)",
    },
    {
      icon: Activity,
      label: "Currently Growing Crops",
      value: crops.filter((c) => c.crop_status === "Growing").length,
      note: "Crops in active growth",
      color: "var(--color-primary-light)",
    },
    {
      icon: Activity,
      label: "Total Activities Recorded",
      value: activities.length,
      note: "Daily farming activities",
      color: "var(--color-secondary)",
    },
    {
      icon: Award,
      label: "Total Harvest Records",
      value: harvests.length,
      note: "Harvest entries",
      color: "var(--color-accent)",
    },
  ];

  const recentActivities = activities.slice(0, 4);
  const recentExpenses = expenses.slice(0, 4);
  const upcomingHarvests = harvests.filter(
    (h) => h.harvest_date >= new Date().toISOString().split("T")[0]
  ).slice(0, 4);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <aside className="sidebar-container">
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading your farm diary...</p>
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
            <h1>Farm Diary</h1>
            <p className="welcome-sub">
              Track your farming activities, crops, and farm health records.
            </p>
            <div className="welcome-meta">
              <span className="welcome-meta-item">
                <Calendar size={14} /> {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="welcome-meta-item">
                <Sparkles size={14} /> FarmVoice AI Farm Diary
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">Summary</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon" style={{ backgroundColor: stat.color + "20" }}>
                <stat.icon size={20} />
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

      <section className="cards-section">
        <div className="cards-grid">
          <DashboardCard
            icon={Crop}
            title="My Crops"
            description="View all your registered crops"
            href="#crops"
            accent="var(--color-primary)"
            onClick={() => document.getElementById("crops")?.scrollIntoView({ behavior: "smooth" })}
          />
          <DashboardCard
            icon={Activity}
            title="Recent Activities"
            description="Your recent farming activities"
            href="#activities"
            accent="var(--color-secondary)"
            onClick={() => document.getElementById("activities")?.scrollIntoView({ behavior: "smooth" })}
          />
          <DashboardCard
            icon={Award}
            title="Upcoming Harvests"
            description="Harvests expected in the future"
            href="#harvests"
            accent="var(--color-primary-light)"
            onClick={() => document.getElementById("harvests")?.scrollIntoView({ behavior: "smooth" })}
          />
          <DashboardCard
            icon={DollarSign}
            title="Recent Expenses"
            description="Your latest farming expenses"
            href="#expenses"
            accent="var(--color-accent)"
            onClick={() => document.getElementById("expenses")?.scrollIntoView({ behavior: "smooth" })}
          />
        </div>
      </section>

      <section className="cards-section">
        <h2 className="section-title">Detailed View</h2>

        <div className="cards-grid">
          <div
            id="crops"
            className="dashboard-card card-clickable"
            style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
            onClick={() => window.location.href = "/farm-diary/crops"}
          >
            <div className="dashboard-card-icon">
              <Crop size={20} />
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">My Crops</div>
              <div className="dashboard-card-text">{crops.length} total crops</div>
              <div className="dashboard-card-subtext">Registered crop details</div>
            </div>
            <div className="dashboard-card-arrow">
              <ArrowRight size={16} />
            </div>
          </div>

          <div
            id="activities"
            className="dashboard-card card-clickable"
            style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
            onClick={() => window.location.href = "/farm-diary/activities"}
          >
            <div className="dashboard-card-icon">
              <Activity size={20} />
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Farming Activities</div>
              <div className="dashboard-card-text">{activities.length} total activities</div>
              <div className="dashboard-card-subtext">Record and track daily activities</div>
            </div>
            <div className="dashboard-card-arrow">
              <ArrowRight size={16} />
            </div>
          </div>

          <div
            id="harvests"
            className="dashboard-card card-clickable"
            style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
            onClick={() => window.location.href = "/farm-diary/harvest"}
          >
            <div className="dashboard-card-icon">
              <Award size={20} />
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Harvest Records</div>
              <div className="dashboard-card-text">{harvests.length} total harvests</div>
              <div className="dashboard-card-subtext">Track your harvest history</div>
            </div>
            <div className="dashboard-card-arrow">
              <ArrowRight size={16} />
            </div>
          </div>

          <div
            id="expenses"
            className="dashboard-card card-clickable"
            style={{ cursor: "pointer", borderColor: "var(--color-border)" }}
            onClick={() => window.location.href = "/farm-diary/expenses"}
          >
            <div className="dashboard-card-icon">
              <DollarSign size={20} />
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Farm Expenses</div>
              <div className="dashboard-card-text">{expenses.length} total expenses</div>
              <div className="dashboard-card-subtext">Track your farming costs</div>
            </div>
            <div className="dashboard-card-arrow">
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}