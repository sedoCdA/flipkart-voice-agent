const { cleanForSpeech } = require("./ttsCleanup");

describe("cleanForSpeech", () => {
  test("strips bold markdown", () => {
    expect(cleanForSpeech("Your order is **delayed**")).toBe("Your order is delayed");
  });

  test("strips bullet points", () => {
    expect(cleanForSpeech("- item one\n- item two")).toBe("item one item two");
  });

  test("expands e.g. and etc.", () => {
    expect(cleanForSpeech("Issues like e.g. delays, etc. are common")).toBe(
      "Issues like for example delays, and so on are common"
    );
  });

  test("converts currency symbols", () => {
    expect(cleanForSpeech("Refund of $50 issued")).toBe("Refund of 50 dollars issued");
    expect(cleanForSpeech("Refund of ₹500 issued")).toBe("Refund of 500 rupees issued");
  });

  test("collapses newlines and extra spaces", () => {
    expect(cleanForSpeech("Line one\n\nLine two   here")).toBe("Line one Line two here");
  });

  test("handles empty/null input safely", () => {
    expect(cleanForSpeech("")).toBe("");
    expect(cleanForSpeech(null)).toBeNull();
  });
});