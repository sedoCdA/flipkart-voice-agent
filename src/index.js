require("dotenv").config();
const readline = require("readline");
const Groq = require("groq-sdk");

const SYSTEM_PROMPT = require("./agent/systemPrompt");
const { extractOrderId, buildOrderContext } = require("./agent/orderStatusHandler");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Conversation state for this session
const conversationHistory = [];
const sessionContext = {}; // tracks contactCounts per order, etc.
let activeOrderId = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Flipkart Voice Support Agent (text simulation)");
console.log("Type your message. Type 'exit' to quit.\n");

function ask() {
  rl.question("You: ", async (userInput) => {
    if (userInput.trim().toLowerCase() === "exit") {
      rl.close();
      return;
    }

    await handleTurn(userInput);
    ask();
  });
}

async function handleTurn(userInput) {
  // Step 1: Try to identify/refresh the order ID from this message
  const detectedId = extractOrderId(userInput);
  if (detectedId) {
    activeOrderId = detectedId;
  }

  let injectedContext = "";

  // Step 2 & 3: If we have an order ID, retrieve data and build grounded context
  if (activeOrderId) {
    const { contextBlock } = await buildOrderContext(activeOrderId, sessionContext);
    injectedContext = `\n\n[SYSTEM NOTE - NOT VISIBLE TO CUSTOMER]\n${contextBlock}\n[END SYSTEM NOTE]`;
  } else {
    injectedContext = `\n\n[SYSTEM NOTE - NOT VISIBLE TO CUSTOMER]\nNo order ID identified yet. If the customer's query is order-specific, ask them for their order ID before proceeding.\n[END SYSTEM NOTE]`;
  }

  conversationHistory.push({
    role: "user",
    content: userInput + injectedContext
  });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory
      ]
    });

    const replyText = response.choices[0]?.message?.content || "";

    console.log(`\nAgent: ${replyText}\n`);

    conversationHistory.push({
      role: "assistant",
      content: replyText
    });
  } catch (err) {
    console.error("Error calling Groq API:", err.message);
    console.log(
      "\nAgent: I'm having trouble getting a live update on this right now. Let me connect you to someone who can check this directly.\n"
    );
  }
}

ask();