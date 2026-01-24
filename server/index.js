/**
 * EuAiTalk Backend Server
 * Simple Express server that proxies requests to Scaleway APIs
 * Keeps API keys secure on the server side
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/**
 * Speech-to-Text Endpoint
 * Receives audio file and transcribes it using Scaleway Whisper API
 */
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // For demo purposes, if no API key is set, return mock response
    if (!process.env.SCALEWAY_API_KEY || process.env.SCALEWAY_API_KEY === 'your_scaleway_api_key_here') {
      console.log('Demo mode: No API key configured, returning mock transcription');
      return res.json({ 
        text: 'Dies ist eine Demo-Transkription. Bitte konfigurieren Sie Ihren Scaleway API-Schlüssel in der .env-Datei.'
      });
    }

    // Call Scaleway STT API
    const response = await fetch(process.env.SCALEWAY_STT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SCALEWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'whisper-large-v3',
        audio: audio
      })
    });

    if (!response.ok) {
      throw new Error(`Scaleway API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({ text: data.text });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

/**
 * Chat Completion Endpoint
 * Sends user message to Scaleway LLM and returns AI response
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // For demo purposes, if no API key is set, return mock response
    if (!process.env.SCALEWAY_API_KEY || process.env.SCALEWAY_API_KEY === 'your_scaleway_api_key_here') {
      console.log('Demo mode: No API key configured, returning mock chat response');
      const userMessage = messages[messages.length - 1]?.content || '';
      return res.json({ 
        message: `Demo-Antwort auf: "${userMessage}". Bitte konfigurieren Sie Ihren Scaleway API-Schlüssel für echte KI-Antworten.`
      });
    }

    // Add system message based on selected persona
    const systemMessages = {
      storyteller: 'Du bist ein unterhaltsamer Geschichtenerzähler. Erzähle kurze, spannende Geschichten.',
      comedian: 'Du bist ein freundlicher Comedian. Erzähle Witze und bringe die Leute zum Lachen.',
      bible: 'Du bist ein Bibel-Experte. Erzähle biblische Geschichten auf zugängliche Weise.',
      general: 'Du bist ein hilfreicher und freundlicher Assistent.'
    };

    const systemMessage = {
      role: 'system',
      content: systemMessages[persona] || systemMessages.general
    };

    // Call Scaleway Chat API
    const response = await fetch(process.env.SCALEWAY_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SCALEWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-nemo-instruct-2407',
        messages: [systemMessage, ...messages],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Scaleway API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'No response';
    
    res.json({ message: aiMessage });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat request failed', details: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiConfigured: !!(process.env.SCALEWAY_API_KEY && process.env.SCALEWAY_API_KEY !== 'your_scaleway_api_key_here')
  });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 EuAiTalk server running on http://localhost:${PORT}`);
  console.log(`📝 API configured: ${!!(process.env.SCALEWAY_API_KEY && process.env.SCALEWAY_API_KEY !== 'your_scaleway_api_key_here')}`);
});
