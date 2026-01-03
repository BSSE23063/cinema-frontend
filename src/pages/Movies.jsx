// src/pages/Movies.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./Movies.css";

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
    console.error("Movies Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🎬 Something went wrong with Movies</h3>
            <p>We encountered an error while loading movies.</p>
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

// Main Movies Component
export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [newMovie, setNewMovie] = useState({
    name: "",
    description: "",
    genre: "",
    imageUrl: "",
  });
  const [editingMovie, setEditingMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = movies.filter(movie =>
        movie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  }, [searchTerm, movies]);

  // Auto remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  /* ---------------- Movies ---------------- */
  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/movie");
      setMovies(res.data);
      setFilteredMovies(res.data);
    } catch (error) {
      setError("Failed to load movies. Please try again.");
      console.error("Error fetching movies:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      if (isModalOpen && editingMovie) {
        setEditingMovie(prev => ({ ...prev, imageUrl: previewUrl }));
      } else {
        setNewMovie(prev => ({ ...prev, imageUrl: previewUrl }));
      }
      setError(null);
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await api.post('/upload/movie-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.response?.data?.message || error.message}`);
    }
  };

  const saveMovie = async () => {
    if (!newMovie.name || !newMovie.genre) {
      setError("Movie name and genre are required.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      let imageUrl = newMovie.imageUrl;
      
      // If there's a new image file, upload it first
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: newMovie.name,
        description: newMovie.description,
        genre: newMovie.genre,
        imageUrl: imageUrl || null,
      };

      await api.post("/movie", payload);

      setNewMovie({ name: "", description: "", genre: "", imageUrl: "" });
      setImageFile(null);
      clearFileInput();
      
      fetchMovies();
      setSuccess("Movie added successfully! 🎉");
    } catch (error) {
      setError(`Error saving movie: ${error.message}`);
      console.error("Error saving movie:", error);
    } finally {
      setUploading(false);
    }
  };

  const updateMovie = async () => {
    if (!editingMovie) return;

    if (!editingMovie.name || !editingMovie.genre) {
      setError("Movie name and genre are required.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      let imageUrl = editingMovie.imageUrl;
      
      // If there's a new image file, upload it first
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: editingMovie.name,
        description: editingMovie.description,
        genre: editingMovie.genre,
        imageUrl: imageUrl || null,
      };

      await api.patch(`/movie/${editingMovie.id}`, payload);

      setEditingMovie(null);
      setIsModalOpen(false);
      setImageFile(null);
      clearFileInput();
      
      fetchMovies();
      setSuccess("Movie updated successfully! ✨");
    } catch (error) {
      setError(`Error updating movie: ${error.message}`);
      console.error("Error updating movie:", error);
    } finally {
      setUploading(false);
    }
  };

  const deleteMovie = async (id, movieName) => {
    if (!window.confirm(`Are you sure you want to delete "${movieName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/movie/${id}`);
      fetchMovies();
      setSuccess(`"${movieName}" deleted successfully! 🗑️`);
    } catch (error) {
      setError("Error deleting movie. Please try again.");
      console.error("Error deleting movie:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditMovie = (movie) => {
    setEditingMovie({ ...movie });
    setIsModalOpen(true);
    setImageFile(null);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
    setImageFile(null);
    setError(null);
  };

  const clearImage = () => {
    if (isModalOpen && editingMovie) {
      setEditingMovie(prev => ({ ...prev, imageUrl: "" }));
    } else {
      setNewMovie(prev => ({ ...prev, imageUrl: "" }));
    }
    setImageFile(null);
    clearFileInput();
  };

  const clearFileInput = () => {
    const fileInput = document.querySelector('.image-upload-input');
    if (fileInput) fileInput.value = '';
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `http://52.20.176.113:3000${imageUrl}`;
    return `http://52.20.176.113:3000/${imageUrl}`;
  };

  const displayMovies = searchTerm ? filteredMovies : movies;

  return (
    <ErrorBoundary>
      <div className="movies-container">
        <div className="movies-card">
          <h2 className="movies-title">🎬 Manage Movies</h2>

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

          {/* Movie form */}
          <div className="movie-form">
            <h3 className="form-title">Add New Movie</h3>
            
            <div className="form-grid">
              <input
                type="text"
                placeholder="Movie Name *"
                value={newMovie.name}
                onChange={(e) => setNewMovie({ ...newMovie, name: e.target.value })}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Genre *"
                value={newMovie.genre}
                onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newMovie.description}
                onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                className="form-input full-width"
              />
            </div>
            
            {/* Image Upload */}
            <div className="image-upload-section">
              <label className="image-upload-label">
                🖼️ {newMovie.imageUrl ? 'Change Movie Poster' : 'Upload Movie Poster (Optional)'}
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/gif, image/webp"
                  onChange={handleImageChange}
                  className="image-upload-input"
                />
              </label>
              
              {newMovie.imageUrl && (
                <div className="image-preview-card">
                  <img src={newMovie.imageUrl} alt="Movie preview" className="preview-image" />
                  <div className="preview-actions">
                    <span className="preview-text">Image Preview</span>
                    <button type="button" onClick={clearImage} className="remove-image-btn">
                      Remove
                    </button>
                  </div>
                </div>
              )}
              
              <div className="upload-info">
                <small>Supported formats: JPEG, PNG, GIF, WebP • Max size: 5MB</small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                onClick={saveMovie} 
                disabled={uploading || loading}
                className={`save-btn ${uploading ? 'uploading' : ''}`}
              >
                {uploading ? "⏳ Uploading..." : "➕ Add Movie"}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search movies by name, genre, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="search-results">
                Found {filteredMovies.length} movie(s) matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Movies list */}
          <div className="movies-list-section">
            <div className="section-header">
              <h3>🎞️ Current Movies ({displayMovies.length})</h3>
              {loading && <div className="loading-indicator">🔄 Loading...</div>}
            </div>
            
            <div className="movies-grid">
              {displayMovies.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    {searchTerm ? "🔍" : "🎬"}
                  </div>
                  <p>
                    {searchTerm 
                      ? "No movies found matching your search." 
                      : "No movies found. Add your first movie above!"
                    }
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="clear-search-btn"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                displayMovies.map((movie) => (
                  <div key={movie.id} className="movie-card">
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
                        <div className="movie-actions">
                          <button 
                            onClick={() => startEditMovie(movie)}
                            className="edit-btn"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => deleteMovie(movie.id, movie.name)}
                            className="delete-btn"
                          >
                            ❌ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="movie-info">
                      <h4 className="movie-title">{movie.name}</h4>
                      <div className="movie-genre">{movie.genre}</div>
                      <p className="movie-description">{movie.description}</p>
                      {movie.imageUrl && (
                        <div className="image-badge">
                          <small>📷 Has poster</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Edit Movie Modal */}
        {isModalOpen && editingMovie && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Movie</h3>
                <button className="close-btn" onClick={closeModal}>×</button>
              </div>
              
              <div className="modal-content">
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Movie Name *"
                    value={editingMovie.name}
                    onChange={(e) => setEditingMovie({ ...editingMovie, name: e.target.value })}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Genre *"
                    value={editingMovie.genre}
                    onChange={(e) => setEditingMovie({ ...editingMovie, genre: e.target.value })}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={editingMovie.description}
                    onChange={(e) => setEditingMovie({ ...editingMovie, description: e.target.value })}
                    className="form-input full-width"
                  />
                </div>
                
                {/* Image Upload in Modal */}
                <div className="image-upload-section">
                  <label className="image-upload-label">
                    🖼️ {editingMovie.imageUrl ? 'Change Movie Poster' : 'Upload Movie Poster (Optional)'}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/gif, image/webp"
                      onChange={handleImageChange}
                      className="image-upload-input"
                    />
                  </label>
                  
                  {editingMovie.imageUrl && (
                    <div className="image-preview-card">
                      <img src={editingMovie.imageUrl} alt="Movie preview" className="preview-image" />
                      <div className="preview-actions">
                        <span className="preview-text">Image Preview</span>
                        <button type="button" onClick={clearImage} className="remove-image-btn">
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={closeModal}
                  className="cancel-btn"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={updateMovie}
                  disabled={uploading}
                  className="save-btn"
                >
                  {uploading ? "⏳ Updating..." : "💾 Update Movie"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}