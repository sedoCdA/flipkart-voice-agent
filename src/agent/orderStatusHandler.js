const getOrderStatus = require("../tools/getOrderStatus");

/**
 * Extracts an order ID from free-form text.
 * Flipkart order IDs in this system follow the pattern FLP followed by digits.
 * In production, this would be replaced/augmented by NLU entity extraction
 * or pulled from authenticated account context.
 *
 * @param {string} text
 * @returns {string|null}
 */
function extractOrderId(text) {
  if (!text) return null;
  const match = text.match(/FLP\d{3,}/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Tracks repeat-contact count for a given order within a session.
 * In production this would be backed by a session/ticket store.
 */
function getContactCount(sessionContext, orderId) {
  if (!sessionContext.contactCounts) sessionContext.contactCounts = {};
  sessionContext.contactCounts[orderId] = (sessionContext.contactCounts[orderId] || 0) + 1;
  return sessionContext.contactCounts[orderId];
}

/**
 * Determines whether escalation should be triggered based on
 * the retrieved order data and session context.
 *
 * @param {object} orderData
 * @param {number} contactCount
 * @returns {{shouldEscalate: boolean, reasons: string[]}}
 */
function checkEscalationTriggers(orderData, contactCount) {
  const reasons = [];

  if (orderData.current_state === "SLA Breached") {
    reasons.push("SLA breached with no shipment progress");
  }

  if (
    orderData.current_state === "Re-shipment Initiated" &&
    orderData.next_action &&
    orderData.next_action.toLowerCase().includes("refund")
  ) {
    // Original order undelivered, re-shipment in motion
    reasons.push("Re-shipment initiated; original order undelivered");
  }

  if (contactCount >= 2) {
    reasons.push("Customer has contacted support 2+ times about this order");
  }

  return {
    shouldEscalate: reasons.length > 0,
    reasons
  };
}

/**
 * Builds the grounded context block to inject into the conversation
 * before the LLM generates its response. This is the single source
 * of truth the model is instructed to rely on.
 *
 * @param {string} orderId
 * @param {object} sessionContext - mutable session state (contact counts, history)
 * @returns {Promise<object>} { contextBlock, escalation, retrievalResult }
 */
async function buildOrderContext(orderId, sessionContext = {}) {
  const retrievalResult = await getOrderStatus(orderId);
  const contactCount = getContactCount(sessionContext, orderId);

  if (!retrievalResult.success) {
    return {
      contextBlock: `RETRIEVED ORDER DATA:\nRetrieval FAILED for order ${orderId}. Error: ${retrievalResult.error}. ${retrievalResult.message}\n\nInstruction: Inform the customer you cannot get a live update right now and escalate to a human agent. Do not guess at status.`,
      escalation: { shouldEscalate: true, reasons: ["Order data retrieval failed"] },
      retrievalResult
    };
  }

  const data = retrievalResult.data;
  const escalation = checkEscalationTriggers(data, contactCount);

  const contextBlock = `RETRIEVED ORDER DATA (source of truth, do not deviate):
order_id: ${data.order_id}
current_state: ${data.current_state}
promised_delivery_date: ${data.promised_delivery_date}
last_updated_timestamp: ${data.last_updated_timestamp}
is_stale: ${data.is_stale}
hours_since_update: ${data.hours_since_update}
delivery_location: ${data.delivery_location ?? "not available"}
eta: ${data.eta ?? "not available"}
new_expected_delivery_date: ${data.new_expected_delivery_date ?? "not applicable"}
delay_reason: ${data.delay_reason ?? "not specified"}
next_action: ${data.next_action ?? "none"}

SESSION CONTEXT:
customer_contact_count_for_this_order: ${contactCount}
escalation_required: ${escalation.shouldEscalate}
escalation_reasons: ${escalation.reasons.join("; ") || "none"}`;

  return { contextBlock, escalation, retrievalResult };
}

module.exports = {
  extractOrderId,
  buildOrderContext,
  checkEscalationTriggers,
  getContactCount
};