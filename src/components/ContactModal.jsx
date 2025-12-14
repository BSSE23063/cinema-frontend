import React from "react";
 // make sure you keep your cinematic styles

const ContactModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Contact Us ✉️</h3>
        <p>📧 Email:{" "}
          <a href="mailto:umairsafdar722@gmail.com" className="contact-link">
            umairsafdar722@gmail.com
          </a>
        </p>
        <p>📞 Phone:{" "}
          <a href="tel:+923366130340" className="contact-link">
            +92 336 6130340
          </a>
        </p>
        <button className="cancel-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ContactModal;
