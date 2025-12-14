// src/pages/Halls.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./Halls.css";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Halls Component
export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [newHall, setNewHall] = useState({
    hall_no: "",
    category: "",
    price: "",
  });
  const [editingHall, setEditingHall] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  // Fetch all halls
  const fetchHalls = async () => {
    setLoading(true);
    try {
      const res = await api.get("/halls");
      setHalls(res.data);
    } catch (error) {
      setError("Failed to fetch halls");
      console.error("Error fetching halls:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new hall
  const addHall = async () => {
    if (!newHall.hall_no || !newHall.category || !newHall.price) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hall_no: newHall.hall_no,
        category: newHall.category,
        price: parseFloat(newHall.price),
      };

      await api.post("/halls", payload);
      setNewHall({ hall_no: "", category: "", price: "" });
      fetchHalls();
      setError(null);
    } catch (error) {
      setError("Failed to add hall");
      console.error("Error adding hall:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update hall
  const updateHall = async () => {
    if (!editingHall) return;

    setLoading(true);
    try {
      const payload = {
        hall_no: editingHall.hall_no,
        category: editingHall.category,
        price: parseFloat(editingHall.price),
      };

      await api.patch(`/halls/${editingHall.id}`, payload);
      setEditingHall(null);
      setIsModalOpen(false);
      fetchHalls();
      setError(null);
    } catch (error) {
      setError("Failed to update hall");
      console.error("Error updating hall:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete hall
  const deleteHall = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hall?")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/halls/${id}`);
      fetchHalls();
      setError(null);
    } catch (error) {
      setError("Failed to delete hall");
      console.error("Error deleting hall:", error);
    } finally {
      setLoading(false);
    }
  };

  // Start editing hall
  const startEditHall = (hall) => {
    setEditingHall({ ...hall });
    setIsModalOpen(true);
    setError(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
    setError(null);
  };

  return (
    <ErrorBoundary>
      <div className="card">
        <h2>🎭 Manage Halls</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Add Hall Form */}
        <div className="input-group">
          <input
            type="text"
            placeholder="Hall No"
            value={newHall.hall_no}
            onChange={(e) => setNewHall({ ...newHall, hall_no: e.target.value })}
          />
          <input
            type="text"
            placeholder="Category"
            value={newHall.category}
            onChange={(e) => setNewHall({ ...newHall, category: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={newHall.price}
            onChange={(e) => setNewHall({ ...newHall, price: e.target.value })}
          />
          <button onClick={addHall} disabled={loading}>
            {loading ? "⏳" : editingHall ? "💾 Update" : "➕ Add"}
          </button>
        </div>

        {/* Halls List */}
        <ul className="list">
          {halls.map((hall) => (
            <li key={hall.id}>
              <span>
                {hall.hall_no} | {hall.category} | {hall.price}<small>Rs</small>
              </span>
              <div>
                <button onClick={() => startEditHall(hall)}>✏️ Edit</button>
                <button className="delete" onClick={() => deleteHall(hall.id)}>
                  ❌ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Edit Modal */}
        {isModalOpen && editingHall && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Hall</h3>
                <button className="close-btn" onClick={closeModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Hall No"
                    value={editingHall.hall_no}
                    onChange={(e) => setEditingHall({ ...editingHall, hall_no: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={editingHall.category}
                    onChange={(e) => setEditingHall({ ...editingHall, category: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={editingHall.price}
                    onChange={(e) => setEditingHall({ ...editingHall, price: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button onClick={updateHall} disabled={loading}>
                    {loading ? "⏳ Updating..." : "💾 Update Hall"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}