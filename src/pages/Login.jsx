import React, { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ContactModal from "../components/ContactModal";
import Footer from "../components/Footer";
import "./Cinema.css";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ name, password });
      setIsLoggedIn(true);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="cinema-page">
      <Navbar isLoggedIn={isLoggedIn} onContactClick={() => setShowModal(true)} />

      <div className="login-overlay">
        <div className="login-box">
          <h2>Welcome Back 🍿</h2>
          <p className="subtitle">Log in to book your next show!</p>
          {error && <p className="error-msg">{error}</p>}
          {successMsg && <p className="success-msg">{successMsg}</p>}

          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Username" value={name} onChange={e => setName(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>

          <p className="signup-text">
            Don’t have an account? <span onClick={() => navigate("/signup")}>Sign Up</span>
          </p>
        </div>
      </div>

      <ContactModal show={showModal} onClose={() => setShowModal(false)} onSuccess={setSuccessMsg} />
      <Footer />
    </div>
  );
};

export default Login;
