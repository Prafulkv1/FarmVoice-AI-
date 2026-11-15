import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Sprout } from "lucide-react";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";
import "../styles/home.css";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", email: "", message: "" });
    }, 4000);
  };

  return (
    <div className="home-page">
      <Navbar />

      <div className="section-container" style={{ padding: "4rem 1.5rem 5rem" }}>
        <div className="section-header-center">
          <div className="section-tag">
            <Mail size={14} />
            <span>Farmer Helpdesk</span>
          </div>
          <h1 className="section-heading">Contact FarmVoice AI</h1>
          <p className="section-subheading">
            Get in touch with the FarmVoice AI team for assistance, feedback, or inquiries.
          </p>
        </div>

        <div className="contact-card-wrapper" style={{ marginTop: "2rem" }}>
          <div className="contact-info-side">
            <h2 className="contact-heading">Reach Out to Our Team</h2>
            <p className="contact-desc">
              Have questions, feedback, or need technical support? Contact the FarmVoice AI team and we&rsquo;ll respond as soon as possible.
            </p>

            <div className="contact-details-list">
              <div className="contact-detail-item">
                <div className="contact-icon-box">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="contact-lbl">Email Address</div>
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
                  <div className="contact-lbl">Phone Number</div>
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
                  <div className="contact-lbl">Dashboard Support</div>
                  <span className="contact-val">
                    For feature requests or bug reports, please log in and use the dashboard notifications section.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-side">
            {submitted ? (
              <div className="contact-success-state">
                <CheckCircle2 size={48} className="contact-success-icon" />
                <h3>Thank You!</h3>
                <p>
                  Your message has been received. Our agricultural support team will review your inquiry and follow up shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <h3 className="form-card-title">Send a Direct Message</h3>
                <div className="form-field-group">
                  <label className="contact-label">Farmer / User Name</label>
                  <input
                    type="text"
                    className="contact-input"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="contact-label">Email or Mobile Number</label>
                  <input
                    type="text"
                    className="contact-input"
                    placeholder="e.g. farmer@gmail.com or 9876543210"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="contact-label">Message Details</label>
                  <textarea
                    className="contact-textarea"
                    rows={4}
                    placeholder="How can our team help your farm?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-contact-submit">
                  <span>Submit Inquiry</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
