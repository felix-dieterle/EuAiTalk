/**
 * EuAiTalk Backend Server
 * Simple Express server that proxies requests to Scaleway APIs
 * Keeps API keys secure on the server side
 */

require('dotenv').config();
const { createApp } = require('./app');
const { version } = require('../package.json');

const PORT = process.env.PORT || 3000;

// Create Express app
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 EuAiTalk server running on http://localhost:${PORT}`);
  console.log(`📦 Version: ${version}`);
  console.log(`📝 API configured: true`);
});
