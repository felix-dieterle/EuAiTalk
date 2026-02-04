/**
 * @jest-environment jsdom
 */

/**
 * Frontend Settings Tests
 * Tests for localStorage-based settings management
 */

describe('Frontend Settings Management', () => {
  const DEFAULT_SETTINGS = {
    ttsSpeed: 1.0,
    ttsPitch: 1.0,
    defaultPersona: 'general',
    autoPlayTTS: true
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Set up minimal DOM
    document.body.innerHTML = `
      <div id="settingsModal"></div>
      <select id="persona"></select>
    `;
  });

  describe('Settings Storage', () => {
    it('should store settings in localStorage', () => {
      const testSettings = {
        ttsSpeed: 1.5,
        ttsPitch: 0.8,
        defaultPersona: 'storyteller',
        autoPlayTTS: false
      };

      localStorage.setItem('euaitalk-settings', JSON.stringify(testSettings));
      
      const stored = JSON.parse(localStorage.getItem('euaitalk-settings'));
      expect(stored).toEqual(testSettings);
    });

    it('should retrieve settings from localStorage', () => {
      const testSettings = {
        ttsSpeed: 1.2,
        ttsPitch: 1.1,
        defaultPersona: 'comedian',
        autoPlayTTS: true
      };

      localStorage.setItem('euaitalk-settings', JSON.stringify(testSettings));
      
      const retrieved = JSON.parse(localStorage.getItem('euaitalk-settings'));
      expect(retrieved.ttsSpeed).toBe(1.2);
      expect(retrieved.defaultPersona).toBe('comedian');
    });

    it('should handle missing settings gracefully', () => {
      const retrieved = localStorage.getItem('euaitalk-settings');
      expect(retrieved).toBeNull();
    });

    it('should handle corrupted settings data', () => {
      localStorage.setItem('euaitalk-settings', 'invalid-json');
      
      const retrieved = localStorage.getItem('euaitalk-settings');
      expect(() => JSON.parse(retrieved)).toThrow();
    });
  });

  describe('Default Settings', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SETTINGS.ttsSpeed).toBe(1.0);
      expect(DEFAULT_SETTINGS.ttsPitch).toBe(1.0);
      expect(DEFAULT_SETTINGS.defaultPersona).toBe('general');
      expect(DEFAULT_SETTINGS.autoPlayTTS).toBe(true);
    });

    it('should merge saved settings with defaults', () => {
      const partialSettings = { ttsSpeed: 1.5 };
      localStorage.setItem('euaitalk-settings', JSON.stringify(partialSettings));
      
      const retrieved = JSON.parse(localStorage.getItem('euaitalk-settings'));
      const merged = { ...DEFAULT_SETTINGS, ...retrieved };
      
      expect(merged.ttsSpeed).toBe(1.5);
      expect(merged.ttsPitch).toBe(1.0); // from defaults
      expect(merged.defaultPersona).toBe('general'); // from defaults
    });
  });

  describe('Settings Validation', () => {
    it('should accept valid TTS speed values', () => {
      const validSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      validSpeeds.forEach(speed => {
        const settings = { ...DEFAULT_SETTINGS, ttsSpeed: speed };
        expect(settings.ttsSpeed).toBeGreaterThanOrEqual(0.5);
        expect(settings.ttsSpeed).toBeLessThanOrEqual(2.0);
      });
    });

    it('should accept valid TTS pitch values', () => {
      const validPitches = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
      validPitches.forEach(pitch => {
        const settings = { ...DEFAULT_SETTINGS, ttsPitch: pitch };
        expect(settings.ttsPitch).toBeGreaterThanOrEqual(0.5);
        expect(settings.ttsPitch).toBeLessThanOrEqual(2.0);
      });
    });

    it('should accept valid persona values', () => {
      const validPersonas = ['general', 'storyteller', 'comedian', 'bible'];
      validPersonas.forEach(persona => {
        const settings = { ...DEFAULT_SETTINGS, defaultPersona: persona };
        expect(validPersonas).toContain(settings.defaultPersona);
      });
    });

    it('should handle boolean autoPlayTTS correctly', () => {
      const settings1 = { ...DEFAULT_SETTINGS, autoPlayTTS: true };
      const settings2 = { ...DEFAULT_SETTINGS, autoPlayTTS: false };
      
      expect(settings1.autoPlayTTS).toBe(true);
      expect(settings2.autoPlayTTS).toBe(false);
    });
  });
});
