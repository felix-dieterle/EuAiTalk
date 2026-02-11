# Error Handling and Backend Configuration

This document describes the error handling improvements and configurable backend functionality added to EuAiTalk.

## Features

### 1. Configurable Backend URL

Users can now configure the backend URL directly in the app settings, making it easy to:
- Connect to different backend servers
- Use the app with custom server deployments
- Switch between development and production servers

**How to configure:**
1. Click the settings button (⚙️) in the top right
2. Scroll to "Backend-URL" field
3. Enter your backend server URL (e.g., `http://192.168.1.100:3000`)
4. Click "Speichern" (Save)
5. Leave empty to use the default (same server as the web app)

### 2. Enhanced Error Handling

The app now provides clear, user-friendly error messages for common issues:

#### Network Errors
- **Server unreachable**: Clear message explaining the server cannot be reached
- **Timeout**: Notification when requests take too long (30-second timeout)
- **Offline mode**: Automatic detection when device goes offline

#### HTTP Errors
- **429 Too Many Requests**: User-friendly message about rate limits
- **500 Server Error**: Clear indication of server-side issues
- **Other errors**: Descriptive messages for various error states

### 3. Offline Mode

The app gracefully handles offline scenarios:

#### When Offline:
- ✅ View existing chat history
- ✅ Access app settings
- ✅ See clear "offline" status indicator
- ❌ Recording is disabled (with clear explanation)
- ❌ New chat requests are blocked

#### Helpful Messages:
When the backend is unavailable, users see:
- Clear status indicators (⚠️ Offline / ❌ Server nicht erreichbar)
- Helpful troubleshooting tips
- Instructions on how to configure the backend URL

### 4. Automatic Recovery

The app includes intelligent recovery mechanisms:

#### Network Recovery:
- Automatically detects when connection is restored
- Re-checks backend availability
- Re-enables recording when backend is available

#### Request Timeout:
- 5-second timeout for health checks
- 30-second timeout for API requests (transcription, chat)
- Prevents app from hanging on slow connections

#### Conversation History Rollback:
- If a chat request fails, the user message is removed from history
- Prevents incomplete conversations
- Users can retry their request

## Technical Details

### State Management

The app tracks several state variables:
```javascript
let isOnline = true;           // Device online/offline status
let backendAvailable = false;  // Backend reachability status
```

### API Request Flow

1. **Check prerequisites**: Online status and backend availability
2. **Create request**: With timeout controller
3. **Send request**: To configured backend URL
4. **Handle response**: Success, error, or timeout
5. **Update UI**: Status messages and button states
6. **Recovery**: Rollback on error, retry capability

### Settings Storage

Backend URL is persisted in localStorage:
```javascript
{
  "ttsSpeed": 1.0,
  "ttsPitch": 1.0,
  "defaultPersona": "general",
  "autoPlayTTS": true,
  "backendUrl": "http://192.168.1.100:3000"
}
```

## User Interface

### Settings Modal

New backend URL configuration field:
- **Label**: "Backend-URL:"
- **Placeholder**: "Leer = gleicher Server (Standard)"
- **Example**: `http://192.168.1.100:3000`
- **Help text**: Explains that empty value means same server

### Status Indicators

Three types of status messages:
1. **API Status** (below controls):
   - ✅ API konfiguriert
   - ⚠️ Demo-Modus (API-Schlüssel nicht konfiguriert)
   - ❌ Server nicht erreichbar
   - ⚠️ Offline

2. **Recording Status** (main status):
   - Bereit zum Aufnehmen
   - 🎙️ Aufnahme läuft...
   - ⏳ Verarbeite Audio...
   - ❌ Backend nicht verfügbar
   - ⏱️ Timeout

3. **Welcome Message** (when backend unavailable):
   - Lists troubleshooting steps
   - Mentions settings configuration option

## Android App Integration

The Android WebView wrapper automatically benefits from these changes:

### How it works:
1. Android app loads web frontend in WebView
2. Web frontend detects network issues
3. User can configure backend URL via web UI
4. Settings persist in WebView's localStorage
5. No Android-specific changes needed

### Error Handling in WebView:
- Android WebView shows network errors
- Web app provides user-friendly messages
- Both work together for better UX

## Testing

Comprehensive test suite covers:
- ✅ Backend URL configuration (default and custom)
- ✅ Online/offline detection
- ✅ Network error handling (timeout, fetch failure)
- ✅ HTTP error handling (429, 500, etc.)
- ✅ User feedback mechanisms
- ✅ Settings persistence
- ✅ Error recovery (retry, rollback)

Run tests with:
```bash
npm test
```

Specific error handling tests:
```bash
npm test error-handling.test.js
```

## Troubleshooting

### Backend not reachable
1. Check backend server is running
2. Verify backend URL in settings
3. Check network connection
4. Try default URL (empty field)

### Timeout errors
1. Check network speed
2. Verify server is responding
3. Try again after a moment
4. Check firewall/proxy settings

### Rate limit errors
1. Wait a few minutes
2. Reduce request frequency
3. Check API quota if using cloud service

## Future Enhancements

Potential improvements:
- [ ] Retry button in UI for failed requests
- [ ] Connection quality indicator
- [ ] Offline mode with cached responses
- [ ] Background sync when coming online
- [ ] Multiple backend profiles
- [ ] Backend URL validation/testing
