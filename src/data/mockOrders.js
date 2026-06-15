// Simulated order database
// last_updated_timestamp uses ISO strings; we'll compute "staleness" at runtime

const mockOrders = {
  "FLP1001": {
    order_id: "FLP1001",
    current_state: "Delivered",
    promised_delivery_date: "2026-06-12",
    last_updated_timestamp: "2026-06-12T14:30:00Z",
    delivery_location: "Bengaluru, Karnataka",
    delay_reason: null,
    next_action: null
  },

  "FLP1002": {
    order_id: "FLP1002",
    current_state: "Out for Delivery",
    promised_delivery_date: "2026-06-15",
    last_updated_timestamp: "2026-06-15T08:00:00Z",
    delivery_location: "Pune, Maharashtra",
    eta: "Today by 8 PM",
    delay_reason: null,
    next_action: null
  },

  "FLP1003": {
    order_id: "FLP1003",
    current_state: "In Transit",
    promised_delivery_date: "2026-06-16",
    last_updated_timestamp: "2026-06-14T22:00:00Z",
    delivery_location: "In transit to Hyderabad hub",
    eta: "2026-06-16",
    delay_reason: null,
    next_action: null
  },

  "FLP1004": {
    order_id: "FLP1004",
    current_state: "Processing",
    promised_delivery_date: "2026-06-10",
    last_updated_timestamp: "2026-06-14T10:00:00Z",
    delivery_location: null,
    delay_reason: "Seller dispatch delay",
    next_action: "Escalated to seller"
  },

  "FLP1005": {
    order_id: "FLP1005",
    current_state: "Processing Delayed",
    promised_delivery_date: "2026-06-11",
    last_updated_timestamp: "2026-06-13T16:00:00Z",
    delivery_location: null,
    delay_reason: "Courier pickup missed",
    next_action: "Awaiting courier pickup"
  },

  "FLP1006": {
    order_id: "FLP1006",
    current_state: "Re-shipment Initiated",
    promised_delivery_date: "2026-06-09",
    new_expected_delivery_date: "2026-06-19",
    last_updated_timestamp: "2026-06-14T09:00:00Z",
    delivery_location: null,
    delay_reason: "Stock unavailable",
    next_action: "Refund initiated for original order; replacement dispatched"
  },

  "FLP1007": {
    order_id: "FLP1007",
    current_state: "SLA Breached",
    promised_delivery_date: "2026-06-08",
    last_updated_timestamp: "2026-06-09T12:00:00Z",
    delivery_location: null,
    delay_reason: "Seller dispatch delay",
    next_action: "Escalated to seller"
  },

  // Stale data example — last_updated more than 6 hours ago relative to "now"
  "FLP1008": {
    order_id: "FLP1008",
    current_state: "Shipped",
    promised_delivery_date: "2026-06-16",
    last_updated_timestamp: "2026-06-14T20:00:00Z",
    delivery_location: "Shipped from Delhi warehouse",
    delay_reason: null,
    next_action: null
  }
};

module.exports = mockOrders;