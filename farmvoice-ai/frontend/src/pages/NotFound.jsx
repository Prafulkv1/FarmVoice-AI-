import { Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-card">
        <AlertCircle size={48} />
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <button className="btn-home" onClick={() => window.location.assign("/login")}>
          Go to Login
        </button>
      </div>
    </div>
  );
}
