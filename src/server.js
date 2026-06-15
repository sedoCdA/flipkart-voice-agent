require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const SYSTEM_PROMPT = require("./agent/systemPrompt");
const { extractOrderId, buildOrderContext } = require("./agent/orderStatusHandler");
const { cleanForSpeech } = require("./tools/utils/ttsCleanup");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// In-memory session store (keyed by sessionId from frontend)
const sessions = {};

function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      conversationHistory: [],
      sessionContext: {},
      activeOrderId: null
    };
  }
  return sessions[sessionId];
}

app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  const session = getSession(sessionId);

  // Step 1: Detect/refresh order ID
  const detectedId = extractOrderId(message);
  if (detectedId) {
    session.activeOrderId = detectedId;
  }

  let injectedContext;
  if (session.activeOrderId) {
    const { contextBlock } = await buildOrderContext(session.activeOrderId, session.sessionContext);
    injectedContext = `\n\n[SYSTEM NOTE - NOT VISIBLE TO CUSTOMER]\n${contextBlock}\n[END SYSTEM NOTE]`;
  } else {
    injectedContext = `\n\n[SYSTEM NOTE - NOT VISIBLE TO CUSTOMER]\nNo order ID identified yet. If the customer's query is order-specific, ask them for their order ID before proceeding.\n[END SYSTEM NOTE]`;
  }

  session.conversationHistory.push({
    role: "user",
    content: message + injectedContext
  });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...session.conversationHistory
      ]
    });

    const rawReply = response.choices[0]?.message?.content || "";
    const replyText = cleanForSpeech(rawReply);

    session.conversationHistory.push({
      role: "assistant",
      content: replyText
    });

    res.json({ reply: replyText });
  } catch (err) {
    console.error("Groq API error:", err.message);
    res.json({
      reply: "I'm having trouble getting a live update right now. Let me connect you to someone who can check this directly."
    });
  }
});

app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  delete sessions[sessionId];
  res.json({ status: "reset" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});