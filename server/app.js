/**
 * EuAiTalk Express Application
 * Separated from server for testing purposes
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { version } = require('../package.json');

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'SCALEWAY_API_KEY',
  'SCALEWAY_STT_ENDPOINT',
  'SCALEWAY_CHAT_ENDPOINT'
];

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variable is missing or has a placeholder value
 */
function validateRequiredSettings() {
  const missing = [];
  const placeholder = [];
  
  // Known placeholder values from .env.example
  const PLACEHOLDER_VALUES = {
    'SCALEWAY_API_KEY': 'your_scaleway_api_key_here'
  };
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      missing.push(varName);
    } else if (PLACEHOLDER_VALUES[varName] && value === PLACEHOLDER_VALUES[varName]) {
      placeholder.push(varName);
    }
  }
  
  if (missing.length > 0 || placeholder.length > 0) {
    let errorMessage = '❌ Required environment variables are not properly configured:\n';
    
    if (missing.length > 0) {
      errorMessage += `\nMissing variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n`;
    }
    
    if (placeholder.length > 0) {
      errorMessage += `\nPlaceholder values detected (need real values):\n${placeholder.map(v => `  - ${v}`).join('\n')}\n`;
    }
    
    errorMessage += '\n📝 Please copy .env.example to .env and configure all required variables.';
    errorMessage += '\n💡 Get your Scaleway API key from: https://console.scaleway.com/project/credentials';
    
    throw new Error(errorMessage);
  }
  
  console.log('✅ All required environment variables are configured');
}

/**
 * Create and configure Express app
 * @param {Object} options - Configuration options
 * @param {boolean} options.skipEnvValidation - Skip environment validation (for testing)
 * @returns {Express.Application}
 */
function createApp(options = {}) {
  const app = express();
  
  // Validate environment variables unless explicitly skipped
  if (!options.skipEnvValidation) {
    validateRequiredSettings();
  }
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));
  
  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // More permissive rate limiting for static file serving
  const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Higher limit for static files
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply rate limiting to API routes
  app.use('/api/', apiLimiter);
  
  /**
   * Speech-to-Text Endpoint
   */
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audio } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: 'Audio data is required' });
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
   */
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, persona } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
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
      apiConfigured: true,
      version
    });
  });
  
  // Serve index.html for all other routes (SPA) with rate limiting
  app.get('*', staticLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  return app;
}

module.exports = { createApp, validateRequiredSettings };
