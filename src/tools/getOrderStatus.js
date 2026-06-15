const mockOrders = require("../data/mockOrders");

/**
 * Simulates a real-time order status retrieval call.
 * In production, this would call Flipkart's order management API.
 *
 * @param {string} orderId
 * @returns {Promise<object>} order state object, or an error object
 */
async function getOrderStatus(orderId) {
  // Simulate network/API latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalizedId = (orderId || "").trim().toUpperCase();
  const order = mockOrders[normalizedId];

  if (!order) {
    return {
      success: false,
      error: "ORDER_NOT_FOUND",
      message: `No order found with ID ${orderId}`
    };
  }

  // Calculate staleness
  const lastUpdated = new Date(order.last_updated_timestamp);
  const now = new Date(); // In real system, this is server "now"
  const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

  return {
    success: true,
    data: {
      ...order,
      is_stale: hoursSinceUpdate > 6,
      hours_since_update: Math.round(hoursSinceUpdate * 10) / 10
    }
  };
}

module.exports = getOrderStatus;