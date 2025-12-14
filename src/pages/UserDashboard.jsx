import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import UserBookings from "./UserBookings";
import "./UserDashboard.css";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");
  const navigate = useNavigate();
  
  const tabs = [{ id: "bookings", label: "Manage Bookings", icon: "🎟" }];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      localStorage.removeItem("token");
      localStorage.removeItem("id");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("id");
      navigate("/");
    }
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "bookings":
        return <UserBookings />;
      default:
        return <UserBookings />;
    }
  };

  return (
    <div className="user-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="header-icon">👤</span>
          <div className="header-text">
            <div className="header-title">User Panel</div>
            <div className="header-subtitle">Movie Booking Dashboard</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {tabs.map((tab) => (
              <li
                key={tab.id}
                className={`sidebar-item ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="icon">{tab.icon}</span>
                <span className="label">{tab.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="logout-section">
          <div className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🔓</span>
            <span className="logout-text">Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <h1>Welcome to Your Dashboard</h1>
          <p>Manage your movie bookings and enjoy the cinematic experience</p>
        </div>

        <div className="tab-content">{renderTabContent()}</div>
      </main>
    </div>
  );
}