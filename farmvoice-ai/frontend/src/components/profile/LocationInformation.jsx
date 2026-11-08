import FormInput from "../FormInput";
import { MapPin, Building2, Home } from "lucide-react";
import "../../styles/dashboard.css";

const FIELDS = [
  {
    key: "state",
    label: "State",
    placeholder: "Enter your state",
    icon: Home,
  },
  {
    key: "district",
    label: "District",
    placeholder: "Enter your district",
    icon: Building2,
  },
  {
    key: "taluk",
    label: "Taluk",
    placeholder: "Enter your taluk",
    icon: Home,
  },
  {
    key: "village",
    label: "Village",
    placeholder: "Enter your village",
    icon: Home,
  },
  {
    key: "pin_code",
    label: "PIN Code",
    placeholder: "6-digit PIN code",
    icon: MapPin,
  },
];

export default function LocationInformation({ value, onChange, error }) {
  return (
    <section className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-icon">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="profile-section-title">Location Information</h3>
          <p className="profile-section-desc">
            Where your farm is located. This helps us localize language,
            weather and scheme information.
          </p>
        </div>
      </div>

      <div className="profile-section-body">
        <div className="profile-form-grid">
          {FIELDS.map((field) => (
            <FormInput
              key={field.key}
              id={field.key}
              label={field.label}
              placeholder={field.placeholder}
              icon={null}
              value={value[field.key] || ""}
              onChange={(v) => onChange(field.key, v)}
              error={error[field.key]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
