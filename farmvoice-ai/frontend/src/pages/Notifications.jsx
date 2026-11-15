import { useState } from "react";
import {
  Bell,
  CloudRain,
  Sprout,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Trash2,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import "../styles/dashboard.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Heavy Rainfall Advisory Issued",
    desc: "IMD forecast predicts moderate to heavy rainfall over the next 48 hours in your taluk. Ensure appropriate drainage in standing crop plots.",
    category: "Weather",
    type: "warning",
    time: "2 hours ago",
    read: false,
    icon: CloudRain,
  },
  {
    id: 2,
    title: "Kharif Sowing Window Active",
    desc: "Optimal soil moisture levels detected for paddy and maize nursery preparation. Refer to the AI Assistant for regional seed treatment guidelines.",
    category: "Diary & Crops",
    type: "advisory",
    time: "Yesterday",
    read: false,
    icon: Sprout,
  },
  {
    id: 3,
    title: "PM-KISAN Installment Verification",
    desc: "Central DBT processing for the upcoming 18th PM-KISAN installment is underway. Ensure e-KYC and bank Aadhaar seeding are up to date.",
    category: "Schemes",
    type: "info",
    time: "2 days ago",
    read: true,
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Farm Diary Activity Reminder",
    desc: "You haven't logged any irrigation or fertilizer records in the last 7 days. Keep your Farm Diary current to receive tailored yield analysis.",
    category: "Diary & Crops",
    type: "info",
    time: "3 days ago",
    read: true,
    icon: Calendar,
  },
  {
    id: 5,
    title: "Pest Management Alert: Fall Armyworm",
    desc: "Localized pest scouting reports indicate potential presence in regional maize clusters. Inspect whorls and apply neem-based formulation if required.",
    category: "Weather",
    type: "warning",
    time: "5 days ago",
    read: true,
    icon: AlertTriangle,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("All");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.category === filter;
  });

  return (
    <div className="page notifications-page">
      <div className="page-header notif-header-row">
        <div>
          <h1 className="page-title">Farm Notifications & Advisories</h1>
          <p className="page-sub">
            Real-time agricultural updates, meteorological warnings, and scheme announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="btn-mark-all-read" onClick={markAllRead}>
            <Check size={16} />
            <span>Mark all as read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notif-filter-tabs">
        {["All", "Unread", "Weather", "Diary & Crops", "Schemes"].map((tab) => (
          <button
            key={tab}
            className={`notif-tab ${filter === tab ? "active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
            {tab === "Unread" && unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="notif-cards-list">
        {filtered.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className={`notif-item-card ${item.read ? "read" : "unread"} ${item.type}`}
            >
              <div className={`notif-icon-circle ${item.type}`}>
                <IconComp size={20} />
              </div>

              <div className="notif-content-wrap">
                <div className="notif-top-line">
                  <div className="notif-title-wrap">
                    <h3 className="notif-title">{item.title}</h3>
                    {!item.read && <span className="unread-dot" />}
                  </div>
                  <span className="notif-time">{item.time}</span>
                </div>

                <p className="notif-desc">{item.desc}</p>

                <div className="notif-bottom-row">
                  <span className="notif-category-tag">{item.category}</span>

                  <div className="notif-actions">
                    <button
                      className="btn-notif-action"
                      onClick={() => toggleRead(item.id)}
                      title={item.read ? "Mark as unread" : "Mark as read"}
                    >
                      {item.read ? "Mark as Unread" : "Mark as Read"}
                    </button>
                    <button
                      className="btn-notif-action delete"
                      onClick={() => deleteNotification(item.id)}
                      title="Dismiss notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No notifications in this view.</p>
        </div>
      )}
    </div>
  );
}
