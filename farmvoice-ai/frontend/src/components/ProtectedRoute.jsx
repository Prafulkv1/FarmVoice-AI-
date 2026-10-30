import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * Renders children only when the user is authenticated.
 * While the session is still being checked, renders nothing (brief flash).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAuth();
  if (checking) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
