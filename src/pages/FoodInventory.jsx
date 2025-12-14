// src/pages/FoodInventory.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./FoodInventory.css";

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
    console.error("Food Inventory Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🍔 Something went wrong with Food Inventory</h3>
            <p>We encountered an error while managing food items.</p>
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

// Main FoodInventory Component
export default function FoodInventory() {
  const [foodItems, setFoodItems] = useState([]);
  const [newFood, setNewFood] = useState({
    item: "",
    quantity: "",
    price: "",
  });
  const [editingFood, setEditingFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    item: "",
    quantity: "",
    price: ""
  });

  useEffect(() => {
    fetchFoodItems();
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

  // Validation functions
  const validateItem = (value) => {
    if (!value.trim()) return "Item name is required";
    if (value.trim().length < 2) return "Item name must be at least 2 characters";
    return "";
  };

  const validateQuantity = (value) => {
    if (!value) return "Quantity is required";
    if (isNaN(value) || value === "") return "Quantity must be a number";
    if (parseInt(value) <= 0) return "Quantity must be greater than 0";
    if (!Number.isInteger(parseFloat(value))) return "Quantity must be a whole number";
    return "";
  };

  const validatePrice = (value) => {
    if (!value) return "Price is required";
    if (isNaN(value) || value === "") return "Price must be a number";
    if (parseFloat(value) <= 0) return "Price must be greater than 0";
    return "";
  };

  // Validate all fields
  const validateForm = (foodData) => {
    const errors = {
      item: validateItem(foodData.item),
      quantity: validateQuantity(foodData.quantity),
      price: validatePrice(foodData.price)
    };
    setValidationErrors(errors);
    return !errors.item && !errors.quantity && !errors.price;
  };

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    const updatedFood = { ...newFood, [field]: value };
    setNewFood(updatedFood);

    // Validate the changed field
    let error = "";
    switch (field) {
      case "item":
        error = validateItem(value);
        break;
      case "quantity":
        error = validateQuantity(value);
        break;
      case "price":
        error = validatePrice(value);
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle edit input changes with validation
  const handleEditInputChange = (field, value) => {
    if (!editingFood) return;
    
    const updatedFood = { ...editingFood, [field]: value };
    setEditingFood(updatedFood);

    // Validate the changed field
    let error = "";
    switch (field) {
      case "item":
        error = validateItem(value);
        break;
      case "quantity":
        error = validateQuantity(value);
        break;
      case "price":
        error = validatePrice(value);
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Prevent non-numeric input for quantity and price
  const handleNumericInput = (e, field) => {
    // Allow only numbers, decimal point, and backspace
    if (!/[\d.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault();
    }
    
    // For quantity field, don't allow decimal point
    if (field === 'quantity' && e.key === '.') {
      e.preventDefault();
    }
  };

  // Fetch all food items
  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/food-inventory");
      setFoodItems(res.data);
    } catch (error) {
      setError("Failed to load food items");
      console.error("Error fetching food items:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new food item
  const addFood = async () => {
    if (!validateForm(newFood)) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        item: newFood.item.trim(),
        quantity: parseInt(newFood.quantity),
        price: parseFloat(newFood.price),
      };

      await api.post("/food-inventory", payload);
      setNewFood({ item: "", quantity: "", price: "" });
      setValidationErrors({ item: "", quantity: "", price: "" });
      fetchFoodItems();
      setSuccess("Food item added successfully! 🎉");
    } catch (error) {
      setError("Error adding food item: " + (error.response?.data?.message || error.message));
      console.error("Error adding food item:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update food item
  const updateFood = async () => {
    if (!editingFood || !validateForm(editingFood)) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        item: editingFood.item.trim(),
        quantity: parseInt(editingFood.quantity),
        price: parseFloat(editingFood.price),
      };

      await api.patch(`/food-inventory/${editingFood.id}`, payload);
      closeModal();
      fetchFoodItems();
      setSuccess("Food item updated successfully! ✅");
    } catch (error) {
      setError("Error updating food item: " + (error.response?.data?.message || error.message));
      console.error("Error updating food item:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete food item
  const deleteFood = async (id, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/food-inventory/${id}`);
      fetchFoodItems();
      setSuccess("Food item deleted successfully! 🗑️");
    } catch (error) {
      setError("Error deleting food item");
      console.error("Error deleting food item:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (food) => {
    setEditingFood({ ...food });
    setValidationErrors({ item: "", quantity: "", price: "" });
    setIsModalOpen(true);
    setError(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFood(null);
    setValidationErrors({ item: "", quantity: "", price: "" });
    setError(null);
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Check if form is valid
  const isFormValid = (foodData) => {
    return foodData.item && foodData.quantity && foodData.price && 
           !validationErrors.item && !validationErrors.quantity && !validationErrors.price;
  };

  return (
    <ErrorBoundary>
      <div className="food-inventory-container">
        <div className="food-inventory-card">
          <h2 className="food-inventory-title">🍔 Manage Food Inventory</h2>

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

          {/* Add Food Form */}
          <div className="add-food-section">
            <h4>➕ Add New Food Item</h4>
            <div className="food-input-grid">
              <div className="input-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="Enter item name..."
                  value={newFood.item}
                  onChange={(e) => handleInputChange("item", e.target.value)}
                  className={`food-input ${validationErrors.item ? 'invalid' : ''}`}
                />
                {validationErrors.item && (
                  <div className="input-error">{validationErrors.item}</div>
                )}
              </div>
              
              <div className="input-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  placeholder="Enter quantity..."
                  value={newFood.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  onKeyDown={(e) => handleNumericInput(e, 'quantity')}
                  className={`food-input ${validationErrors.quantity ? 'invalid' : ''}`}
                  min="1"
                  step="1"
                />
                {validationErrors.quantity && (
                  <div className="input-error">{validationErrors.quantity}</div>
                )}
              </div>
              
              <div className="input-group">
                <label>Price (Rs) *</label>
                <input
                  type="number"
                  placeholder="Enter price..."
                  value={newFood.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  onKeyDown={(e) => handleNumericInput(e, 'price')}
                  className={`food-input ${validationErrors.price ? 'invalid' : ''}`}
                  min="0.01"
                  step="0.01"
                />
                {validationErrors.price && (
                  <div className="input-error">{validationErrors.price}</div>
                )}
              </div>
              
              <button 
                onClick={addFood}
                disabled={loading || !isFormValid(newFood)}
                className="add-food-btn"
              >
                {loading ? "⏳ Adding..." : "➕ Add Item"}
              </button>
            </div>
          </div>

          {/* Food Items List */}
          <div className="food-items-section">
            <div className="section-header">
              <h4>📋 Food Items ({foodItems.length})</h4>
              <button 
                onClick={fetchFoodItems}
                className="refresh-btn"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            {loading && foodItems.length === 0 ? (
              <div className="loading-state">
                <div className="loading-spinner">⏳</div>
                <p>Loading food items...</p>
              </div>
            ) : foodItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍔</div>
                <h5>No food items found</h5>
                <p>Add your first food item using the form above</p>
              </div>
            ) : (
              <div className="food-items-grid">
                {foodItems.map((food) => (
                  <div key={food.id} className="food-item-card">
                    <div className="food-item-header">
                      <h5 className="food-item-name">{food.item}</h5>
                      <div className="food-actions">
                        <button 
                          onClick={() => openEditModal(food)}
                          className="edit-btn"
                          disabled={loading}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => deleteFood(food.id, food.item)}
                          className="delete-btn"
                          disabled={loading}
                        >
                          {loading ? "⏳" : "🗑️ Delete"}
                        </button>
                      </div>
                    </div>
                    
                    <div className="food-item-details">
                      <div className="food-detail">
                        <span className="detail-label">Quantity:</span>
                        <span className="detail-value">{food.quantity}</span>
                      </div>
                      <div className="food-detail">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">{food.price}</span>
                      </div>
                    </div>
                    
                    <div className="food-item-status">
                      {food.quantity === 0 && (
                        <span className="status-badge out-of-stock">Out of Stock</span>
                      )}
                      {food.quantity > 0 && food.quantity <= 10 && (
                        <span className="status-badge low-stock">Low Stock</span>
                      )}
                      {food.quantity > 10 && (
                        <span className="status-badge in-stock">In Stock</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Food Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>✏️ Edit Food Item</h3>
                <button className="close-btn" onClick={closeModal}>×</button>
              </div>
              
              <div className="modal-content">
                {editingFood && (
                  <div className="edit-food-form">
                    <div className="input-group">
                      <label>Item Name *</label>
                      <input
                        type="text"
                        value={editingFood.item}
                        onChange={(e) => handleEditInputChange("item", e.target.value)}
                        className={`food-input ${validationErrors.item ? 'invalid' : ''}`}
                      />
                      {validationErrors.item && (
                        <div className="input-error">{validationErrors.item}</div>
                      )}
                    </div>
                    
                    <div className="input-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        value={editingFood.quantity}
                        onChange={(e) => handleEditInputChange("quantity", e.target.value)}
                        onKeyDown={(e) => handleNumericInput(e, 'quantity')}
                        className={`food-input ${validationErrors.quantity ? 'invalid' : ''}`}
                        min="1"
                        step="1"
                      />
                      {validationErrors.quantity && (
                        <div className="input-error">{validationErrors.quantity}</div>
                      )}
                    </div>
                    
                    <div className="input-group">
                      <label>Price (Rs) *</label>
                      <input
                        type="number"
                        value={editingFood.price}
                        onChange={(e) => handleEditInputChange("price", e.target.value)}
                        onKeyDown={(e) => handleNumericInput(e, 'price')}
                        className={`food-input ${validationErrors.price ? 'invalid' : ''}`}
                        min="0.01"
                        step="0.01"
                      />
                      {validationErrors.price && (
                        <div className="input-error">{validationErrors.price}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={closeModal}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  onClick={updateFood}
                  disabled={loading || !editingFood || !isFormValid(editingFood)}
                  className="save-btn"
                >
                  {loading ? "⏳ Updating..." : "💾 Update Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}