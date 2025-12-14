// src/pages/Bookings.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import "./Bookings.css";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Bookings Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🎬 Something went wrong with Bookings</h3>
            <p>We encountered an error while processing your booking.</p>
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

const initialBookingData = {
  selectedShowKey: "",
  ticket_quantity: 1,
};

const initialPaymentData = {
  card_number: "",
  expiry: "",
  cvv: "",
};

const initialSearchData = {
  name: "",
  phone: "",
};

// Main Bookings Component
export default function Bookings() {
  const [shows, setShows] = useState([]);
  const [formData, setFormData] = useState(initialBookingData);
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [searchData, setSearchData] = useState(initialSearchData);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState("");

  const SHOWS_API_URL = "/shows";
  const BOOKINGS_API_URL = "/bookings";
  const PAYMENTS_API_URL = "/payments";

  const userId = Number(localStorage.getItem("id")) || null;

  const fetchShows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(SHOWS_API_URL);
      setShows(res.data);
    } catch (err) {
      console.error("Error fetching shows:", err);
      setError("Failed to load shows. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  // Auto remove success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const showsWithKeys = shows.map((s) => ({
    ...s,
    showKey: `${s.movie.id}|${s.hall.id}|${
      s.start_time.split("T")[0]
    }|${s.start_time.split("T")[1].slice(0, 5)}`,
  }));

  // Filter shows based on search query
  const filteredShows = showsWithKeys.filter(show => {
    if (!movieSearchQuery.trim()) return true;
    
    const query = movieSearchQuery.toLowerCase();
    const movieName = (show.movie.title || show.movie.name).toLowerCase();
    const movieGenre = show.movie.genre?.toLowerCase() || '';
    const movieDescription = show.movie.description?.toLowerCase() || '';
    
    return (
      movieName.includes(query) ||
      movieGenre.includes(query) ||
      movieDescription.includes(query)
    );
  });

  const groupedShows = filteredShows.reduce((acc, show) => {
    const title = show.movie.title || show.movie.name;
    if (!acc[title]) acc[title] = [];
    acc[title].push(show);
    return acc;
  }, {});

  const selectedShow = showsWithKeys.find(
    (s) => s.showKey === formData.selectedShowKey
  );

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `http://localhost:3000${imageUrl}`;
    return `http://localhost:3000/${imageUrl}`;
  };

  // Handle show selection
  const handleShowSelection = (showKey) => {
    setFormData({ ...formData, selectedShowKey: showKey });
    setError(null);
    setSuccess(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const quantity = name === "ticket_quantity" ? Math.max(1, parseInt(value) || 1) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: quantity,
    }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === "card_number") {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
    
    // Format expiry date
    if (name === "expiry") {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
    
    // Format CVV
    if (name === "cvv") {
      const formattedValue = value.replace(/\D/g, '').slice(0, 3);
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Search bookings by name or phone
  const handleSearchBookings = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setError(null);

    if (!searchData.name && !searchData.phone) {
      setError("Please enter either name or phone number to search.");
      setSearchLoading(false);
      return;
    }

    try {
      const params = {};
      if (searchData.name) params.name = searchData.name;
      if (searchData.phone) params.phone = searchData.phone;

      const res = await api.get(BOOKINGS_API_URL, { params });
      setSearchResults(res.data);
      
      if (res.data.length === 0) {
        setSuccess("No bookings found matching your search criteria.");
      } else {
        setSuccess(`Found ${res.data.length} booking(s) matching your search.`);
      }
    } catch (err) {
      console.error("Error searching bookings:", err);
      setError("Failed to search bookings. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchData(initialSearchData);
    setSearchResults([]);
    setError(null);
    setSuccess(null);
  };

  // Payment validation
  const validatePayment = () => {
    const { card_number, expiry, cvv } = paymentData;
    
    const cleanCardNumber = card_number.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) return "Card number must be 16 digits.";
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Expiry must be in MM/YY format.";
    
    // Validate expiry date
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) return "Invalid expiry month.";
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return "Card has expired.";
    }
    
    if (!/^\d{3}$/.test(cvv)) return "CVV must be 3 digits.";
    
    return null;
  };

  const handleConfirmBooking = async () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      return setError("Please log in to book tickets.");
    }
    
    if (!formData.selectedShowKey) {
      return setError("Please select a show.");
    }
    
    if (formData.ticket_quantity <= 0) {
      return setError("Ticket quantity must be at least 1.");
    }

    // Check if selected show is still available
    const currentShow = showsWithKeys.find(s => s.showKey === formData.selectedShowKey);
    if (!currentShow) {
      return setError("Selected show is no longer available.");
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const paymentError = validatePayment();
    if (paymentError) {
      setLoading(false);
      return setError(paymentError);
    }

    // Extract show details
    const [movieId, hallId, date, time] = formData.selectedShowKey.split("|");

    try {
      // Step 1: Create booking first
      const bookingPayload = {
        date,
        time,
        ticket_quantity: formData.ticket_quantity,
        user_id: userId,
        movie_id: Number(movieId),
        hall_id: Number(hallId),
      };
      
      const bookingRes = await api.post(BOOKINGS_API_URL, bookingPayload);
      const bookingId = bookingRes.data.id;

      // Step 2: Create payment using your required JSON format
      const ticketPrice = selectedShow?.hall?.price || 100;
      const paymentPayload = {
        booking_id: bookingId,
        amount: ticketPrice * formData.ticket_quantity,
        card_number: paymentData.card_number.replace(/\s/g, ''),
        expiry: paymentData.expiry,
        cvv: paymentData.cvv,
        paid_at: new Date().toISOString(),
      };

      await api.post(PAYMENTS_API_URL, paymentPayload);
      
      setSuccess({
        message: `✅ Booking successful! ${formData.ticket_quantity} tickets booked for ${ticketPrice * formData.ticket_quantity}. Booking ID: ${bookingId}`,
        bookingId: bookingId
      });

      setFormData(initialBookingData);
      setPaymentData(initialPaymentData);
      setShowPaymentModal(false);
      
      // Refresh shows to update availability
      fetchShows();
    } catch (err) {
      console.error("Booking error:", err);
      setError(`Booking failed: ${err.response?.data?.message || err.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBookingDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData(initialPaymentData);
    setError(null);
  };

  if (isLoading) return (
    <div className="page-container loading-container">
      <div className="loading-spinner-large">🎬</div>
      <p>Loading available shows...</p>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="bookings-container">
        <h2>🎬 Book a Movie Ticket</h2>

        {/* Status Messages */}
        {error && (
          <div className="message error-message">
            <span className="message-icon">⚠️</span>
            {error}
            <button className="message-close" onClick={clearMessages}>×</button>
          </div>
        )}
        
        {success && (
          <div className="message success-message">
            <span className="message-icon">✅</span>
            {success.message || success}
          </div>
        )}

        {/* Movie Search Bar */}
        <div className="search-section">
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search movies by name, genre, or description..."
                value={movieSearchQuery}
                onChange={(e) => setMovieSearchQuery(e.target.value)}
                className="search-input"
              />
              {movieSearchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setMovieSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="search-stats">
              Found {filteredShows.length} shows
              {movieSearchQuery && ` for "${movieSearchQuery}"`}
            </div>
          </div>
        </div>

        {/* Shows list */}
        <div className="shows-list-container">
          {Object.keys(groupedShows).length === 0 ? (
            <div className="no-shows">
              <div className="no-shows-icon">🎭</div>
              <h3>No shows available</h3>
              <p>{movieSearchQuery ? `No shows found for "${movieSearchQuery}"` : "Check back later for new movie schedules"}</p>
            </div>
          ) : (
            Object.keys(groupedShows).map((title) => {
              const movie = groupedShows[title][0]?.movie;
              return (
                <div key={title} className="movie-group">
                  <div className="movie-group-header">
                    {movie?.imageUrl && (
                      <img 
                        src={getImageUrl(movie.imageUrl)} 
                        alt={title}
                        className="movie-group-poster"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="movie-group-info">
                      <h3>{title}</h3>
                      <div className="movie-meta">
                        <span className="genre-badge">{movie?.genre}</span>
                        {movie?.description && (
                          <p className="movie-description">{movie.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="showtimes-grid">
                    {groupedShows[title].map((show) => (
                      <div
                        key={show.showKey}
                        className={`show-card ${
                          formData.selectedShowKey === show.showKey
                            ? "selected-show"
                            : ""
                        }`}
                        onClick={() => handleShowSelection(show.showKey)}
                      >
                        <div className="show-card-content">
                          <div className="show-time">
                            {formatDateTime(show.start_time)}
                          </div>
                          <div className="show-details">
                            <p className="show-hall">
                              🏛️ Hall {show.hall.hall_no} • {show.hall.category}
                            </p>
                            <p className="show-duration">
                              ⏱️ Ends at {new Date(show.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="price-display">
                              {show.hall.price} per ticket
                            </div>
                          </div>
                          {formData.selectedShowKey === show.showKey && (
                            <div className="selected-indicator">
                              ✅ Selected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Booking Form */}
        {selectedShow && (
          <div className="booking-form-card">
            <div className="booking-header">
              {selectedShow.movie.imageUrl && (
                <img 
                  src={getImageUrl(selectedShow.movie.imageUrl)} 
                  alt={selectedShow.movie.title || selectedShow.movie.name}
                  className="booking-movie-poster"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="booking-details">
                <h4>Booking Details</h4>
                <div className="movie-info">
                  <h5>{selectedShow.movie.title || selectedShow.movie.name}</h5>
                  <div className="movie-genre-badge">{selectedShow.movie.genre}</div>
                </div>
                <div className="show-info">
                  <p>🏛️ <strong>Hall {selectedShow.hall.hall_no}</strong> • {selectedShow.hall.category}</p>
                  <p>📅 <strong>{selectedShow.start_time.split("T")[0]}</strong></p>
                  <p>⏰ <strong>{selectedShow.start_time.split("T")[1].slice(0, 5)}</strong></p>
                  <p className="price-info">💰 <strong>{selectedShow.hall.price}</strong> per ticket</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ticket_quantity">Number of Tickets:</label>
              <input
                id="ticket_quantity"
                type="number"
                name="ticket_quantity"
                min="1"
                max="10"
                value={formData.ticket_quantity}
                onChange={handleInputChange}
                className="ticket-input"
              />
            </div>

            <div className="total-price">
              Total: {selectedShow.hall.price * formData.ticket_quantity}
            </div>

            <button 
              className="book-button" 
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? "⏳ Processing..." : "🎫 Confirm Booking"}
            </button>
          </div>
        )}

        {/* Booking Lookup Section */}
        <div className="booking-lookup-section">
          <div className="section-header">
            <h3>📋 Lookup Your Bookings</h3>
            <p>Find your existing bookings by name or phone number</p>
          </div>
          
          <form onSubmit={handleSearchBookings} className="lookup-form">
            <div className="lookup-inputs-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={searchData.name}
                  onChange={handleSearchInputChange}
                  placeholder="Enter your name..."
                  className="lookup-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={searchData.phone}
                  onChange={handleSearchInputChange}
                  placeholder="Enter your phone number..."
                  className="lookup-input"
                />
              </div>
              <div className="form-group">
                <label>&nbsp;</label>
                <div className="lookup-actions">
                  <button 
                    type="submit"
                    className="search-bookings-btn"
                    disabled={searchLoading}
                  >
                    {searchLoading ? "⏳ Searching..." : "🔍 Search Bookings"}
                  </button>
                  <button 
                    type="button"
                    className="clear-search-btn"
                    onClick={clearSearch}
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>📄 Found {searchResults.length} Booking(s)</h4>
              <div className="bookings-grid">
                {searchResults.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div className="booking-meta">
                        <h5>Booking #{booking.id}</h5>
                        <span className="booking-date">
                          {formatBookingDate(booking.date)} at {booking.time}
                        </span>
                      </div>
                      <div className="booking-status">
                        <span className={`status-badge ${booking.status || 'confirmed'}`}>
                          {booking.status || 'Confirmed'}
                        </span>
                      </div>
                    </div>
                    <div className="booking-details">
                      <div className="detail-row">
                        <span className="detail-label">Movie:</span>
                        <span className="detail-value">{booking.movie?.title || booking.movie?.name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Hall:</span>
                        <span className="detail-value">Hall {booking.hall?.hall_no}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Tickets:</span>
                        <span className="detail-value">{booking.ticket_quantity}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Paid:</span>
                        <span className="detail-value price">{booking.payment?.amount || booking.ticket_quantity * 100}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <div className="payment-modal">
              <div className="payment-header">
                <h4>Enter Payment Details</h4>
                <div className="payment-summary">
                  <p>Total Amount: <strong>{selectedShow?.hall?.price * formData.ticket_quantity}</strong></p>
                  <p>{formData.ticket_quantity} ticket(s) for {selectedShow?.movie?.title || selectedShow?.movie?.name}</p>
                </div>
              </div>
              
              {error && (
                <div className="message error-message modal-error">
                  <span className="message-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              <form onSubmit={handlePaymentSubmit} className="booking-form">
                <div className="form-group">
                  <label>Card Number:</label>
                  <input
                    type="text"
                    name="card_number"
                    value={paymentData.card_number}
                    onChange={handlePaymentInputChange}
                    placeholder="1234 5678 9012 3456"
                    required
                    maxLength="19"
                    className="payment-input"
                  />
                </div>
                <div className="payment-inputs-row">
                  <div className="form-group">
                    <label>Expiry (MM/YY):</label>
                    <input
                      type="text"
                      name="expiry"
                      value={paymentData.expiry}
                      onChange={handlePaymentInputChange}
                      placeholder="MM/YY"
                      required
                      maxLength="5"
                      className="payment-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV:</label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handlePaymentInputChange}
                      placeholder="123"
                      required
                      maxLength="3"
                      className="payment-input"
                    />
                  </div>
                </div>
                <div className="payment-actions">
                  <button 
                    type="submit" 
                    className="book-button pay-button"
                    disabled={loading}
                  >
                    {loading ? "⏳ Processing..." : "💳 Pay & Confirm Booking"}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closePaymentModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}