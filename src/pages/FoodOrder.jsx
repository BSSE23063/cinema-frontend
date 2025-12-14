// src/pages/FoodOrder.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./FoodOrder.css";

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
    console.error("Food Order Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🍽️ Something went wrong with Food Orders</h3>
            <p>We encountered an error while processing your food order.</p>
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

// Main FoodOrder Component
export default function FoodOrder() {
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    card_number: "",
    expiry: "",
    cvv: "",
  });
  const [currentFoodOrderId, setCurrentFoodOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Auto remove success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/food-inventory");
      setFoodItems(res.data);
      setFilteredItems(res.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
      setError("⚠️ Could not load food items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (foodId, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0);
    setSelectedItems((prev) => {
      const updated = { ...prev, [foodId]: qty };
      calculateTotalPrice(updated);
      return updated;
    });
  };

  const calculateTotalPrice = (items) => {
    let total = 0;
    foodItems.forEach((food) => {
      if (items[food.id] > 0) total += food.price * items[food.id];
    });
    setTotalPrice(total);
  };

  // Filter food items based on search
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = foodItems.filter((food) =>
      food.item.toLowerCase().includes(value)
    );
    setFilteredItems(filtered);
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Format card number with spaces
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "card_number") {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
    
    if (name === "expiry") {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
    
    if (name === "cvv") {
      const formattedValue = value.replace(/\D/g, '').slice(0, 3);
      setPaymentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
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

  // Step 1: Create food order
  const handlePlaceOrderClick = async () => {
    clearMessages();

    const selectedFoodIds = Object.keys(selectedItems).filter(
      (id) => selectedItems[id] > 0
    );
    
    if (selectedFoodIds.length === 0) {
      setError("⚠️ Please select at least one food item.");
      return;
    }

    // Check if quantities are available
    for (const foodId of selectedFoodIds) {
      const food = foodItems.find(f => f.id === parseInt(foodId));
      if (food && selectedItems[foodId] > food.quantity) {
        setError(`❌ Not enough ${food.item} in stock. Available: ${food.quantity}`);
        return;
      }
    }

    const orderQuantities = selectedFoodIds.map((id) => selectedItems[id] || 0);

    const payload = {
      food_id: selectedFoodIds.map(Number),
      order_quantity: orderQuantities,
    };

    try {
      setLoading(true);

      // Create food order first
      const res = await api.post("/food-order", payload);
      const foodOrderId = res.data.id;
      setCurrentFoodOrderId(foodOrderId);

      // Open payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error creating food order:", error);
      setError(
        `❌ Failed to create food order: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!currentFoodOrderId) {
      setError("⚠️ Food order ID missing. Cannot process payment.");
      return;
    }

    const paymentError = validatePayment();
    if (paymentError) {
      setError(paymentError);
      return;
    }

    try {
      setLoading(true);

      const paymentPayload = {
        food_order_id: currentFoodOrderId,
        amount: totalPrice,
        card_number: paymentData.card_number.replace(/\s/g, ''),
        expiry: paymentData.expiry,
        cvv: paymentData.cvv,
        paid_at: new Date().toISOString(),
      };

      // Make payment
      await api.post("/payments", paymentPayload);

      setSuccess(`✅ Payment successful! Food order placed. Total: ${totalPrice.toFixed(2)}`);
      setSelectedItems({});
      setTotalPrice(0);
      setPaymentData({ card_number: "", expiry: "", cvv: "" });
      setCurrentFoodOrderId(null);
      setShowPaymentModal(false);
      
      // Refresh food items to update quantities
      fetchFoodItems();
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        `❌ Payment failed: ${error.response?.data?.message || error.message}`
      );

      // Rollback: delete the food order if payment fails
      try {
        await api.delete(`/food-order/${currentFoodOrderId}`);
        console.log(
          `Food order ${currentFoodOrderId} deleted due to payment failure.`
        );
      } catch (delErr) {
        console.error(
          "Failed to delete food order after payment failure:",
          delErr
        );
      }

      setCurrentFoodOrderId(null);
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData({ card_number: "", expiry: "", cvv: "" });
    setCurrentFoodOrderId(null);
    setError(null);
  };

  const clearOrder = () => {
    setSelectedItems({});
    setTotalPrice(0);
    clearMessages();
  };

  return (
    <ErrorBoundary>
      <div className="food-order-page">
        <h2>🍽️ Place Your Food Order</h2>

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

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search food items by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="search-stats">
              Found {filteredItems.length} items
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="food-items-section">
          {loading && filteredItems.length === 0 ? (
            <div className="loading-state">
              <div className="loading-spinner">🍔</div>
              <p>Loading food items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="no-items">
              <div className="no-items-icon">🍽️</div>
              <h4>No food items found</h4>
              <p>{searchTerm ? `No items matching "${searchTerm}"` : "No food items available"}</p>
            </div>
          ) : (
            <div className="food-items-grid">
              {filteredItems.map((food) => (
                <div key={food.id} className="food-item-card">
                  <div className="food-item-header">
                    <h5 className="food-item-name">{food.item}</h5>
                    <div className="food-item-price">{food.price}</div>
                  </div>
                  
                  <div className="food-item-details">
                    <div className="food-detail">
                      <span className="detail-label">Available:</span>
                      <span className="detail-value">{food.quantity}</span>
                    </div>
                  </div>

                  <div className="food-item-actions">
                    <div className="quantity-input-group">
                      <label>Quantity:</label>
                      <input
                        type="number"
                        min="0"
                        max={food.quantity}
                        value={selectedItems[food.id] || ""}
                        onChange={(e) => handleQuantityChange(food.id, e.target.value)}
                        className="quantity-input"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {selectedItems[food.id] > 0 && (
                    <div className="item-total">
                      Subtotal: {(food.price * selectedItems[food.id]).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {totalPrice > 0 && (
          <div className="order-summary-card">
            <div className="order-summary-header">
              <h4>📋 Order Summary</h4>
              <button onClick={clearOrder} className="clear-order-btn">
                🗑️ Clear Order
              </button>
            </div>
            
            <div className="selected-items-list">
              {Object.keys(selectedItems)
                .filter(id => selectedItems[id] > 0)
                .map(id => {
                  const food = foodItems.find(f => f.id === parseInt(id));
                  return food ? (
                    <div key={id} className="selected-item">
                      <span className="item-name">{food.item}</span>
                      <span className="item-quantity">x{selectedItems[id]}</span>
                      <span className="item-subtotal">{(food.price * selectedItems[id]).toFixed(2)}</span>
                    </div>
                  ) : null;
                })}
            </div>
            
            <div className="total-price-section">
              <div className="total-price">
                <strong>Total Amount: {totalPrice.toFixed(2)}</strong>
              </div>
              
              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrderClick}
                disabled={loading}
              >
                {loading ? "⏳ Processing..." : "🛒 Place Order & Pay"}
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <div className="payment-modal">
              <div className="payment-header">
                <h4>Enter Payment Details</h4>
                <div className="payment-summary">
                  <p>Total Amount: <strong>{totalPrice.toFixed(2)}</strong></p>
                  <p>Food Order #{currentFoodOrderId}</p>
                </div>
              </div>
              
              {error && (
                <div className="message error-message modal-error">
                  <span className="message-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              <form onSubmit={handlePaymentSubmit} className="payment-form">
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
                    className="pay-button"
                    disabled={loading}
                  >
                    {loading ? "⏳ Processing..." : "💳 Pay " + totalPrice.toFixed(2)}
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