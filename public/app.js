const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const clearBtn = document.getElementById("clearBtn");
const resetBtn = document.getElementById("resetBtn");
const errorContainer = document.getElementById("errorContainer");

const sessionId = "session-" + Math.random().toString(36).slice(2);
let conversationStarted = false;

// --- Speech Recognition (STT) setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;
let isSpeaking = false;

if (!SpeechRecognition) {
  showError("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
  micBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    micBtn.classList.remove("speaking");
    updateStatusIndicator("listening");
    statusEl.textContent = "🎤 Listening...";
    clearError();
  };

  recognition.onerror = (event) => {
    isListening = false;
    micBtn.classList.remove("listening");
    updateStatusIndicator("idle");
    
    const errorMap = {
      "network-error": "Network error. Please check your connection.",
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "Microphone not found. Please check permissions.",
      "not-allowed": "Microphone access denied. Please enable it in settings.",
      "service-not-allowed": "Speech service not available."
    };
    
    const errorMsg = errorMap[event.error] || `Error: ${event.error}`;
    showError(errorMsg);
    statusEl.textContent = "❌ " + errorMsg;
  };

  recognition.onend = () => {
    isListening = false;
    if (!isSpeaking) {
      micBtn.classList.remove("listening");
      updateStatusIndicator("idle");
      statusEl.textContent = "Ready to help";
    }
  };

  recognition.onresult = async (event) => {
    let transcript = "";
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript + " ";
      }
    }

    transcript = transcript.trim();

    if (transcript && event.results[event.results.length - 1].isFinal) {
      isListening = false;
      addMessage("user", transcript);
      
      if (!conversationStarted) {
        conversationStarted = true;
        transcriptEl.innerHTML = "";
      }

      statusEl.textContent = "⏳ Processing...";
      updateStatusIndicator("thinking");

      try {
        const reply = await sendToAgent(transcript);
        addMessage("agent", reply);
        
        statusEl.textContent = "🔊 Speaking...";
        updateStatusIndicator("speaking");
        await speak(reply);
        
        statusEl.textContent = "Ready to help";
        updateStatusIndicator("idle");
      } catch (err) {
        showError("Failed to get response. Please try again.");
        statusEl.textContent = "❌ Error occurred";
        updateStatusIndicator("error");
      }
    }
  };
}

micBtn.addEventListener("click", () => {
  clearError();
  if (recognition && !isListening && !isSpeaking) {
    recognition.start();
  }
});

clearBtn.addEventListener("click", () => {
  if (!conversationStarted) {
    transcriptEl.innerHTML = '<div class="empty-state">👋 Start speaking to connect with Flipkart support</div>';
  } else {
    transcriptEl.innerHTML = "";
  }
  clearError();
});

resetBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    conversationStarted = false;
    transcriptEl.innerHTML = '<div class="empty-state">👋 Start speaking to connect with Flipkart support</div>';
    statusEl.textContent = "Ready to help";
    updateStatusIndicator("idle");
    clearError();
  } catch (err) {
    showError("Failed to reset session.");
  }
});

// --- Send message to backend ---
async function sendToAgent(message) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.reply || "I didn't understand that. Could you repeat?";
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

// --- Text-to-Speech (TTS) ---
function speak(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    window.speechSynthesis.cancel();
    isSpeaking = true;
    micBtn.classList.add("speaking");

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get voices and prefer Indian English if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes("en-IN"));
    const englishVoice = voices.find(v => v.lang.includes("en"));
    
    utterance.voice = indianVoice || englishVoice || voices[0];
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      updateStatusIndicator("speaking");
    };

    utterance.onend = () => {
      isSpeaking = false;
      micBtn.classList.remove("speaking");
      updateStatusIndicator("idle");
      resolve();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      micBtn.classList.remove("speaking");
      console.error("TTS Error:", event.error);
      reject(new Error(event.error));
    };

    window.speechSynthesis.speak(utterance);
  });
}

// --- Load voices when available ---
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// --- UI helpers ---
function addMessage(role, text) {
  if (!conversationStarted && role === "user") {
    conversationStarted = true;
    transcriptEl.innerHTML = "";
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const labelDiv = document.createElement("div");
  labelDiv.className = "message-label";
  labelDiv.textContent = role === "user" ? "You" : "Flipkart Support";

  const contentDiv = document.createElement("div");
  contentDiv.textContent = text;

  messageDiv.appendChild(labelDiv);
  messageDiv.appendChild(contentDiv);
  transcriptEl.appendChild(messageDiv);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = "⚠️ " + message;
  errorContainer.innerHTML = "";
  errorContainer.appendChild(errorDiv);
}

function clearError() {
  errorContainer.innerHTML = "";
}

function updateStatusIndicator() {
  const statusDot = document.querySelector(".status-dot");
  if (!statusDot) return;

  statusDot.classList.remove("active", "listening", "speaking");
  
  if (isListening) {
    statusDot.classList.add("listening");
  } else if (isSpeaking) {
    statusDot.classList.add("speaking");
  } else if (conversationStarted) {
    statusDot.classList.add("active");
  }
}