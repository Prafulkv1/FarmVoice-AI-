import FormInput from "../FormInput";
import { User } from "lucide-react";
import "../../styles/dashboard.css";

export default function PersonalInformation({
  value,
  onChange,
  error,
  email,
  username,
  farmerName,
}) {
  return (
    <section className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-icon">
          <User size={20} />
        </div>
        <div>
          <h3 className="profile-section-title">Personal Information</h3>
          <p className="profile-section-desc">
            Your name, email and mobile number are taken from your registered
            account. Email and username cannot be changed here.
          </p>
        </div>
      </div>

      <div className="profile-section-body">
        <FormInput
          id="farmer_name"
          label="Farmer Name"
          placeholder="Enter your full name"
          icon="user"
          value={value.full_name || farmerName || ""}
          onChange={(v) => onChange("full_name", v)}
          error={error.full_name}
        />
        <FormInput
          id="username"
          label="Username"
          placeholder=""
          icon="user"
          value={username || ""}
          onChange={() => {}}
          error={null}
          readOnly
        />
        <FormInput
          id="email"
          label="Email Address"
          placeholder=""
          icon="mail"
          value={email || ""}
          onChange={() => {}}
          error={null}
          readOnly
        />
        <FormInput
          id="mobile_number"
          label="Mobile Number"
          placeholder="Enter your 10-digit mobile number"
          icon="phone"
          value={value.mobile_number || ""}
          onChange={(v) => onChange("mobile_number", v)}
          error={error.mobile_number}
        />
        <p className="profile-section-note">
          Date of birth and gender are not captured during registration, so
          they are not available to edit yet. These fields will be supported in
          a future update.
        </p>
      </div>
    </section>
  );
}
