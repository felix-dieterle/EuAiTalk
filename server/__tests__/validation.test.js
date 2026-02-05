/**
 * Environment Validation Tests
 * Tests for environment variable validation logic
 */

const { validateRequiredSettings } = require('../app');

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateRequiredSettings', () => {
    it('should pass when all required variables are set', () => {
      process.env.SCALEWAY_API_KEY = 'valid_api_key';
      process.env.SCALEWAY_STT_ENDPOINT = 'https://api.test.com/stt';
      process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';

      expect(() => validateRequiredSettings()).not.toThrow();
    });

    it('should throw error when SCALEWAY_API_KEY is missing', () => {
      delete process.env.SCALEWAY_API_KEY;
      process.env.SCALEWAY_STT_ENDPOINT = 'https://api.test.com/stt';
      process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';

      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_API_KEY/);
      expect(() => validateRequiredSettings()).toThrow(/Missing variables/);
    });

    it('should throw error when SCALEWAY_STT_ENDPOINT is missing', () => {
      process.env.SCALEWAY_API_KEY = 'valid_api_key';
      delete process.env.SCALEWAY_STT_ENDPOINT;
      process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';

      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_STT_ENDPOINT/);
    });

    it('should throw error when SCALEWAY_CHAT_ENDPOINT is missing', () => {
      process.env.SCALEWAY_API_KEY = 'valid_api_key';
      process.env.SCALEWAY_STT_ENDPOINT = 'https://api.test.com/stt';
      delete process.env.SCALEWAY_CHAT_ENDPOINT;

      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_CHAT_ENDPOINT/);
    });

    it('should throw error when API key has placeholder value', () => {
      process.env.SCALEWAY_API_KEY = 'your_scaleway_api_key_here';
      process.env.SCALEWAY_STT_ENDPOINT = 'https://api.test.com/stt';
      process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';

      expect(() => validateRequiredSettings()).toThrow(/Placeholder values detected/);
      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_API_KEY/);
    });

    it('should throw error when multiple variables are missing', () => {
      delete process.env.SCALEWAY_API_KEY;
      delete process.env.SCALEWAY_STT_ENDPOINT;
      process.env.SCALEWAY_CHAT_ENDPOINT = 'https://api.test.com/chat';

      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_API_KEY/);
      expect(() => validateRequiredSettings()).toThrow(/SCALEWAY_STT_ENDPOINT/);
    });

    it('should include helpful error message with instructions', () => {
      delete process.env.SCALEWAY_API_KEY;
      delete process.env.SCALEWAY_STT_ENDPOINT;
      delete process.env.SCALEWAY_CHAT_ENDPOINT;

      let errorMessage;
      try {
        validateRequiredSettings();
      } catch (error) {
        errorMessage = error.message;
      }

      expect(errorMessage).toContain('.env.example');
      expect(errorMessage).toContain('console.scaleway.com');
    });
  });
});
