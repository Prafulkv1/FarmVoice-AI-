import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import FarmDiary from "./pages/FarmDiary";
import AIAssistant from "./pages/AIAssistant";
import MyFarm from "./pages/MyFarm";
import CropInfo from "./pages/CropInfo";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/components.css";
import "./styles/navbar.css";
import "./styles/login.css";
import "./styles/register.css";

export default function App() {
  const { checking } = useAuth();

  // While the HttpOnly JWT session is being verified against the backend,
  // show an attractive branded loader instead of a blank screen.
  if (checking) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner-ring" />
        <span className="auth-loading-text">Connecting to FarmVoice AI...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authenticated Farmer Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm-diary" element={<FarmDiary />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/my-farm" element={<MyFarm />} />
          <Route path="/crop-info" element={<CropInfo />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/government-schemes" element={<GovernmentSchemes />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
