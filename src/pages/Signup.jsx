import React, { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContactModal from "../components/ContactModal";
import Footer from "../components/Footer";
import "./Cinema.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^\d{11}$/.test(phone);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSuccessMsg("");

    if (!validateEmail(email)) {
      setError("❌ Please enter a valid email address.");
      return;
    }
    if (!validatePhone(phoneNo)) {
      setError("❌ Phone number must be exactly 11 digits.");
      return;
    }

    try {
      await API.post("/users", { name, email, phoneNo, password });
      setSuccess("✅ Account created successfully!");
      setShowModal(true);

      // ✅ Clear input fields after successful signup
      setName("");
      setEmail("");
      setPhoneNo("");
      setPassword("");

    } catch (err) {
      if (err.response?.status === 409) {
        setError("❌ Email or phone number already exists.");
      } else {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  // ✅ Auto-close modal after 3 seconds of success
  useEffect(() => {
    if (showModal && success) {
      const timer = setTimeout(() => {
        setShowModal(false);
        setSuccess("");
        setSuccessMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showModal, success, navigate]);

  return (
    <div className="cinema-page">
      <Navbar isLoggedIn={isLoggedIn} onContactClick={() => setShowModal(true)} />

      <div className="signup-overlay">
        <div className="signup-card">
          <h2>Create Your Account ✨</h2>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          {successMsg && <p className="success">{successMsg}</p>}

          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign Up</button>
          </form>

          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/")} className="login-link">
              Login
            </span>
          </p>
        </div>
      </div>

      <ContactModal show={showModal} onClose={() => setShowModal(false)} onSuccess={setSuccessMsg} />
      <Footer />
    </div>
  );
};

export default Signup;
