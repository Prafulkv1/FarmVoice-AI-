import { useAuth } from "../components/AuthProvider";
import { User, Mail, Phone, Building2, Calendar, Clock } from "lucide-react";
import "../styles/dashboard.css";

const fields = [
  {
    label: "Full Name",
    icon: User,
    value: (u) => u.username || "—",
  },
  {
    label: "Farm Name",
    icon: Building2,
    value: (u) => u.farm_name || "—",
  },
  {
    label: "Email",
    icon: Mail,
    value: (u) => u.email || "—",
  },
  {
    label: "Mobile Number",
    icon: Phone,
    value: (u) => u.mobile_number || "—",
  },
  {
    label: "Farmer ID",
    icon: Calendar,
    value: (u) => (u.farmer_id != null ? `#${u.farmer_id}` : "—"),
  },
  {
    label: "Member Since",
    icon: Clock,
    value: (u) => {
      if (!u.created_at) return "—";
      return new Date(u.created_at).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
  },
];

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-sub">Your farmer account details.</p>
      </div>

      {user ? (
        <section className="profile-card">
          {fields.map((field) => (
            <div key={field.label} className="profile-field">
              <div className="profile-field-icon">
                <field.icon size={18} />
              </div>
              <div className="profile-field-body">
                <div className="profile-field-label">{field.label}</div>
                <div className="profile-field-value">
                  {field.value(user)}
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p>Profile information is not available at the moment.</p>
        </div>
      )}

      <div className="empty-state">
        <p>
          Profile updates are not yet connected to the backend. Account details
          above reflect your latest backend session.
        </p>
      </div>
    </div>
  );
}
