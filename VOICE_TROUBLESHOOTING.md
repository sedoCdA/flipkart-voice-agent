# 🎤 Voice Troubleshooting Guide

This guide helps you debug Speech-to-Text (STT) and Text-to-Speech (TTS) issues.

## Quick Diagnostics

### 1. Check Browser Support

**Open Browser Console (F12)** and check these lines logged on page load:

```javascript
// App loaded. Browser supports:
// - Speech Recognition: true/false
// - Speech Synthesis: true/false
// - WebAPI: true
```

**Supported Browsers:**
- ✅ Chrome/Chromium 25+
- ✅ Edge 79+
- ✅ Safari 14.1+ (iOS & macOS)
- ✅ Opera 27+
- ❌ Firefox (limited support)
- ❌ Internet Explorer

### 2. Microphone & Speaker Check

**In Chrome/Edge:**
1. Open Settings (⚙️) → Privacy and security → Site settings
2. Find `localhost:3000`
3. Ensure **Microphone** is "Allow"
4. Ensure **Speaker output** is working in Windows/macOS sound settings

**Test microphone:**
```bash
# On Windows
volume mixer  # Check if app has audio input permission
```

**Test speakers:**
- Play any audio on your device before testing TTS

### 3. Real-Time Debugging

#### Enable Console Logs

Open DevTools (F12 → Console) and watch for these messages:

**When clicking mic button:**
```
✓ Recognition started
🎤 Speech recognition started
```

**When speaking:**
```
Recognition result event: SpeechRecognitionEvent {…}
Result 0: hello (final: false)
Result 1: hello world (final: true)
✅ Final transcript: hello world
```

**When API responds:**
```
Sending to agent: hello world
Agent response: {reply: "I can see your order..."}
```

**When TTS starts:**
```
TTS: Speaking text: I can see your order...
Available voices: 8
Indian English voice found: true
Using voice: Google Español (en-IN)
✓ Speech synthesis started
```

## Common Issues & Solutions

### Issue: "Speech Recognition not supported"

**Cause:** Browser doesn't support Web Speech API

**Solution:**
- Use Chrome, Edge, or Safari on desktop
- On mobile: Safari (iOS) or Chrome (Android)
- Check browser version is up to date

```javascript
// Check in console
window.SpeechRecognition || window.webkitSpeechRecognition
// Should return a function, not undefined
```

### Issue: Microphone says "Not Allowed"

**Cause:** Browser permission not granted

**Solution:**

**Chrome/Edge:**
1. Click address bar (left side)
2. Look for microphone icon with ⊘
3. Click it and select "Allow"
4. Refresh page

**Safari (macOS):**
1. System Preferences → Security & Privacy → Microphone
2. Find "Safari" and check it's allowed

**Safari (iOS):**
1. Settings → Safari → Microphone
2. Make sure it's enabled

### Issue: Listens but says "No speech detected"

**Cause:** Microphone not properly detected or volume too low

**Solution:**
1. **Check physical mic:** Test in Discord/Teams first
2. **Speak louder and clearer:** Speak 12 inches from mic
3. **Check Windows volume:**
   - Right-click volume icon in taskbar
   - Open Sound settings
   - Check microphone level is > 50%
4. **Try different mic:** Use built-in mic if using external

```bash
# Windows - Test recording
# Use Windows Voice Recorder app to verify mic works
```

### Issue: Mic listens but TTS doesn't play

**Cause:** Speaker/headphones not working or volume is muted

**Solution:**
1. **Check Windows volume:** Right-click speaker → Open Volume mixer
2. **Unmute browser:** Look for speaker icon in address bar
3. **Test speakers:** Play YouTube video or music
4. **Increase volume:** System volume should be > 50%

```javascript
// Check in console
window.speechSynthesis.getVoices().length
// Should return > 0 (number of available voices)
```

### Issue: Speech plays but garbled/robotic

**Cause:** Wrong voice selected or rate too fast

**Solution:**
1. Check console for: `Using voice: [voice name]`
2. If using wrong language, refresh page
3. Current rate is 0.9x (slower than normal)

```javascript
// Force voice reload
window.speechSynthesis.getVoices()
// If returns empty, voices not loaded yet
// They load after first interaction
```

### Issue: Backend returns error

**Cause:** Groq API key missing or invalid

**Solution:**
1. Check `.env` file has valid `GROQ_API_KEY`
2. Verify API key from https://console.groq.com
3. Restart server: `npm start`
4. Check server logs for errors

```bash
# In terminal
echo %GROQ_API_KEY%  # Windows
echo $GROQ_API_KEY   # macOS/Linux
# Should show your API key, not empty
```

## Advanced Debugging

### Enable Full Logging

Add this to `public/app.js` after line 1:

```javascript
// Override console for debugging
const originalLog = console.log;
const logs = [];
console.log = function(...args) {
  logs.push(args);
  originalLog.apply(console, args);
};

// View logs
window.debugLogs = () => logs.forEach(log => console.log(...log));
```

Then in console:
```javascript
debugLogs()  // Show all logs
```

### Test Each Component

**Test STT Only:**
```javascript
// In console
recognition.start()
// Speak into mic, should see transcripts appear
```

**Test TTS Only:**
```javascript
// In console
const utterance = new SpeechSynthesisUtterance("Hello, this is a test");
speechSynthesis.speak(utterance)
// Should hear voice output
```

**Test API Connection:**
```javascript
// In console
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: 'test', message: 'Check order FLP1001' })
}).then(r => r.json()).then(console.log)
```

### Check Network Requests

1. Open DevTools (F12 → Network tab)
2. Click mic button
3. Look for POST request to `/api/chat`
4. Check:
   - **Status:** Should be 200
   - **Response:** Should contain `reply` field
   - **Time:** Should be < 5 seconds

### Monitor Microphone Access

**Windows:**
```powershell
# Check app permissions
Get-AppxPackageManifest *edgemicrosoftaccount | Format-Xml
```

**macOS:**
```bash
# Check microphone usage
log show --predicate 'eventMessage contains "Microphone"' --info
```

## Testing Voice Features

### 1. Basic Voice Test

1. Open http://localhost:3000
2. Click blue microphone button
3. Say: "Check order FLP1001"
4. Wait for response
5. You should hear: "I can see your order FLP1001..."

### 2. Error Handling Test

**Test network error:**
```bash
# Stop server
npm stop
# Click mic button → Should show error
npm start  # Restart
```

**Test microphone error:**
- Disconnect microphone
- Click mic button → Should show "Microphone not found"
- Reconnect microphone
- Refresh page
- Try again

### 3. Multi-turn Conversation

1. Say: "What's the status of my order?"
2. Say: "It's order FLP1002"
3. Verify context is maintained

### 4. Voice Clarity Test

Speak these phrases:
- "FLP1001" (order ID)
- "Is my order FLP1003 delivered?" (natural sentence)
- "Check my delivery" (requires context)

## Performance Tips

1. **Enable hardware acceleration in browser:**
   - Chrome: Settings → Advanced → Scroll down → Hardware acceleration ON

2. **Use modern audio drivers:**
   - Update audio drivers from motherboard/headset manufacturer

3. **Reduce background noise:**
   - Use noise-cancelling microphone
   - Close other browser tabs
   - Reduce system volume

4. **Optimize for mobile:**
   - Use high-quality microphone
   - Ensure good WiFi connection
   - Test on 4G/5G if needed

## Still Not Working?

1. **Collect Debug Info:**
   ```javascript
   // In console, run:
   console.log('Browser:', navigator.userAgent)
   console.log('Mic Support:', !!navigator.mediaDevices?.getUserMedia)
   console.log('TTS Support:', !!window.speechSynthesis)
   console.log('STT Support:', !!(window.SpeechRecognition || window.webkitSpeechRecognition))
   ```

2. **Check Server Status:**
   ```bash
   # Terminal
   npm start
   # Should see: "Server running on http://localhost:3000"
   ```

3. **View Full Error Details:**
   - Press F12
   - Click Console tab
   - Reload page
   - Share all error messages

4. **Create a Minimal Test:**
   ```html
   <!-- Save as test.html -->
   <button onclick="
     const u = new SpeechSynthesisUtterance('Test speech');
     speechSynthesis.speak(u)
   ">Test TTS</button>
   ```

## Support

If issues persist:
1. Check this guide
2. Review browser console (F12)
3. Verify microphone works in other apps
4. Try different browser
5. Check GitHub issues: https://github.com/sedoCdA/flipkart-voice-agent/issues

---

**Last Updated:** 2026-06-15
