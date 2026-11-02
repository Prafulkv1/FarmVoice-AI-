import { Sprout } from "lucide-react";
import "../styles/dashboard.css";

export default function Contact() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-sub">
          Get in touch with the FarmVoice AI team.
        </p>
      </div>

      <section className="feature-card">
        <div className="feature-icon"><Sprout size={20} /></div>
        <div>
          <p className="feature-title">Reach Out</p>
          <p className="feature-text">
            Have questions, feedback, or need support? We&rsquo;d love to hear
            from you. Contact the FarmVoice AI team and we&rsquo;ll respond as
            soon as possible.
          </p>
        </div>
      </section>

      <div className="empty-state">
        <p>
          Email: support@farmvoice.ai &bull; Phone: +91-90000-00000<br />
          For feature requests or bug reports, please log in and use the
          dashboard notifications section.
        </p>
      </div>
    </div>
  );
}
