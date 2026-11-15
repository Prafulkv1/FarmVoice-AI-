import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Bot,
  Cloud,
  FileText,
  UserCheck,
  BookOpen,
  Bell,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Sun,
  Droplets,
  ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../components/AuthProvider";
import "../styles/home.css";

const FEATURES = [
  {
    id: "ai-assistant",
    title: "Multilingual AI Assistant",
    desc: "Get intelligent agricultural guidance, crop care tips, and pest control advice in 10+ regional Indian languages with voice input support.",
    icon: Bot,
    badge: "Voice & Text",
    path: "/ai-assistant",
  },
  {
    id: "weather",
    title: "Weather Updates",
    desc: "Localized agricultural weather forecasts, 7-day precipitation models, rainfall trend charts, and IMD advisory alerts for your exact taluk.",
    icon: Cloud,
    badge: "Real-time IMD",
    path: "/weather",
  },
  {
    id: "schemes",
    title: "Government Schemes",
    desc: "Explore government welfare schemes like PM-KISAN, PMFBY, and Soil Health Cards with eligibility criteria and direct application guidance.",
    icon: ShieldCheck,
    badge: "Subsidies & Grants",
    path: "/government-schemes",
  },
  {
    id: "profile",
    title: "Farmer Profile",
    desc: "Personalized profile management tracking your land size, soil category, irrigation setup, and crop preferences with 100% completion metrics.",
    icon: UserCheck,
    badge: "Personalized",
    path: "/profile",
  },
  {
    id: "diary",
    title: "Farm Diary",
    desc: "Digital farm ledger to log daily agricultural operations, sowing dates, fertilizer dosage, irrigation schedules, harvest yields, and costs.",
    icon: BookOpen,
    badge: "Farm Management",
    path: "/farm-diary",
  },
  {
    id: "notifications",
    title: "Smart Notifications",
    desc: "Timely alerts for weather anomalies, recommended sowing windows, fertilizer spray reminders, and upcoming agricultural scheme deadlines.",
    icon: Bell,
    badge: "Actionable Alerts",
    path: "/notifications",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Register as a Farmer",
    desc: "Quick, secure registration with your farm name, mobile number, and credentials to establish your digital farm identity.",
  },
  {
    number: "02",
    title: "Complete Your Farmer Profile",
    desc: "Provide your village, taluk, land size, soil type, and preferred regional language for hyper-localized insights.",
  },
  {
    number: "03",
    title: "Access Smart Farming Features",
    desc: "Query the voice AI assistant, monitor live micro-climate forecasts, and explore eligible government subsidies.",
  },
  {
    number: "04",
    title: "Manage Farm Information & Updates",
    desc: "Track cultivation progress in your digital Farm Diary and receive proactive reminders throughout the crop cycle.",
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: "", email: "", message: "" });
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section id="hero" className="hero-section">
        <div className="hero-bg-decoration">
          <div className="hero-glow-blob blob-1" />
          <div className="hero-glow-blob blob-2" />
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-pill">
                <Sparkles size={14} className="hero-badge-icon" />
                <span>Next-Gen Agricultural Platform</span>
              </span>
            </div>

            <h1 className="hero-title">
              Smart Farming Starts with <span className="highlight-text">FarmVoice AI</span>
            </h1>

            <p className="hero-description">
              Get weather updates, farming assistance, government scheme information
              and manage your farm activities – all in your preferred language.
            </p>

            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-hero-primary">
                  <span>Go to Farmer Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-hero-primary">
                    <span>Get Started</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn-hero-outline">
                    <span>Login</span>
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics / Trust Row */}
            <div className="hero-highlights-row">
              <div className="highlight-item">
                <span className="highlight-num">10+</span>
                <span className="highlight-lbl">Regional Languages</span>
              </div>
              <div className="highlight-divider" />
              <div className="highlight-item">
                <span className="highlight-num">100%</span>
                <span className="highlight-lbl">Free for Farmers</span>
              </div>
              <div className="highlight-divider" />
              <div className="highlight-item">
                <span className="highlight-num">Real-Time</span>
                <span className="highlight-lbl">Weather & Advisories</span>
              </div>
            </div>
          </div>

          {/* Hero Visual on Right Side */}
          <div className="hero-visual">
            <div className="hero-art-card">
              <div className="art-scenery">
                {/* Visual Countryside & Farmer SVG Scene */}
                <svg
                  viewBox="0 0 520 420"
                  className="farmland-svg"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#81C784" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#C8E6C9" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="fieldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2E7D32" />
                      <stop offset="100%" stopColor="#1B5E20" />
                    </linearGradient>
                    <linearGradient id="fieldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#43A047" />
                      <stop offset="100%" stopColor="#2E7D32" />
                    </linearGradient>
                    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FBC02D" />
                      <stop offset="100%" stopColor="#F57F17" />
                    </linearGradient>
                  </defs>

                  {/* Backdrop */}
                  <rect width="520" height="420" rx="24" fill="url(#skyGrad)" />

                  {/* Rising Sun */}
                  <circle cx="390" cy="110" r="44" fill="url(#sunGrad)" opacity="0.9" />

                  {/* Rolling Farmland Hills */}
                  <path
                    d="M-20 280 Q 120 210, 280 260 T 540 230 L 540 420 L -20 420 Z"
                    fill="url(#fieldGrad2)"
                    opacity="0.8"
                  />
                  <path
                    d="M-20 320 Q 160 270, 320 310 T 540 290 L 540 420 L -20 420 Z"
                    fill="url(#fieldGrad1)"
                  />

                  {/* Furrow Lines */}
                  <path
                    d="M 60 360 Q 200 340 380 370"
                    stroke="#E8F5E9"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity="0.5"
                  />
                  <path
                    d="M 30 395 Q 220 380 440 405"
                    stroke="#E8F5E9"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity="0.5"
                  />

                  {/* Stylized Farmer with Smartphone Silhouette & Device */}
                  <g transform="translate(190, 140)">
                    {/* Shadow */}
                    <ellipse cx="60" cy="220" rx="42" ry="12" fill="#0E2314" opacity="0.25" />
                    {/* Legs */}
                    <path d="M48 160 L44 220 M72 160 L76 220" stroke="#122518" strokeWidth="8" strokeLinecap="round" />
                    {/* Torso */}
                    <path d="M42 90 L78 90 L72 165 L48 165 Z" fill="#2E7D32" rx="4" />
                    {/* Head & Farmer Hat */}
                    <circle cx="60" cy="62" r="16" fill="#F0C294" />
                    {/* Straw Hat */}
                    <ellipse cx="60" cy="54" rx="34" ry="8" fill="#FBC02D" />
                    <path d="M44 54 C44 42 76 42 76 54 Z" fill="#E65100" />
                    {/* Arms holding smartphone */}
                    <path d="M44 95 Q 36 125 54 135" stroke="#2E7D32" strokeWidth="7" strokeLinecap="round" />
                    <path d="M76 95 Q 84 125 66 135" stroke="#2E7D32" strokeWidth="7" strokeLinecap="round" />
                    {/* Smartphone glowing */}
                    <rect x="52" y="125" width="16" height="26" rx="3" fill="#1F2D24" stroke="#66BB6A" strokeWidth="1.5" />
                    <rect x="55" y="129" width="10" height="15" rx="1" fill="#81C784" />
                    {/* Voice wave signals from phone */}
                    <path d="M72 128 Q 78 132 72 138" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
                    <path d="M76 124 Q 84 132 76 142" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </svg>

                {/* Floating Smart Badge 1: Live Weather */}
                <div className="floating-badge badge-weather">
                  <div className="badge-icon-wrap weather-icon-bg">
                    <Sun size={18} className="badge-icon" />
                  </div>
                  <div className="badge-text-group">
                    <span className="badge-small-lbl">Village Weather</span>
                    <span className="badge-main-val">28°C · Sunny & Optimal</span>
                  </div>
                </div>

                {/* Floating Smart Badge 2: AI Voice Query */}
                <div className="floating-badge badge-ai">
                  <div className="badge-icon-wrap ai-icon-bg">
                    <Bot size={18} className="badge-icon" />
                  </div>
                  <div className="badge-text-group">
                    <span className="badge-small-lbl">Voice Assistance</span>
                    <span className="badge-main-val">10 Regional Languages</span>
                  </div>
                </div>

                {/* Floating Smart Badge 3: Scheme Eligibility */}
                <div className="floating-badge badge-scheme">
                  <div className="badge-icon-wrap scheme-icon-bg">
                    <ShieldCheck size={18} className="badge-icon" />
                  </div>
                  <div className="badge-text-group">
                    <span className="badge-small-lbl">Govt Schemes</span>
                    <span className="badge-main-val">PM-KISAN Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURES SECTION
          ========================================================================= */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header-center">
            <div className="section-tag">
              <Sprout size={14} />
              <span>Core Platform Features</span>
            </div>
            <h2 className="section-heading">Everything You Need for Smarter Farming</h2>
            <p className="section-subheading">
              Built specifically for Indian farmers to simplify daily decision-making,
              boost crop yields, and stay ahead of weather and market risks.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div key={feat.id} className="feature-card-modern">
                  <div className="card-top-row">
                    <div className="feature-icon-bubble">
                      <IconComp size={24} />
                    </div>
                    <span className="feature-pill-badge">{feat.badge}</span>
                  </div>
                  <h3 className="feature-card-title">{feat.title}</h3>
                  <p className="feature-card-desc">{feat.desc}</p>
                  <div className="feature-card-footer">
                    <Link
                      to={isAuthenticated ? feat.path : "/login"}
                      className="feature-link-btn"
                    >
                      <span>Explore Feature</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ABOUT SECTION
          ========================================================================= */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="about-layout">
            <div className="about-image-pane">
              <div className="about-art-frame">
                <div className="art-frame-inner">
                  <div className="about-stat-overlay">
                    <Sprout size={32} className="about-stat-icon" />
                    <div>
                      <div className="stat-large">100% Native</div>
                      <div className="stat-label">Tailored for Indian Agriculture</div>
                    </div>
                  </div>
                  <div className="about-scene-graphic">
                    <div className="scene-circle circle-1" />
                    <div className="scene-circle circle-2" />
                    <div className="scene-badge-leaf">
                      <Languages size={24} />
                      <span>Multilingual AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-content-pane">
              <div className="section-tag">
                <Sprout size={14} />
                <span>About FarmVoice AI</span>
              </div>
              <h2 className="section-heading">
                Bridging Technology & Tradition for Modern Agriculture
              </h2>
              <p className="about-body-text">
                FarmVoice AI is an intelligent agricultural technology companion
                designed to empower farmers with timely, actionable agricultural insights.
                We bridge the linguistic and digital divide by offering AI voice and
                text support in regional Indian languages.
              </p>
              <p className="about-body-text">
                From micro-level weather forecasts and crop stage tracking in your
                personal Farm Diary to verified government welfare schemes, FarmVoice AI
                consolidates your farm management into a single, reliable hub.
              </p>

              <div className="about-checklist">
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Regional-language first interface for effortless accessibility</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Integrated meteorological alerts and rain prediction models</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Digital ledger to record crops, harvests, fertilizers, and costs</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Comprehensive profiles customized for your specific land & soil</span>
                </div>
              </div>

              <div className="about-cta-row">
                <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-hero-primary">
                  <span>Join FarmVoice AI Today</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS SECTION
          ========================================================================= */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header-center">
            <div className="section-tag">
              <Calendar size={14} />
              <span>Simple Workflow</span>
            </div>
            <h2 className="section-heading">How FarmVoice AI Works</h2>
            <p className="section-subheading">
              Four straightforward steps to unlock personalized farming guidance.
            </p>
          </div>

          <div className="steps-grid">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="step-card">
                <div className="step-number-wrap">
                  <span className="step-number">{step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {idx < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTACT SECTION
          ========================================================================= */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="contact-card-wrapper">
            <div className="contact-info-side">
              <div className="section-tag contact-tag">
                <Mail size={14} />
                <span>Contact FarmVoice AI</span>
              </div>
              <h2 className="contact-heading">We&rsquo;re Here to Support Your Farming Journey</h2>
              <p className="contact-desc">
                Have questions about using FarmVoice AI, need assistance with your
                profile, or want to report an issue? Reach out to our dedicated support team.
              </p>

              <div className="contact-details-list">
                <div className="contact-detail-item">
                  <div className="contact-icon-box">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="contact-lbl">Email Support</div>
                    <a href="mailto:support@farmvoice.ai" className="contact-val">
                      support@farmvoice.ai
                    </a>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-icon-box">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="contact-lbl">Farmer Helpline</div>
                    <a href="tel:+919000000000" className="contact-val">
                      +91-90000-00000
                    </a>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-icon-box">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="contact-lbl">Dedicated Support</div>
                    <span className="contact-val">
                      Pan-India Farmer Assistance &bull; Regional Support Desks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-side">
              {contactSubmitted ? (
                <div className="contact-success-state">
                  <CheckCircle2 size={48} className="contact-success-icon" />
                  <h3>Message Sent!</h3>
                  <p>
                    Thank you for reaching out. The FarmVoice AI support team has received
                    your message and will respond shortly to support@farmvoice.ai.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="contact-form" noValidate>
                  <h3 className="form-card-title">Send Us a Message</h3>
                  <div className="form-field-group">
                    <label className="contact-label">Your Name</label>
                    <input
                      type="text"
                      className="contact-input"
                      placeholder="e.g. Ramesh Patel"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="contact-label">Email or Phone Number</label>
                    <input
                      type="text"
                      className="contact-input"
                      placeholder="e.g. farmer@gmail.com or 9876543210"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="contact-label">Message / Inquiry</label>
                    <textarea
                      className="contact-textarea"
                      rows={4}
                      placeholder="Tell us how we can assist you..."
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                    />
                  </div>
                  <button type="submit" className="btn-contact-submit">
                    <span>Send Message</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-top-row">
            <div className="footer-brand-pane">
              <div className="footer-brand">
                <div className="brand-leaf-badge">
                  <Sprout size={22} />
                </div>
                <span className="brand-name">
                  FarmVoice <span className="brand-accent">AI</span>
                </span>
              </div>
              <p className="footer-brand-desc">
                Empowering Indian farmers through voice-enabled regional AI assistance,
                hyper-local meteorological updates, government schemes, and digital farm records.
              </p>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4 className="footer-col-title">Navigation</h4>
                <a href="#hero" className="footer-link">Home</a>
                <a href="#features" className="footer-link">Features</a>
                <a href="#about" className="footer-link">About Us</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
                <a href="#contact" className="footer-link">Contact</a>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Farm Modules</h4>
                <Link to="/ai-assistant" className="footer-link">AI Assistant</Link>
                <Link to="/weather" className="footer-link">Weather Updates</Link>
                <Link to="/government-schemes" className="footer-link">Govt Schemes</Link>
                <Link to="/farm-diary" className="footer-link">Farm Diary</Link>
                <Link to="/profile" className="footer-link">Farmer Profile</Link>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Farmer Portal</h4>
                <Link to="/login" className="footer-link">Farmer Login</Link>
                <Link to="/register" className="footer-link">Create Account</Link>
                <Link to="/dashboard" className="footer-link">Dashboard</Link>
                <a href="mailto:support@farmvoice.ai" className="footer-link">support@farmvoice.ai</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div className="footer-copy">
              &copy; {new Date().getFullYear()} FarmVoice AI. All rights reserved. Built for Indian Agriculture.
            </div>
            <div className="footer-tagline">
              <span>🌾 Precision &bull; Multilingual &bull; Sustainable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
