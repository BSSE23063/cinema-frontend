import React from "react";

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <p>📍 Lahore, Pakistan</p>
      <p>📞 +92 336 6130340</p>
      <p>✉️ support@cineverse.com</p>
    </div>
    <p className="copyright">
      © {new Date().getFullYear()} CineVerse. All Rights Reserved.
    </p>
  </footer>
);

export default Footer;
