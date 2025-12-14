import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ isLoggedIn, onContactClick }) => {
  const navigate = useNavigate();

  const handleMoviesClick = () => {
    if (!isLoggedIn) {
      alert("⚠️ Please log in first!");
      return;
    }
    navigate("/movies");
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate("/")}>
        🎬 CineVerse
      </div>
      <ul className="nav-links">
        <li onClick={() => navigate("/")}>Home</li>
        <li onClick={handleMoviesClick}>Movies</li>
        <li onClick={onContactClick}>Contact</li>
        {isLoggedIn ? (
          <li onClick={() => navigate("/dashboard")}>Dashboard</li>
        ) : (
          <li onClick={() => navigate("/signup")}>Sign Up</li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
