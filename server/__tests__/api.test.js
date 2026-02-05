/**
 * Backend API Tests
 * Tests for all critical backend functionality
 */

const request = require('supertest');
const { createApp } = require('../app');

// Mock node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');

describe('Backend API Tests', () => {
  let app;

  beforeAll(() => {
    // Set up test environment variables
    process.env.SCALEWAY_API_KEY = 'test_api_key';
    process.env.SCALEWAY_STT_ENDPOINT = 'https://api.test.com/stt';
    process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';
  });

  beforeEach(() => {
    // Create app with env validation skipped for tests
    app = createApp({ skipEnvValidation: true });
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        apiConfigured: true
      });
    });
  });

  describe('POST /api/transcribe', () => {
    it('should return 400 when audio is missing', async () => {
      const response = await request(app)
        .post('/api/transcribe')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Audio data is required');
    });

    it('should transcribe audio successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ text: 'Transcribed text' })
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/transcribe')
        .send({ audio: 'base64_audio_data' })
        .expect(200);

      expect(response.body).toEqual({ text: 'Transcribed text' });
      expect(fetch).toHaveBeenCalledWith(
        process.env.SCALEWAY_STT_ENDPOINT,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${process.env.SCALEWAY_API_KEY}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors', async () => {
      // Mock failed API response
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request'
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/transcribe')
        .send({ audio: 'base64_audio_data' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Transcription failed');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle network errors', async () => {
      // Mock network error
      fetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/transcribe')
        .send({ audio: 'base64_audio_data' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Transcription failed');
      expect(response.body.details).toContain('Network error');
    });
  });

  describe('POST /api/chat', () => {
    it('should return 400 when messages is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Messages array is required');
    });

    it('should return 400 when messages is not an array', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ messages: 'not an array' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Messages array is required');
    });

    it('should get chat response successfully with default persona', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            { message: { content: 'AI response' } }
          ]
        })
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          persona: 'general'
        })
        .expect(200);

      expect(response.body).toEqual({ message: 'AI response' });
      
      // Verify the API was called with correct parameters
      const fetchCall = fetch.mock.calls[0];
      expect(fetchCall[0]).toBe(process.env.SCALEWAY_CHAT_ENDPOINT);
      
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.messages).toHaveLength(2); // system + user
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[1].role).toBe('user');
    });

    it('should use storyteller persona correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Once upon a time...' } }]
        })
      };
      fetch.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Tell a story' }],
          persona: 'storyteller'
        })
        .expect(200);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('Geschichtenerzähler');
    });

    it('should use comedian persona correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Haha!' } }]
        })
      };
      fetch.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Tell a joke' }],
          persona: 'comedian'
        })
        .expect(200);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('Comedian');
    });

    it('should use bible persona correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Biblical story' } }]
        })
      };
      fetch.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Tell a bible story' }],
          persona: 'bible'
        })
        .expect(200);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('Bibel');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Server Error'
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          persona: 'general'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Chat request failed');
    });

    it('should handle missing choices in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ choices: [] })
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          persona: 'general'
        })
        .expect(200);

      expect(response.body).toEqual({ message: 'No response' });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to /api routes', async () => {
      // Make multiple requests quickly
      const requests = [];
      
      // Make 5 requests (well below the limit of 100)
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/health')
        );
      }

      const responses = await Promise.all(requests);
      
      // All should succeed since we're below the limit
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Static Files', () => {
    it('should serve static files from public directory', async () => {
      // This will hit the catch-all route
      const response = await request(app)
        .get('/some-route')
        .expect(200);

      // It should try to send index.html
      expect(response.type).toMatch(/html/);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
