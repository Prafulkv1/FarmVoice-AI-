import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "../styles/dashboard.css";

export default function DashboardCard({ icon: Icon, title, description, placeholder, href }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <article
      className="dashboard-card"
      onClick={handleClick}
      role="link"
      aria-roledescription="card"
      style={{ cursor: href ? "pointer" : "default" }}
    >
      <div className="card-icon">{Icon ? <Icon size={24} /> : null}</div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        <p className="card-placeholder">{placeholder}</p>
      </div>
      <div className="card-footer">
        <span>View More</span>
        <ArrowRight size={16} />
      </div>
    </article>
  );
}
