import { Sprout, CheckCircle2, ShieldCheck, Languages, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";
import "../styles/home.css";

export default function About() {
  return (
    <div className="home-page">
      <Navbar />

      <div className="section-container" style={{ padding: "4rem 1.5rem 5rem" }}>
        <div className="section-header-center">
          <div className="section-tag">
            <Sprout size={14} />
            <span>Empowering Indian Farmers</span>
          </div>
          <h1 className="section-heading">About FarmVoice AI</h1>
          <p className="section-subheading">
            Next-generation agricultural technology built to bridge linguistic and digital divides for farming communities across India.
          </p>
        </div>

        <div className="about-layout" style={{ marginTop: "2rem" }}>
          <div className="about-image-pane">
            <div className="about-art-frame">
              <div className="art-frame-inner">
                <div className="about-stat-overlay">
                  <Sprout size={32} className="about-stat-icon" />
                  <div>
                    <div className="stat-large">Precision Agriculture</div>
                    <div className="stat-label">Multilingual &bull; Micro-Climate</div>
                  </div>
                </div>
                <div className="about-scene-graphic">
                  <div className="scene-circle circle-1" />
                  <div className="scene-circle circle-2" />
                  <div className="scene-badge-leaf">
                    <Languages size={28} />
                    <span>10+ Regional Languages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="about-content-pane">
            <h2 className="section-heading" style={{ fontSize: "1.85rem" }}>Our Mission &amp; Purpose</h2>
            <p className="about-body-text">
              FarmVoice AI empowers farmers with an intelligent, voice-enabled
              assistant that understands regional languages. We provide hyper-localized
              weather forecasts, crop stage recommendations, and direct access to
              verified government welfare schemes.
            </p>
            <p className="about-body-text">
              By combining meteorological data with traditional agronomic practices,
              our platform equips farmers with timely decision-support to reduce
              cultivation risk, optimize input costs, and protect yields.
            </p>

            <div className="about-checklist">
              <div className="check-item">
                <CheckCircle2 size={18} className="check-icon" />
                <span>Voice input in Hindi, Telugu, Tamil, Bengali, Marathi, and more</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={18} className="check-icon" />
                <span>Localized 7-day weather predictions and IMD alerts</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={18} className="check-icon" />
                <span>Digital Farm Diary tracking crops, fertilizers, irrigation, and harvest</span>
              </div>
              <div className="check-item">
                <CheckCircle2 size={18} className="check-icon" />
                <span>Up-to-date government schemes like PM-KISAN, PMFBY, and KCC</span>
              </div>
            </div>

            <div className="about-cta-row" style={{ marginTop: "1rem" }}>
              <Link to="/register" className="btn-hero-primary">
                <span>Register as a Farmer</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
