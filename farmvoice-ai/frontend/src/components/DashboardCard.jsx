import { ArrowRight } from "lucide-react";
import "../styles/dashboard.css";

export default function DashboardCard({ icon: Icon, title, description, placeholder, href }) {
  return (
    <article className="dashboard-card" data-href={href} onClick={() => href && window.location.assign(href)}>
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
