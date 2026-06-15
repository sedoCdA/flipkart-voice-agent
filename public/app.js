// DOM Elements
const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const buttonLabel = document.getElementById("buttonLabel");
const transcriptEl = document.getElementById("transcript");
const clearBtn = document.getElementById("clearBtn");
const resetBtn = document.getElementById("resetBtn");
const errorContainer = document.getElementById("errorContainer");

// Session and State
const sessionId = "session-" + Math.random().toString(36).slice(2, 9);
let conversationStarted = false;
let isListening = false;
let isSpeaking = false;
let recognitionActive = false;

console.log("App initialized with Session ID:", sessionId);

// --- Speech Recognition (STT) Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

function initRecognition() {
  if (!SpeechRecognition) {
    showError("❌ Speech Recognition not supported. Use Chrome, Edge, or Safari on a desktop/mobile device.");
    micBtn.disabled = true;
    statusEl.textContent = "Not supported";
    return false;
  }

  try {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN"; // Indian English

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started");
      isListening = true;
      recognitionActive = true;
      micBtn.classList.add("listening");
      micBtn.classList.remove("speaking");
      updateStatusIndicator("listening");
      statusEl.textContent = "🎤 Listening... Speak now!";
      buttonLabel.textContent = "Listening...";
      clearError();
    };

    recognition.onresult = (event) => {
      console.log("Recognition result event:", event);
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(`Result ${i}: ${transcript} (final: ${event.results[i].isFinal})`);

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Update UI with interim results
      if (interimTranscript) {
        statusEl.textContent = "📝 Heard: " + interimTranscript;
      }

      // Process final result
      if (finalTranscript.trim()) {
        finalTranscript = finalTranscript.trim();
        console.log("✅ Final transcript:", finalTranscript);
        
        if (!conversationStarted) {
          conversationStarted = true;
          transcriptEl.innerHTML = "";
        }

        addMessage("user", finalTranscript);
        handleUserMessage(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("🔴 Speech Recognition Error:", event.error);
      isListening = false;
      recognitionActive = false;
      micBtn.classList.remove("listening");
      updateStatusIndicator("idle");

      const errorMap = {
        "network-error": "Network error - check your internet connection",
        "no-speech": "No speech detected - please speak louder and try again",
        "audio-capture": "Microphone not found - check your device",
        "not-allowed": "Microphone access denied - enable permissions in browser settings",
        "service-not-allowed": "Speech service not available in your region",
        "bad-grammar": "Recognition error - try again",
        "aborted": "Speech recognition cancelled"
      };

      const errorMsg = errorMap[event.error] || `Error: ${event.error}`;
      console.error("Error message:", errorMsg);
      showError("⚠️ " + errorMsg);
      statusEl.textContent = "❌ " + errorMsg;
      buttonLabel.textContent = "Try again";
    };

    recognition.onend = () => {
      console.log("🛑 Speech recognition ended");
      isListening = false;
      if (!recognitionActive) {
        micBtn.classList.remove("listening");
      }
      if (!isSpeaking) {
        updateStatusIndicator("idle");
        statusEl.textContent = "Ready to help";
        buttonLabel.textContent = "Click to speak";
      }
    };

    return true;
  } catch (err) {
    console.error("❌ Error initializing recognition:", err);
    showError("Failed to initialize speech recognition: " + err.message);
    return false;
  }
}

// Initialize recognition on page load
if (!initRecognition()) {
  micBtn.disabled = true;
}

micBtn.addEventListener("click", () => {
  console.log("Mic button clicked. isListening:", isListening, "isSpeaking:", isSpeaking);
  clearError();

  if (isSpeaking) {
    showError("⏳ Still speaking... wait for the response to finish");
    return;
  }

  if (!isListening && recognition) {
    try {
      recognitionActive = true;
      recognition.start();
      console.log("✓ Recognition started");
    } catch (err) {
      console.error("Error starting recognition:", err);
      showError("Could not start speech recognition: " + err.message);
    }
  } else if (isListening && recognition) {
    try {
      recognition.stop();
      console.log("✓ Recognition stopped");
    } catch (err) {
      console.error("Error stopping recognition:", err);
    }
  }
});

// --- Send message to backend ---
async function handleUserMessage(message) {
  statusEl.textContent = "⏳ Processing...";
  buttonLabel.textContent = "Processing...";
  updateStatusIndicator("thinking");

  try {
    const reply = await sendToAgent(message);
    console.log("Agent replied:", reply);
    
    if (!reply) {
      throw new Error("Empty response from agent");
    }

    addMessage("agent", reply);
    await speakResponse(reply);
    
    statusEl.textContent = "Ready to help";
    buttonLabel.textContent = "Click to speak";
    updateStatusIndicator("idle");
  } catch (err) {
    console.error("Error handling message:", err);
    showError("❌ " + err.message);
    statusEl.textContent = "Error - Try again";
    buttonLabel.textContent = "Try again";
    updateStatusIndicator("error");
  }
}

async function sendToAgent(message) {
  console.log("Sending to agent:", message);
  
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Agent response:", data);

    if (!data.reply) {
      throw new Error("No response from agent");
    }

    return data.reply;
  } catch (err) {
    console.error("API Error:", err);
    throw new Error("Failed to connect to support: " + err.message);
  }
}

// --- Text-to-Speech (TTS) ---
async function speakResponse(text) {
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        throw new Error("Speech Synthesis not supported in this browser");
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      isSpeaking = true;
      micBtn.classList.add("speaking");
      statusEl.textContent = "🔊 Speaking...";
      buttonLabel.textContent = "Speaking...";
      updateStatusIndicator("speaking");

      console.log("TTS: Speaking text:", text);

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice
      utterance.lang = "en-IN";
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to select Indian English voice
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices.length);
      
      let selectedVoice = null;
      
      // Priority 1: Indian English
      selectedVoice = voices.find(v => v.lang.includes("en-IN"));
      console.log("Indian English voice found:", !!selectedVoice);
      
      // Priority 2: English
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes("en-GB") || v.lang.includes("en-US"));
        console.log("English voice found:", !!selectedVoice);
      }
      
      // Priority 3: Any English variant
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith("en"));
        console.log("Any English variant found:", !!selectedVoice);
      }
      
      // Default to first available voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        console.log("Using default voice:", selectedVoice.name);
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("Using voice:", selectedVoice.name, selectedVoice.lang);
      } else {
        console.warn("No voice found, using system default");
      }

      utterance.onstart = () => {
        console.log("🔊 Speech synthesis started");
        updateStatusIndicator("speaking");
      };

      utterance.onend = () => {
        console.log("🔊 Speech synthesis ended");
        isSpeaking = false;
        micBtn.classList.remove("speaking");
        updateStatusIndicator("idle");
        resolve();
      };

      utterance.onerror = (event) => {
        console.error("🔴 Speech Synthesis Error:", event.error);
        isSpeaking = false;
        micBtn.classList.remove("speaking");
        updateStatusIndicator("error");
        reject(new Error("Speech output failed: " + event.error));
      };

      window.speechSynthesis.speak(utterance);
      console.log("✓ Speech utterance queued");
    } catch (err) {
      console.error("TTS Error:", err);
      isSpeaking = false;
      micBtn.classList.remove("speaking");
      updateStatusIndicator("error");
      reject(err);
    }
  });
}

// Load voices when available
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log("Voices loaded:", voices.length);
  };
  
  // Trigger voice loading
  const voices = window.speechSynthesis.getVoices();
  console.log("Initial voices available:", voices.length);
}

// --- UI Controls ---
clearBtn.addEventListener("click", () => {
  console.log("Clear button clicked");
  if (!conversationStarted) {
    transcriptEl.innerHTML = '<div class="empty-transcript">👋 Click the microphone and speak naturally to get support for your orders</div>';
  } else {
    transcriptEl.innerHTML = "";
    conversationStarted = false;
  }
  clearError();
});

resetBtn.addEventListener("click", async () => {
  console.log("Reset button clicked");
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    conversationStarted = false;
    transcriptEl.innerHTML = '<div class="empty-transcript">👋 Click the microphone and speak naturally to get support for your orders</div>';
    statusEl.textContent = "Ready to help";
    buttonLabel.textContent = "Click to speak";
    updateStatusIndicator("idle");
    clearError();
    console.log("✓ Session reset");
  } catch (err) {
    console.error("Reset error:", err);
    showError("Failed to reset session: " + err.message);
  }
});

// --- UI Helpers ---
function addMessage(role, text) {
  if (!conversationStarted && role === "user") {
    conversationStarted = true;
    transcriptEl.innerHTML = "";
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const labelDiv = document.createElement("div");
  labelDiv.className = "message-label";
  labelDiv.textContent = role === "user" ? "You" : "Support Agent";

  const contentDiv = document.createElement("div");
  contentDiv.textContent = text;

  messageDiv.appendChild(labelDiv);
  messageDiv.appendChild(contentDiv);
  transcriptEl.appendChild(messageDiv);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;

  console.log(`Message added (${role}):`, text.substring(0, 50) + "...");
}

function showError(message) {
  console.warn("Error shown:", message);
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message show";
  errorDiv.textContent = message;
  errorContainer.innerHTML = "";
  errorContainer.appendChild(errorDiv);
  
  // Auto-clear error after 5 seconds
  setTimeout(() => {
    errorDiv.classList.remove("show");
  }, 5000);
}

function clearError() {
  const errors = document.querySelectorAll(".error-message");
  errors.forEach(err => err.classList.remove("show"));
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

// Log initial state
console.log("App loaded. Browser supports:");
console.log("- Speech Recognition:", !!SpeechRecognition);
console.log("- Speech Synthesis:", !!window.speechSynthesis);
console.log("- WebAPI:", typeof navigator !== "undefined");