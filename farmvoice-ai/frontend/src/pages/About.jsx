import { Sprout } from "lucide-react";
import "../styles/dashboard.css";

export default function About() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">About FarmVoice AI</h1>
        <p className="page-sub">
          Regional language AI assistant for farmers.
        </p>
      </div>

      <section className="feature-card">
        <div className="feature-icon"><Sprout size={20} /></div>
        <div>
          <p className="feature-title">Our Mission</p>
          <p className="feature-text">
            FarmVoice AI empowers farmers with an intelligent, voice-enabled
            assistant that understands regional languages. Get crop advice,
            weather forecasts, and farming guidance in your own language.
          </p>
        </div>
      </section>

      <div className="empty-state">
        <p>
          FarmVoice AI is built to bridge the technology gap for farmers across
          India. Learn more about our features by logging in to your dashboard.
        </p>
      </div>
    </div>
  );
}
