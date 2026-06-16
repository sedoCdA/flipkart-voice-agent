const { buildOrderContext, checkEscalationTriggers, extractOrderId, getContactCount } = require("./orderStatusHandler");

describe("extractOrderId", () => {
  test("extracts a valid order ID from text", () => {
    expect(extractOrderId("Check order FLP1006 please")).toBe("FLP1006");
  });

  test("returns null when no order ID present", () => {
    expect(extractOrderId("Where is my order?")).toBeNull();
  });

  test("is case-insensitive", () => {
    expect(extractOrderId("flp1003 status")).toBe("FLP1003");
  });

  test("handles spaced order IDs like flp 1003", () => {
    expect(extractOrderId("hello what is the status of my order flp 1003")).toBe("FLP1003");
  });
});

describe("checkEscalationTriggers", () => {
  test("flags SLA breached orders", () => {
    const result = checkEscalationTriggers({ current_state: "SLA Breached", is_stale: false }, 1);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reasons).toContain("SLA breached with no shipment progress");
  });

  test("flags stale data", () => {
    const result = checkEscalationTriggers({ current_state: "Shipped", is_stale: true }, 1);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reasons).toContain("Order data is stale (no live update available)");
  });

  test("flags repeat contact (2+)", () => {
    const result = checkEscalationTriggers({ current_state: "Processing", is_stale: false }, 2);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reasons).toContain("Customer has contacted support 2+ times about this order");
  });

  test("does not escalate for healthy In Transit order, first contact", () => {
    const result = checkEscalationTriggers({ current_state: "In Transit", is_stale: false }, 1);
    expect(result.shouldEscalate).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  test("flags re-shipment with refund as undelivered original", () => {
    const result = checkEscalationTriggers(
      { current_state: "Re-shipment Initiated", is_stale: false, next_action: "Refund initiated for original order" },
      1
    );
    expect(result.shouldEscalate).toBe(true);
    expect(result.reasons).toContain("Re-shipment initiated; original order undelivered");
  });
});

describe("buildOrderContext", () => {
  test("returns failure context for unknown order", async () => {
    const { contextBlock, escalation } = await buildOrderContext("FLP9999", {});
    expect(escalation.shouldEscalate).toBe(true);
    expect(contextBlock).toContain("Retrieval FAILED");
  });

  test("returns success context with stale warning for FLP1008", async () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const { contextBlock, escalation, retrievalResult } = await buildOrderContext("FLP1008", {}, now);
    expect(retrievalResult.success).toBe(true);
    expect(retrievalResult.data.is_stale).toBe(true);
    expect(escalation.shouldEscalate).toBe(true);
    expect(contextBlock).toContain("DATA FRESHNESS WARNING");
  });

  test("returns success context without stale warning for FLP1002 (Out for Delivery)", async () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const { contextBlock, retrievalResult } = await buildOrderContext("FLP1002", {}, now);
    expect(retrievalResult.data.is_stale).toBe(false);
    expect(contextBlock).not.toContain("DATA FRESHNESS WARNING");
  });

  test("increments contact count across calls for same order in same session", async () => {
    const session = {};
    await buildOrderContext("FLP1007", session);
    const second = await buildOrderContext("FLP1007", session);
    expect(second.contextBlock).toContain("customer_contact_count_for_this_order: 2");
    expect(second.escalation.reasons).toContain("Customer has contacted support 2+ times about this order");
  });
});