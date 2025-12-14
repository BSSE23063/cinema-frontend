import React, { useState } from "react";
import API from "../api/api"; // axios instance with token
import "./AddAdmin.css";

export default function AddAdmin() {
  const [form, setForm] = useState({ name: "", email: "", phoneNo: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      // Only admins can create another admin (role_id=1)
      await API.post("/users", { ...form, role_id: 1 });
      setMessage("✅ Admin added successfully!");
      setForm({ name: "", email: "", phoneNo: "", password: "" });
    } catch (err) {
      if (err.response?.status === 409) {
        setError("❌ Email or phone number already exists. Try a different one.");
      } else {
        setError(err.response?.data?.message || "❌ Error adding admin");
      }
    }
  };

  return (
    <div className="add-admin-container">
      <div className="add-admin-card">
        <h2>🛡 Add New Admin</h2>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="text"
            name="name"
            placeholder="Admin Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phoneNo"
            placeholder="Phone Number"
            value={form.phoneNo}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Add Admin</button>
        </form>
      </div>
    </div>
  );
}
