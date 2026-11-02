import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import Footer from "./Footer";

import "../styles/dashboard.css";

/**
 * Dashboard shell layout.
 *
 * Structure:
 *   - Full-width green navigation bar at the top
 *   - White sidebar on the left
 *   - Main dashboard content beside the sidebar
 *   - White footer at the bottom
 *
 * The layout is only reachable through ProtectedRoute, so every page
 * inside it requires authentication.
 */
export default function DashboardLayout() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <div className="dashboard-shell">
        <aside className="sidebar-container">
          <Sidebar />
        </aside>
        <div className="dashboard-body">
          <main className="dashboard-main">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
