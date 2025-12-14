import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Halls from "./Halls";
import Movies from "./Movies";
import Shows from "./Shows";
import FoodInventory from "./FoodInventory";
import Bookings from "./Bookings";
import AddAdmin from "./AddAdmin"; 
import FoodOrder from "./FoodOrder";
import "./AdminDashboard.css";
import api from "../api/api";

// Error Boundary Component for Admin Dashboard
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>⚙️ Something went wrong with Admin Dashboard</h3>
            <p>We encountered an error while loading the admin panel.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="retry-btn"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary for individual tabs
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`${this.props.tabName} Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-error-boundary">
          <div className="tab-error-content">
            <h4>⚠️ {this.props.tabName} Error</h4>
            <p>Something went wrong with this section.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="tab-retry-btn"
            >
              🔄 Reload Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("halls");
  const navigate = useNavigate();

  const tabs = [
    { id: "halls", label: "Manage Halls", icon: "🏛" },
    { id: "movies", label: "Manage Movies", icon: "🎬" },
    { id: "shows", label: "Manage Shows", icon: "🎭" },
    { id: "food", label: "Manage Food", icon: "🍔" },
    { id: "bookings", label: "Manage Bookings", icon: "🎟" },
    { id: "addAdmin", label: "Add Admin", icon: "🛡" },
    { id: "foodOrder", label: "Food Orders", icon: "🍽️" },
  ];

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "halls":
        return (
          <TabErrorBoundary tabName="Manage Halls">
            <Halls />
          </TabErrorBoundary>
        );
      case "movies":
        return (
          <TabErrorBoundary tabName="Manage Movies">
            <Movies />
          </TabErrorBoundary>
        );
      case "shows":
        return (
          <TabErrorBoundary tabName="Manage Shows">
            <Shows />
          </TabErrorBoundary>
        );
      case "food":
        return (
          <TabErrorBoundary tabName="Manage Food">
            <FoodInventory />
          </TabErrorBoundary>
        );
      case "bookings":
        return (
          <TabErrorBoundary tabName="Manage Bookings">
            <Bookings />
          </TabErrorBoundary>
        );
      case "addAdmin":
        return (
          <TabErrorBoundary tabName="Add Admin">
            <AddAdmin />
          </TabErrorBoundary>
        );
      case "foodOrder":
        return (
          <TabErrorBoundary tabName="Food Orders">
            <FoodOrder />
          </TabErrorBoundary>
        );
      default:
        return (
          <TabErrorBoundary tabName="Manage Halls">
            <Halls />
          </TabErrorBoundary>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="admin-dashboard">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">Admin Panel</div>
          <nav className="sidebar-nav">
            <ul>
              {tabs.map((tab) => (
                <li
                  key={tab.id}
                  className={`sidebar-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="icon">{tab.icon}</span>
                  <span className="label">{tab.label}</span>
                </li>
              ))}
            </ul>

            <div className="logout-button" onClick={handleLogout}>
              🔓 Logout
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderActiveTab()}
        </main>
      </div>
    </ErrorBoundary>
  );
}