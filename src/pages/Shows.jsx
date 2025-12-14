// src/pages/Shows.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import "./Shows.css";

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
    console.error("Shows Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🎭 Something went wrong with Shows</h3>
            <p>We encountered an error while managing shows.</p>
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

// Main Shows Component
export default function Shows() {
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHall, setSearchHall] = useState("");
  const [searchMovie, setSearchMovie] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Ref for scrolling to existing shows section
  const existingShowsRef = useRef(null);

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    fetchMovies();
    fetchHalls();
    fetchAllShows();
  }, []);

  // Auto remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/movie");
      setMovies(res.data);
    } catch (err) {
      setError("Failed to load movies");
      console.error("Error fetching movies:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHalls = async () => {
    try {
      const res = await api.get("/halls");
      setHalls(res.data);
    } catch (err) {
      setError("Failed to load halls");
      console.error("Error fetching halls:", err.response?.data || err.message);
    }
  };

  const fetchAllShows = async () => {
    try {
      const res = await api.get("/shows");
      setAllShows(res.data);
    } catch (err) {
      console.error("Error fetching all shows:", err.response?.data || err.message);
    }
  };

  /* ---------------- Show Management ---------------- */
  const openCreateModal = (movie = null) => {
    if (movie) {
      setSelectedMovie(movie);
    }
    setIsCreateModalOpen(true);
    setError(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedMovie(null);
    setSelectedHallId(null);
    setStartTime("");
    setEndTime("");
    setError(null);
  };

  const addShow = async () => {
    if (!selectedMovie || !selectedHallId || !startTime || !endTime) {
      setError("Please select movie, hall, start time, and end time.");
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      movie_id: selectedMovie.id,
      hall_id: selectedHallId,
      start_time: startTime,
      end_time: endTime,
    };

    try {
      setLoading(true);
      await api.post("/shows", payload);
      fetchAllShows();
      closeCreateModal();
      setSuccess("Show added successfully! 🎉");
      
      // Scroll to existing shows section after successful creation
      setTimeout(() => {
        scrollToExistingShows();
      }, 100);
    } catch (err) {
      setError("Error adding show: " + (err.response?.data?.message || err.message));
      console.error("Error adding show:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteShow = async (showId, movieName) => {
    if (!window.confirm(`Are you sure you want to delete the show for "${movieName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/shows/${showId}`);
      fetchAllShows();
      setSuccess("Show deleted successfully! 🗑️");
    } catch (err) {
      setError("Error deleting show");
      console.error("Error deleting show:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Search Functionality ---------------- */
  const searchMovies = () => {
    if (!searchQuery.trim()) {
      return movies;
    }
    
    const query = searchQuery.toLowerCase();
    return movies.filter(movie => 
      movie.name?.toLowerCase().includes(query) ||
      movie.genre?.toLowerCase().includes(query) ||
      movie.description?.toLowerCase().includes(query)
    );
  };

  const searchExistingShows = () => {
    let filtered = allShows;

    if (searchHall) {
      filtered = filtered.filter(show => 
        show.hall?.hall_no?.toString().includes(searchHall) ||
        show.hall?.category?.toLowerCase().includes(searchHall.toLowerCase())
      );
    }

    if (searchMovie) {
      filtered = filtered.filter(show =>
        show.movie?.name?.toLowerCase().includes(searchMovie.toLowerCase()) ||
        show.movie?.genre?.toLowerCase().includes(searchMovie.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(show => {
        const showDate = new Date(show.start_time).toISOString().slice(0, 10);
        return showDate === searchDate;
      });
    }

    return filtered;
  };

  const clearSearch = () => {
    setSearchHall("");
    setSearchMovie("");
    setSearchDate("");
  };

  /* ---------------- Scroll Functionality ---------------- */
  const scrollToExistingShows = () => {
    if (existingShowsRef.current) {
      existingShowsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const filteredMovies = searchMovies();
  const searchedShows = searchExistingShows();

  /* ---------------- Helper Functions ---------------- */
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `http://localhost:3000${imageUrl}`;
    return `http://localhost:3000/${imageUrl}`;
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getUpcomingShows = () => {
    const now = new Date();
    return allShows
      .filter(show => new Date(show.start_time) > now)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 5);
  };

  const upcomingShows = getUpcomingShows();

  return (
    <ErrorBoundary>
      <div className="shows-container">
        {/* Quick Action Button */}
        <div className="quick-action-bar">
          <button 
            onClick={scrollToExistingShows}
            className="view-all-shows-btn"
          >
            📋 View All Shows
          </button>
        </div>

        <div className="shows-card">
          <h2 className="shows-title">🎭 Manage Shows</h2>

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
              {success}
            </div>
          )}

          <div className="shows-layout">
            {/* Movies Section with Search */}
            <div className="movies-section">
              <div className="section-header">
                <h4>🎬 Movies Catalog</h4>
                <p>Click on any movie to create a show</p>
              </div>

              {/* Search Bar */}
              <div className="search-bar-container">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search movies by name, genre, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="search-stats">
                  Found {filteredMovies.length} movies
                </div>
              </div>

              {/* Movies Grid */}
              <div className="movies-grid">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="movie-card"
                    onClick={() => openCreateModal(movie)}
                  >
                    <div className="movie-poster">
                      {movie.imageUrl ? (
                        <img 
                          src={getImageUrl(movie.imageUrl)} 
                          alt={movie.name}
                          className="poster-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`poster-placeholder ${movie.imageUrl ? 'hidden' : ''}`}>
                        🎬
                      </div>
                      <div className="movie-overlay">
                        <div className="create-show-indicator">
                          🎬 Create Show
                        </div>
                      </div>
                    </div>
                    <div className="movie-info">
                      <h5 className="movie-name">{movie.name}</h5>
                      <div className="movie-genre">{movie.genre}</div>
                      {movie.description && (
                        <p className="movie-description">{movie.description}</p>
                      )}
                      <div className="click-hint">
                        Click to create show →
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMovies.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🎭</div>
                  <h5>No movies found</h5>
                  <p>Try adjusting your search terms</p>
                </div>
              )}
            </div>

            {/* Right Panel - Existing Shows & Search */}
            <div className="existing-shows-panel">
              <div className="panel-header">
                <div className="panel-header-top">
                  <h4>📅 Shows Management</h4>
                  <button 
                    onClick={scrollToExistingShows}
                    className="jump-to-shows-btn"
                  >
                    📋 Jump to All Shows
                  </button>
                </div>
                <p>Search and manage existing shows</p>
              </div>

              {/* Quick Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎬</div>
                  <div className="stat-info">
                    <div className="stat-value">{movies.length}</div>
                    <div className="stat-label">Total Movies</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏛️</div>
                  <div className="stat-info">
                    <div className="stat-value">{halls.length}</div>
                    <div className="stat-label">Halls</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <div className="stat-value">{allShows.length}</div>
                    <div className="stat-label">Total Shows</div>
                  </div>
                </div>
              </div>

              {/* Upcoming Shows */}
              {upcomingShows.length > 0 && (
                <div className="upcoming-shows-section">
                  <h5>🚀 Upcoming Shows</h5>
                  <div className="upcoming-shows-list">
                    {upcomingShows.map((show) => (
                      <div key={show.id} className="upcoming-show-card">
                        <div className="upcoming-show-time">
                          {formatDateTime(show.start_time)}
                        </div>
                        <div className="upcoming-show-details">
                          <strong>{show.movie?.name}</strong>
                          <span>Hall {show.hall?.hall_no}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="search-results-section" ref={existingShowsRef}>
                <div className="section-title-with-action">
                  <h5>📋 All Shows</h5>
                  <button 
                    onClick={clearSearch}
                    className="reset-all-btn"
                  >
                    🔄 Reset Filters
                  </button>
                </div>

                {/* Search Filters - Moved to show results section */}
                <div className="search-filters-container">
                  <h6>🔍 Filter Shows</h6>
                  <div className="filters-grid">
                    <div className="filter-group">
                      <label>By Hall</label>
                      <input
                        type="text"
                        placeholder="Hall number or category..."
                        value={searchHall}
                        onChange={(e) => setSearchHall(e.target.value)}
                        className="filter-input"
                      />
                    </div>
                    
                    <div className="filter-group">
                      <label>By Movie</label>
                      <input
                        type="text"
                        placeholder="Movie name or genre..."
                        value={searchMovie}
                        onChange={(e) => setSearchMovie(e.target.value)}
                        className="filter-input"
                      />
                    </div>
                    
                    <div className="filter-group">
                      <label>By Date</label>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>
                  <div className="filter-results-count">
                    Showing {searchedShows.length} of {allShows.length} shows
                  </div>
                </div>

                {searchedShows.length === 0 ? (
                  <div className="no-shows">
                    <div className="no-shows-icon">🔍</div>
                    <p>No shows found matching your search</p>
                    <small>Try different search criteria or create a new show</small>
                  </div>
                ) : (
                  <div className="shows-list">
                    {searchedShows.map((show) => (
                      <div key={show.id} className="show-card">
                        <div className="show-time">
                          <div className="time-slot">
                            <span className="time-label">Starts</span>
                            <span className="time-value">{formatDateTime(show.start_time)}</span>
                          </div>
                          <div className="time-arrow">→</div>
                          <div className="time-slot">
                            <span className="time-label">Ends</span>
                            <span className="time-value">{formatDateTime(show.end_time)}</span>
                          </div>
                        </div>
                        <div className="show-details">
                          <div className="movie-info-small">
                            <strong>{show.movie?.name}</strong>
                            <span className="genre-tag">{show.movie?.genre}</span>
                          </div>
                          <div className="hall-info">
                            <span className="hall-icon">🏛️</span>
                            <span>Hall {show.hall?.hall_no} • {show.hall?.category}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteShow(show.id, show.movie?.name)}
                          className="delete-show-btn"
                          disabled={loading}
                        >
                          {loading ? "⏳" : "🗑️ Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Show Modal */}
        {isCreateModalOpen && (
          <div className="modal-overlay">
            <div className="modal create-show-modal">
              <div className="modal-header">
                <h3>🎬 Create New Show</h3>
                <button className="close-btn" onClick={closeCreateModal}>×</button>
              </div>
              
              <div className="modal-content">
                {/* Selected Movie Preview */}
                <div className="selected-movie-section">
                  <h4>Selected Movie</h4>
                  <div className="selected-movie-preview">
                    <img 
                      src={getImageUrl(selectedMovie?.imageUrl)} 
                      alt={selectedMovie?.name}
                      className="modal-movie-poster"
                    />
                    <div className="modal-movie-info">
                      <h4>{selectedMovie?.name}</h4>
                      <div className="modal-genre-badge">{selectedMovie?.genre}</div>
                      {selectedMovie?.description && (
                        <p className="modal-movie-description">{selectedMovie?.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hall selection */}
                <div className="modal-section">
                  <h4>🏛️ Select Hall</h4>
                  <p className="section-description">Choose a hall for the show</p>
                  <div className="halls-grid-modal">
                    {halls.map((h) => (
                      <div
                        key={h.id}
                        className={`hall-card ${selectedHallId === h.id ? "selected" : ""}`}
                        onClick={() => setSelectedHallId(h.id)}
                      >
                        <div className="hall-icon">🏛️</div>
                        <div className="hall-info">
                          <div className="hall-number">Hall {h.hall_no}</div>
                          <div className="hall-category">{h.category}</div>
                          <div className="hall-price">{h.price}/seat</div>
                          <div className="hall-capacity">{h.capacity} seats</div>
                        </div>
                        {selectedHallId === h.id && (
                          <div className="selected-check">✅</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time selection */}
                <div className="modal-section">
                  <h4>⏰ Select Show Time</h4>
                  <p className="section-description">Set the start and end time for the show</p>
                  <div className="time-inputs-modal">
                    <div className="time-input-group">
                      <label>Start Time *</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="time-input"
                        required
                      />
                    </div>
                    <div className="time-input-group">
                      <label>End Time *</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="time-input"
                        required
                      />
                    </div>
                  </div>
                  {startTime && endTime && (
                    <div className="duration-info">
                      <span className="duration-label">Show Duration:</span>
                      <span className="duration-value">
                        {Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60))} minutes
                      </span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="modal-section summary-section">
                  <h4>📋 Show Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Movie:</span>
                      <span className="summary-value">{selectedMovie?.name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Hall:</span>
                      <span className="summary-value">
                        {selectedHallId ? `Hall ${halls.find(h => h.id === selectedHallId)?.hall_no}` : 'Not selected'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Start Time:</span>
                      <span className="summary-value">
                        {startTime ? formatDateTime(startTime) : 'Not set'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">End Time:</span>
                      <span className="summary-value">
                        {endTime ? formatDateTime(endTime) : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={closeCreateModal}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  onClick={addShow}
                  disabled={loading || !selectedMovie || !selectedHallId || !startTime || !endTime}
                  className="save-btn"
                >
                  {loading ? "⏳ Creating..." : "🎬 Create Show"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}