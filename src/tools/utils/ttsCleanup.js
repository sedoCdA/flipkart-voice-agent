/**
 * Cleans LLM output text for natural text-to-speech playback.
 * Strips markdown artifacts and normalizes symbols/abbreviations
 * that read awkwardly when spoken aloud.
 *
 * @param {string} text
 * @returns {string}
 */
function cleanForSpeech(text) {
  if (!text) return text;

  let cleaned = text;

  // Strip markdown bold/italic/headers if the model slips into them
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1");
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");

  // Remove bullet/numbered list markers
  cleaned = cleaned.replace(/^[\s]*[-*•]\s+/gm, "");
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, "");

  // Normalize common abbreviations
  cleaned = cleaned.replace(/\be\.g\.(?=\s|$)/gi, "for example");
  cleaned = cleaned.replace(/\bi\.e\.(?=\s|$)/gi, "that is");
  cleaned = cleaned.replace(/\betc\.(?=\s|$)/gi, "and so on");

  // Normalize symbols
  cleaned = cleaned.replace(/&/g, "and");
  cleaned = cleaned.replace(/%/g, " percent");
  cleaned = cleaned.replace(/\$(\d+)/g, "$1 dollars");
  cleaned = cleaned.replace(/₹(\d+)/g, "$1 rupees");

  // Collapse multiple newlines/spaces (voice has no use for paragraph breaks)
  cleaned = cleaned.replace(/\n{2,}/g, " ");
  cleaned = cleaned.replace(/\n/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  return cleaned.trim();
}

module.exports = { cleanForSpeech };