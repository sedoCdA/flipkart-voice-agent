# 🎤 Flipkart Voice Support Agent

A professional voice-based AI assistant for Flipkart customer support powered by Groq LLM, featuring full speech recognition (STT) and text-to-speech (TTS) capabilities.

## ✨ Features

- **🎙️ Speech-to-Text (STT)** - Real-time speech recognition using Web Speech API
- **🔊 Text-to-Speech (TTS)** - Natural voice output with multi-language support
- **🎨 Flipkart-Themed UI** - Professional, responsive design with Flipkart branding
- **💬 Order Status Tracking** - Intelligent order detection and context-aware responses
- **⚡ AI-Powered** - Groq LLM for intelligent customer support
- **📱 Mobile-Friendly** - Fully responsive design for all devices
- **🔄 Session Management** - Multi-turn conversations with context preservation
- **⚠️ Error Handling** - Comprehensive error messages and recovery options

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Groq API Key (get one at https://console.groq.com)
- Modern browser (Chrome, Edge, or Safari)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sedoCdA/flipkart-voice-agent.git
   cd flipkart-voice-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Edit .env file and add your Groq API key
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Basic Flow
1. Click the blue microphone button to start speaking
2. Say your message clearly (e.g., "Check my order FKP001")
3. The agent will listen, process, and respond with audio
4. Continue the conversation naturally

### Voice Commands Examples
- "What's the status of my order?"
- "Check order FKP001"
- "When will my package arrive?"
- "I need help with my Flipkart order"

### UI Controls
- **🎤 Microphone Button** - Click to speak
- **Clear** - Clear conversation history
- **Reset** - Start a new session

## 🏗️ Project Structure

```
flipkart-voice-agent/
├── src/
│   ├── agent/
│   │   ├── systemPrompt.js      # AI system instructions
│   │   └── orderStatusHandler.js # Order context builder
│   ├── tools/
│   │   ├── getOrderStatus.js    # Order lookup tool
│   │   └── utils/
│   │       ├── ttsCleanup.js    # Speech-friendly text processing
│   │       └── ttsCleanup.test.js
│   ├── data/
│   │   └── mockOrders.js        # Sample order data
│   ├── server.js                # Express server & API endpoints
│   └── index.js                 # CLI interface (optional)
├── public/
│   ├── index.html               # Flipkart-themed UI
│   └── app.js                   # Frontend logic (STT/TTS)
├── package.json
├── .env
└── README.md
```

## 🔧 API Endpoints

### POST `/api/chat`
Send a message to the voice agent and get a response.

**Request:**
```json
{
  "sessionId": "session-xyz123",
  "message": "Check my order status"
}
```

**Response:**
```json
{
  "reply": "Your order FKP001 is currently in transit..."
}
```

### POST `/api/reset`
Reset the conversation session.

**Request:**
```json
{
  "sessionId": "session-xyz123"
}
```

**Response:**
```json
{
  "status": "reset"
}
```

## 🧠 How It Works

### Architecture Flow
```
User Voice Input
    ↓
Web Speech API (STT)
    ↓
User Transcript
    ↓
POST /api/chat
    ↓
Order Context Detection
    ↓
Groq LLM Processing
    ↓
AI Response
    ↓
Text Cleanup
    ↓
Web Speech Synthesis API (TTS)
    ↓
User Hears Response
```

### Key Components

**Speech Recognition (STT)**
- Uses Web Speech API (native browser support)
- Supports 95+ languages
- Configured for Indian English (en-IN)

**Text-to-Speech (TTS)**
- Uses Web Speech Synthesis API
- Automatic voice selection (prefers Indian English)
- Cleaned text processing for natural speech

**Order Context**
- Extracts order IDs from conversation
- Builds rich context from mock database
- Maintains conversation state per session

**AI Engine**
- Groq LLM (llama-3.3-70b-versatile model)
- System prompts ensure customer-focused responses
- Temperature set to 0.4 for consistency

## 📝 Configuration

### .env File
```env
# Groq API Configuration
GROQ_API_KEY=gsk_your_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### TTS Voice Selection
The app automatically selects:
1. Indian English voice (en-IN) if available
2. Fallback to English voice (en)
3. System default voice if needed

## 🐛 Troubleshooting

### Microphone not working
- ✅ Check browser microphone permissions
- ✅ Use Chrome, Edge, or Safari (not Firefox)
- ✅ Ensure HTTPS in production

### No speech output
- ✅ Check system volume
- ✅ Verify speaker/audio output
- ✅ Try a different voice in browser settings
- ✅ Some languages may have limited TTS support

### API errors
- ✅ Verify Groq API key in `.env`
- ✅ Check internet connection
- ✅ Ensure server is running (`npm start`)
- ✅ Check browser console for details

## 📊 Dependencies

- **Express.js** - Web server framework
- **Groq SDK** - LLM API client
- **CORS** - Cross-origin request handling
- **dotenv** - Environment configuration

## 🧪 Development

### Start with auto-reload
```bash
npm run dev
```

### Run tests
```bash
npm test
```

### Debug mode
```bash
NODE_ENV=development npm start
```

## 🚢 Deployment

### Production Build
```bash
NODE_ENV=production npm start
```

### Docker (Optional)
```bash
docker build -t flipkart-voice-agent .
docker run -p 3000:3000 -e GROQ_API_KEY=your_key flipkart-voice-agent
```

## 📜 License

ISC

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs (F12 in browser)
3. Verify API key and network connection
4. Create an issue on GitHub

## 🎯 Roadmap

- [ ] Support for multiple Indian languages
- [ ] Real Flipkart API integration
- [ ] Advanced order analytics
- [ ] Multi-agent support
- [ ] SMS/Email notifications
- [ ] Custom TTS voices
- [ ] Voice activity detection (VAD)
- [ ] Real-time transcription display

---

**Built with ❤️ for Flipkart customers**
