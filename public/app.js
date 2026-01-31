/**
 * EuAiTalk Frontend JavaScript
 * Handles audio recording, transcription, chat, and text-to-speech
 */

// Default settings
const DEFAULT_SETTINGS = {
    ttsSpeed: 1.0,
    ttsPitch: 1.0,
    defaultPersona: 'general',
    autoPlayTTS: true
};

// State management
let mediaRecorder = null;
let audioChunks = [];
let conversationHistory = [];
let isRecording = false;
let settings = { ...DEFAULT_SETTINGS };

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

/**
 * Initialize the app
 */
async function init() {
    // Load settings from localStorage
    loadSettings();
    
    // Check API status
    checkApiStatus();
    
    // Set up event listeners
    recordButton.addEventListener('click', toggleRecording);
    clearButton.addEventListener('click', clearChat);
    settingsButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', closeSettings);
    saveSettingsButton.addEventListener('click', saveSettingsFromModal);
    resetSettingsButton.addEventListener('click', resetSettings);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
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
 * Check if API is configured
 */
async function checkApiStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.apiConfigured) {
            apiStatusDiv.innerHTML = '<small>✅ API konfiguriert</small>';
        } else {
            apiStatusDiv.innerHTML = '<small>⚠️ Demo-Modus (API-Schlüssel nicht konfiguriert)</small>';
        }
    } catch (error) {
        apiStatusDiv.innerHTML = '<small>❌ Server nicht erreichbar</small>';
    }
}

/**
 * Toggle recording on/off
 */
async function toggleRecording() {
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
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Transcription failed (${response.status}): ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        return data.text;
        
    } catch (error) {
        console.error('Transcription error:', error);
        return null;
    }
}

/**
 * Get chat response from AI
 */
async function getChatResponse(userMessage) {
    try {
        // Add user message to conversation history
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conversationHistory,
                persona: personaSelect.value
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Chat failed (${response.status}): ${errorData.error || response.statusText}`);
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
    settings.ttsSpeed = parseFloat(document.getElementById('ttsSpeed').value);
    settings.ttsPitch = parseFloat(document.getElementById('ttsPitch').value);
    settings.defaultPersona = document.getElementById('defaultPersona').value;
    settings.autoPlayTTS = document.getElementById('autoPlayTTS').checked;
    
    // Update persona selector
    personaSelect.value = settings.defaultPersona;
    
    // Save to localStorage
    saveSettingsToStorage();
    
    // Close modal
    closeSettings();
    
    // Show feedback
    updateStatus('✅ Einstellungen gespeichert');
    setTimeout(() => updateStatus('Bereit'), 2000);
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (confirm('Einstellungen auf Standardwerte zurücksetzen?')) {
        settings = { ...DEFAULT_SETTINGS };
        
        // Update UI
        document.getElementById('ttsSpeed').value = settings.ttsSpeed;
        document.getElementById('ttsSpeedValue').textContent = `${settings.ttsSpeed.toFixed(1)}x`;
        document.getElementById('ttsPitch').value = settings.ttsPitch;
        document.getElementById('ttsPitchValue').textContent = settings.ttsPitch.toFixed(1);
        document.getElementById('defaultPersona').value = settings.defaultPersona;
        document.getElementById('autoPlayTTS').checked = settings.autoPlayTTS;
        
        // Update persona selector
        personaSelect.value = settings.defaultPersona;
        
        // Save to localStorage
        saveSettingsToStorage();
        
        updateStatus('✅ Einstellungen zurückgesetzt');
        setTimeout(() => updateStatus('Bereit'), 2000);
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
