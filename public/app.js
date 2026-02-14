/**
 * EuAiTalk Frontend JavaScript
 * Handles audio recording, transcription, chat, and text-to-speech
 */

// Default settings
const DEFAULT_SETTINGS = {
    ttsSpeed: 1.0,
    ttsPitch: 1.0,
    defaultPersona: 'general',
    autoPlayTTS: true,
    backendUrl: '' // Empty means same origin (default)
};

// State management
let mediaRecorder = null;
let audioChunks = [];
let conversationHistory = [];
let isRecording = false;
let settings = { ...DEFAULT_SETTINGS };
let isOnline = true;
let backendAvailable = false;

// Rate limit tracking
let rateLimits = {
    transcribe: { limit: 0, remaining: 0, reset: 0 },
    chat: { limit: 0, remaining: 0, reset: 0 }
};

// Log collection
const MAX_LOGS = 100;
let appLogs = [];

// DOM elements
const recordButton = document.getElementById('recordButton');
const clearButton = document.getElementById('clearButton');
const chatContainer = document.getElementById('chatContainer');
const statusDiv = document.getElementById('status');
const personaSelect = document.getElementById('persona');
const apiStatusDiv = document.getElementById('apiStatus');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettings');
const saveSettingsButton = document.getElementById('saveSettings');
const resetSettingsButton = document.getElementById('resetSettings');
const logsButton = document.getElementById('logsButton');
const logsModal = document.getElementById('logsModal');
const closeLogsButton = document.getElementById('closeLogs');
const clearLogsButton = document.getElementById('clearLogs');

/**
 * Setup console interception to capture logs
 * Note: The intercepting flag is not thread-safe but is sufficient for
 * single-threaded JavaScript execution in the browser. It prevents infinite
 * recursion when our logging code uses console methods.
 */
function setupConsoleInterception() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    let intercepting = false;
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        if (!intercepting && args.length > 0) {
            intercepting = true;
            try {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                addLogEntry('info', message);
            } catch (e) {
                // Silently ignore logging errors to avoid breaking the app
            } finally {
                intercepting = false;
            }
        }
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        if (!intercepting && args.length > 0) {
            intercepting = true;
            try {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                addLogEntry('error', message);
            } catch (e) {
                // Silently ignore logging errors
            } finally {
                intercepting = false;
            }
        }
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        if (!intercepting && args.length > 0) {
            intercepting = true;
            try {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                addLogEntry('warn', message);
            } catch (e) {
                // Silently ignore logging errors
            } finally {
                intercepting = false;
            }
        }
    };
}

/**
 * Initialize the app
 */
async function init() {
    // Intercept console methods to capture logs
    setupConsoleInterception();
    
    // Load settings from localStorage
    loadSettings();
    
    // Set up online/offline detection
    setupOnlineDetection();
    
    // Check API status
    checkApiStatus();
    
    // Set up event listeners
    recordButton.addEventListener('click', toggleRecording);
    clearButton.addEventListener('click', clearChat);
    settingsButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', closeSettings);
    saveSettingsButton.addEventListener('click', saveSettingsFromModal);
    resetSettingsButton.addEventListener('click', resetSettings);
    logsButton.addEventListener('click', openLogs);
    closeLogsButton.addEventListener('click', closeLogs);
    clearLogsButton.addEventListener('click', clearLogs);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
    
    logsModal.addEventListener('click', (e) => {
        if (e.target === logsModal) {
            closeLogs();
        }
    });
    
    // Set up settings sliders
    setupSettingsSliders();
    
    // Request microphone permission
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just wanted permission
        updateStatus('Bereit zum Aufnehmen');
    } catch (error) {
        updateStatus('❌ Mikrofon-Zugriff verweigert', 'error');
        recordButton.disabled = true;
    }
}

/**
 * Get the configured backend URL
 */
function getBackendUrl() {
    return settings.backendUrl || window.location.origin;
}

/**
 * Setup online/offline detection
 */
function setupOnlineDetection() {
    // Initial state
    isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        isOnline = true;
        updateStatus('✅ Wieder online - verbinde mit Server...');
        checkApiStatus();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        backendAvailable = false;
        updateStatus('⚠️ Offline - Aufnahme nicht verfügbar', 'warning');
        updateApiStatusDisplay();
        recordButton.disabled = true;
    });
}

/**
 * Update API status display
 */
function updateApiStatusDisplay() {
    if (!isOnline) {
        apiStatusDiv.innerHTML = '<small>⚠️ Offline</small>';
    } else if (!backendAvailable) {
        apiStatusDiv.innerHTML = '<small>❌ Server nicht erreichbar</small>';
    } else {
        // Will be set by checkApiStatus
    }
}

/**
 * Check if API is configured
 */
async function checkApiStatus() {
    if (!isOnline) {
        backendAvailable = false;
        updateApiStatusDisplay();
        recordButton.disabled = true;
        return;
    }
    
    try {
        const backendUrl = getBackendUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${backendUrl}/api/health`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        backendAvailable = true;
        recordButton.disabled = false;
        
        if (data.apiConfigured) {
            apiStatusDiv.innerHTML = '<small>✅ API konfiguriert</small>';
        } else {
            apiStatusDiv.innerHTML = '<small>⚠️ Demo-Modus (API-Schlüssel nicht konfiguriert)</small>';
        }
        
        updateStatus('Bereit zum Aufnehmen');
    } catch (error) {
        backendAvailable = false;
        recordButton.disabled = true;
        
        let errorMessage = 'Server nicht erreichbar';
        if (error.name === 'AbortError') {
            errorMessage += ' (Timeout)';
        } else if (error.message) {
            console.error('API health check error:', error);
        }
        
        apiStatusDiv.innerHTML = `<small>❌ ${errorMessage}</small>`;
        updateStatus('⚠️ Backend nicht verfügbar - Aufnahme deaktiviert', 'warning');
        
        // Show helpful message to user
        showOfflineMessage();
    }
}

/**
 * Show offline/backend unavailable message
 */
function showOfflineMessage() {
    // Only show if chat is empty or only has welcome message
    const hasMessages = conversationHistory.length > 0;
    if (!hasMessages) {
        const welcomeMessage = chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = `
                <p>⚠️ Backend nicht erreichbar</p>
                <p>Der Server ist momentan nicht verfügbar.</p>
                <p><small>Bitte überprüfen Sie:</small></p>
                <ul style="text-align: left; margin: 10px auto; max-width: 300px;">
                    <li>Backend-Server läuft</li>
                    <li>Internetverbindung aktiv</li>
                    <li>Backend-URL korrekt konfiguriert</li>
                </ul>
                <p><small>Sie können die Backend-URL in den Einstellungen ⚙️ konfigurieren.</small></p>
            `;
        }
    }
}

/**
 * Toggle recording on/off
 */
async function toggleRecording() {
    // Check if backend is available
    if (!backendAvailable || !isOnline) {
        updateStatus('❌ Backend nicht verfügbar - kann nicht aufnehmen', 'error');
        return;
    }
    
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

/**
 * Start recording audio
 */
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        recordButton.classList.add('recording');
        updateStatus('🎙️ Aufnahme läuft... Klicke erneut zum Stoppen');

    } catch (error) {
        console.error('Recording error:', error);
        updateStatus('❌ Fehler beim Aufnehmen', 'error');
    }
}

/**
 * Stop recording audio
 */
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordButton.classList.remove('recording');
        updateStatus('⏳ Verarbeite Audio...');
    }
}

/**
 * Process recorded audio: transcribe -> chat -> speak
 */
async function processAudio(audioBlob) {
    try {
        // Convert audio blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            
            // Step 1: Transcribe audio
            updateStatus('📝 Transkribiere...');
            const transcription = await transcribeAudio(base64Audio);
            
            if (!transcription) {
                updateStatus('❌ Transkription fehlgeschlagen', 'error');
                return;
            }
            
            // Add user message to chat
            addMessage('user', transcription);
            
            // Step 2: Get AI response
            updateStatus('💬 KI antwortet...');
            const aiResponse = await getChatResponse(transcription);
            
            if (!aiResponse) {
                updateStatus('❌ Chat fehlgeschlagen', 'error');
                return;
            }
            
            // Add AI message to chat
            addMessage('ai', aiResponse);
            
            // Step 3: Speak the response (if enabled in settings)
            if (settings.autoPlayTTS) {
                updateStatus('🔊 Spreche Antwort...');
                await speakText(aiResponse);
            }
            
            updateStatus('Bereit');
        };
        
    } catch (error) {
        console.error('Processing error:', error);
        updateStatus('❌ Verarbeitungsfehler', 'error');
    }
}

/**
 * Transcribe audio using backend API
 */
async function transcribeAudio(base64Audio) {
    try {
        const backendUrl = getBackendUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${backendUrl}/api/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Update rate limit info
        updateRateLimitFromHeaders('transcribe', response.headers);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Provide user-friendly error messages
            let errorMsg = 'Transkription fehlgeschlagen';
            if (response.status === 429) {
                errorMsg = 'Zu viele Anfragen - bitte warten Sie einen Moment';
            } else if (response.status >= 500) {
                errorMsg = 'Server-Fehler - bitte versuchen Sie es später erneut';
            }
            
            throw new Error(`${errorMsg} (${response.status}): ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        return data.text;
        
    } catch (error) {
        console.error('Transcription error:', error);
        
        // Check if it's a network error
        if (error.name === 'AbortError') {
            updateStatus('⏱️ Timeout - Anfrage dauerte zu lange', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            updateStatus('❌ Netzwerkfehler - Server nicht erreichbar', 'error');
            backendAvailable = false;
            updateApiStatusDisplay();
        } else {
            updateStatus(error.message || '❌ Transkription fehlgeschlagen', 'error');
        }
        
        return null;
    }
}

/**
 * Get chat response from AI
 */
async function getChatResponse(userMessage) {
    try {
        // Add user message to conversation history
        // We'll remove this if the request fails (see catch block)
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        const backendUrl = getBackendUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${backendUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conversationHistory,
                persona: personaSelect.value
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Update rate limit info
        updateRateLimitFromHeaders('chat', response.headers);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Provide user-friendly error messages
            let errorMsg = 'Chat fehlgeschlagen';
            if (response.status === 429) {
                errorMsg = 'Zu viele Anfragen - bitte warten Sie einen Moment';
            } else if (response.status >= 500) {
                errorMsg = 'Server-Fehler - bitte versuchen Sie es später erneut';
            }
            
            throw new Error(`${errorMsg} (${response.status}): ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add AI response to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: data.message
        });
        
        return data.message;
        
    } catch (error) {
        console.error('Chat error:', error);
        
        // Rollback: Remove the user message we added at the start
        // This assumes we just added one message and nothing else modified the history
        // If the history was modified externally, this would remove the wrong message
        // For now, this is safe since only this function modifies conversationHistory during a request
        conversationHistory.pop();
        
        // Check if it's a network error
        if (error.name === 'AbortError') {
            updateStatus('⏱️ Timeout - Anfrage dauerte zu lange', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            updateStatus('❌ Netzwerkfehler - Server nicht erreichbar', 'error');
            backendAvailable = false;
            updateApiStatusDisplay();
        } else {
            updateStatus(error.message || '❌ Chat fehlgeschlagen', 'error');
        }
        
        return null;
    }
}

/**
 * Text-to-Speech using Web Speech API
 * Falls back gracefully if not supported
 */
function speakText(text) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            console.log('TTS not supported');
            resolve();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = settings.ttsSpeed;
        utterance.pitch = settings.ttsPitch;
        
        utterance.onend = () => {
            resolve();
        };
        
        utterance.onerror = (error) => {
            console.error('TTS error:', error);
            resolve();
        };
        
        speechSynthesis.speak(utterance);
    });
}

/**
 * Add message to chat display
 */
function addMessage(type, text) {
    // Remove welcome message if it exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const icon = type === 'user' ? '👤' : '🤖';
    const label = type === 'user' ? 'Du' : 'KI';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-icon">${icon}</span>
            <span class="message-label">${label}</span>
        </div>
        <div class="message-content">${text}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Update status message
 */
function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

/**
 * Clear chat history
 */
function clearChat() {
    if (confirm('Chat-Verlauf löschen?')) {
        conversationHistory = [];
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <p>👋 Willkommen bei EuAiTalk!</p>
                <p>Drücke den Mikrofon-Button und sprich mit der KI.</p>
            </div>
        `;
        updateStatus('Chat gelöscht');
    }
}

/**
 * Settings Management
 */

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('euaitalk-settings');
    if (savedSettings) {
        try {
            settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = { ...DEFAULT_SETTINGS };
        }
    }
    
    // Apply loaded settings to persona selector
    if (settings.defaultPersona) {
        personaSelect.value = settings.defaultPersona;
    }
}

/**
 * Save settings to localStorage
 */
function saveSettingsToStorage() {
    try {
        localStorage.setItem('euaitalk-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/**
 * Open settings modal
 */
function openSettings() {
    // Populate current settings
    document.getElementById('ttsSpeed').value = settings.ttsSpeed;
    document.getElementById('ttsSpeedValue').textContent = `${settings.ttsSpeed.toFixed(1)}x`;
    document.getElementById('ttsPitch').value = settings.ttsPitch;
    document.getElementById('ttsPitchValue').textContent = settings.ttsPitch.toFixed(1);
    document.getElementById('defaultPersona').value = settings.defaultPersona;
    document.getElementById('autoPlayTTS').checked = settings.autoPlayTTS;
    document.getElementById('backendUrl').value = settings.backendUrl || '';
    
    settingsModal.classList.add('show');
}

/**
 * Close settings modal
 */
function closeSettings() {
    settingsModal.classList.remove('show');
}

/**
 * Save settings from modal
 */
function saveSettingsFromModal() {
    const oldBackendUrl = settings.backendUrl;
    
    settings.ttsSpeed = parseFloat(document.getElementById('ttsSpeed').value);
    settings.ttsPitch = parseFloat(document.getElementById('ttsPitch').value);
    settings.defaultPersona = document.getElementById('defaultPersona').value;
    settings.autoPlayTTS = document.getElementById('autoPlayTTS').checked;
    settings.backendUrl = document.getElementById('backendUrl').value.trim();
    
    // Update persona selector
    personaSelect.value = settings.defaultPersona;
    
    // Save to localStorage
    saveSettingsToStorage();
    
    // Close modal
    closeSettings();
    
    // If backend URL changed, recheck API status
    if (oldBackendUrl !== settings.backendUrl) {
        updateStatus('🔄 Backend-URL aktualisiert - überprüfe Verbindung...');
        checkApiStatus();
    } else {
        // Show feedback
        updateStatus('✅ Einstellungen gespeichert');
        setTimeout(() => {
            if (backendAvailable) {
                updateStatus('Bereit');
            }
        }, 2000);
    }
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (confirm('Einstellungen auf Standardwerte zurücksetzen?')) {
        const oldBackendUrl = settings.backendUrl;
        settings = { ...DEFAULT_SETTINGS };
        
        // Update UI
        document.getElementById('ttsSpeed').value = settings.ttsSpeed;
        document.getElementById('ttsSpeedValue').textContent = `${settings.ttsSpeed.toFixed(1)}x`;
        document.getElementById('ttsPitch').value = settings.ttsPitch;
        document.getElementById('ttsPitchValue').textContent = settings.ttsPitch.toFixed(1);
        document.getElementById('defaultPersona').value = settings.defaultPersona;
        document.getElementById('autoPlayTTS').checked = settings.autoPlayTTS;
        document.getElementById('backendUrl').value = settings.backendUrl || '';
        
        // Update persona selector
        personaSelect.value = settings.defaultPersona;
        
        // Save to localStorage
        saveSettingsToStorage();
        
        // If backend URL changed, recheck API status
        if (oldBackendUrl !== settings.backendUrl) {
            updateStatus('✅ Einstellungen zurückgesetzt - überprüfe Verbindung...');
            checkApiStatus();
        } else {
            updateStatus('✅ Einstellungen zurückgesetzt');
            setTimeout(() => {
                if (backendAvailable) {
                    updateStatus('Bereit');
                }
            }, 2000);
        }
    }
}

/**
 * Set up settings sliders with real-time value updates
 */
function setupSettingsSliders() {
    const ttsSpeedSlider = document.getElementById('ttsSpeed');
    const ttsSpeedValue = document.getElementById('ttsSpeedValue');
    const ttsPitchSlider = document.getElementById('ttsPitch');
    const ttsPitchValue = document.getElementById('ttsPitchValue');
    
    ttsSpeedSlider.addEventListener('input', (e) => {
        ttsSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });
    
    ttsPitchSlider.addEventListener('input', (e) => {
        ttsPitchValue.textContent = parseFloat(e.target.value).toFixed(1);
    });
}

/**
 * Update rate limit information from response headers
 */
function updateRateLimitFromHeaders(apiName, headers) {
    const limit = headers.get('RateLimit-Limit');
    const remaining = headers.get('RateLimit-Remaining');
    const reset = headers.get('RateLimit-Reset');
    
    if (limit && remaining) {
        rateLimits[apiName] = {
            limit: parseInt(limit),
            remaining: parseInt(remaining),
            reset: reset ? parseInt(reset) : 0
        };
        updateRateLimitDisplay();
    }
}

/**
 * Update the rate limit indicators display
 */
function updateRateLimitDisplay() {
    const container = document.getElementById('rateLimitIndicators');
    if (!container) return;
    
    const html = Object.keys(rateLimits).map(apiName => {
        const data = rateLimits[apiName];
        if (data.limit === 0) return ''; // Skip if no data yet
        
        const usagePercent = ((data.limit - data.remaining) / data.limit) * 100;
        let color = '#4caf50'; // Green
        if (usagePercent >= 90) {
            color = '#f44336'; // Red
        } else if (usagePercent >= 70) {
            color = '#ffc107'; // Yellow
        }
        
        const apiLabel = apiName === 'transcribe' ? 'STT' : 'Chat';
        
        return `
            <div class="rate-limit-indicator" title="${apiLabel}: ${data.remaining}/${data.limit} verfügbar">
                <span class="rate-limit-dot" style="background-color: ${color};"></span>
                <span class="rate-limit-label">${apiLabel}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * Log Management
 */

/**
 * Add a log entry (internal, not logged to console)
 */
function addLogEntry(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        details
    };
    
    appLogs.push(logEntry);
    
    // Keep only the last MAX_LOGS entries
    if (appLogs.length > MAX_LOGS) {
        appLogs.shift();
    }
}

/**
 * Add a log entry (public API for manual logging from application code)
 * This wrapper exists to provide a stable public API for logging
 */
function addLog(level, message, details = null) {
    addLogEntry(level, message, details);
}

/**
 * Open logs modal
 */
function openLogs() {
    updateLogsDisplay();
    logsModal.classList.add('show');
}

/**
 * Close logs modal
 */
function closeLogs() {
    logsModal.classList.remove('show');
}

/**
 * Clear all logs
 */
function clearLogs() {
    if (confirm('Alle Logs löschen?')) {
        appLogs = [];
        updateLogsDisplay();
    }
}

/**
 * Update logs display in modal
 */
function updateLogsDisplay() {
    const logsContent = document.getElementById('logsContent');
    if (!logsContent) return;
    
    if (appLogs.length === 0) {
        logsContent.innerHTML = '<div class="no-logs">Keine Logs vorhanden</div>';
        return;
    }
    
    const html = appLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('de-DE');
        const levelClass = `log-${log.level}`;
        const levelIcon = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : 'ℹ️';
        
        let detailsHtml = '';
        if (log.details) {
            try {
                const detailsStr = typeof log.details === 'object' 
                    ? JSON.stringify(log.details, null, 2) 
                    : log.details;
                detailsHtml = `<pre class="log-details">${escapeHtml(detailsStr)}</pre>`;
            } catch (error) {
                detailsHtml = `<pre class="log-details">[Error serializing details: ${error.message}]</pre>`;
            }
        }
        
        return `
            <div class="log-entry ${levelClass}">
                <div class="log-header">
                    <span class="log-icon">${levelIcon}</span>
                    <span class="log-time">${time}</span>
                    <span class="log-level">${log.level.toUpperCase()}</span>
                </div>
                <div class="log-message">${escapeHtml(log.message)}</div>
                ${detailsHtml}
            </div>
        `;
    }).reverse().join('');
    
    logsContent.innerHTML = html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
