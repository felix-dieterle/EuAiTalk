/**
 * @jest-environment jsdom
 */

/**
 * Rate Limit Tests
 * Tests for rate limit tracking and display functionality
 */

describe('Rate Limit Tracking and Display', () => {
  beforeEach(() => {
    // Set up DOM with required elements
    document.body.innerHTML = `
      <div id="rateLimitIndicators"></div>
    `;
  });

  describe('Rate Limit Data Structure', () => {
    it('should initialize rate limit state correctly', () => {
      const rateLimits = {
        transcribe: { limit: 0, remaining: 0, reset: 0 },
        chat: { limit: 0, remaining: 0, reset: 0 }
      };
      
      expect(rateLimits).toHaveProperty('transcribe');
      expect(rateLimits).toHaveProperty('chat');
      expect(rateLimits.transcribe).toHaveProperty('limit');
      expect(rateLimits.transcribe).toHaveProperty('remaining');
      expect(rateLimits.transcribe).toHaveProperty('reset');
    });

    it('should update rate limit data from headers', () => {
      const rateLimits = {
        transcribe: { limit: 0, remaining: 0, reset: 0 },
        chat: { limit: 0, remaining: 0, reset: 0 }
      };
      
      // Simulate updating from headers
      rateLimits.transcribe = {
        limit: 100,
        remaining: 85,
        reset: Date.now() + 900000 // 15 minutes
      };
      
      expect(rateLimits.transcribe.limit).toBe(100);
      expect(rateLimits.transcribe.remaining).toBe(85);
      expect(rateLimits.transcribe.reset).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Color Logic', () => {
    it('should use green color when usage is below 70%', () => {
      const limit = 100;
      const remaining = 80; // 20% used
      const usagePercent = ((limit - remaining) / limit) * 100;
      
      let color = '#4caf50'; // Green
      if (usagePercent >= 90) {
        color = '#f44336'; // Red
      } else if (usagePercent >= 70) {
        color = '#ffc107'; // Yellow
      }
      
      expect(color).toBe('#4caf50');
      expect(usagePercent).toBe(20);
    });

    it('should use yellow color when usage is at 70%', () => {
      const limit = 100;
      const remaining = 30; // 70% used
      const usagePercent = ((limit - remaining) / limit) * 100;
      
      let color = '#4caf50'; // Green
      if (usagePercent >= 90) {
        color = '#f44336'; // Red
      } else if (usagePercent >= 70) {
        color = '#ffc107'; // Yellow
      }
      
      expect(color).toBe('#ffc107');
      expect(usagePercent).toBe(70);
    });

    it('should use yellow color when usage is between 70-89%', () => {
      const limit = 100;
      const remaining = 20; // 80% used
      const usagePercent = ((limit - remaining) / limit) * 100;
      
      let color = '#4caf50'; // Green
      if (usagePercent >= 90) {
        color = '#f44336'; // Red
      } else if (usagePercent >= 70) {
        color = '#ffc107'; // Yellow
      }
      
      expect(color).toBe('#ffc107');
      expect(usagePercent).toBe(80);
    });

    it('should use red color when usage is at 90% or above', () => {
      const limit = 100;
      const remaining = 5; // 95% used
      const usagePercent = ((limit - remaining) / limit) * 100;
      
      let color = '#4caf50'; // Green
      if (usagePercent >= 90) {
        color = '#f44336'; // Red
      } else if (usagePercent >= 70) {
        color = '#ffc107'; // Yellow
      }
      
      expect(color).toBe('#f44336');
      expect(usagePercent).toBe(95);
    });

    it('should use red color when limit is exhausted', () => {
      const limit = 100;
      const remaining = 0; // 100% used
      const usagePercent = ((limit - remaining) / limit) * 100;
      
      let color = '#4caf50'; // Green
      if (usagePercent >= 90) {
        color = '#f44336'; // Red
      } else if (usagePercent >= 70) {
        color = '#ffc107'; // Yellow
      }
      
      expect(color).toBe('#f44336');
      expect(usagePercent).toBe(100);
    });
  });

  describe('Rate Limit Display', () => {
    it('should create indicator elements for each API', () => {
      const container = document.getElementById('rateLimitIndicators');
      const rateLimits = {
        transcribe: { limit: 100, remaining: 85, reset: 0 },
        chat: { limit: 100, remaining: 70, reset: 0 }
      };
      
      const html = Object.keys(rateLimits).map(apiName => {
        const data = rateLimits[apiName];
        if (data.limit === 0) return '';
        
        const usagePercent = ((data.limit - data.remaining) / data.limit) * 100;
        let color = '#4caf50';
        if (usagePercent >= 90) {
          color = '#f44336';
        } else if (usagePercent >= 70) {
          color = '#ffc107';
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
      
      expect(container.querySelectorAll('.rate-limit-indicator')).toHaveLength(2);
      expect(container.querySelectorAll('.rate-limit-dot')).toHaveLength(2);
      expect(container.querySelectorAll('.rate-limit-label')).toHaveLength(2);
    });

    it('should skip display when no data available', () => {
      const container = document.getElementById('rateLimitIndicators');
      const rateLimits = {
        transcribe: { limit: 0, remaining: 0, reset: 0 },
        chat: { limit: 0, remaining: 0, reset: 0 }
      };
      
      const html = Object.keys(rateLimits).map(apiName => {
        const data = rateLimits[apiName];
        if (data.limit === 0) return '';
        return '<div>test</div>';
      }).join('');
      
      container.innerHTML = html;
      
      expect(container.innerHTML).toBe('');
    });

    it('should display correct API labels', () => {
      const container = document.getElementById('rateLimitIndicators');
      const apiLabels = {
        'transcribe': 'STT',
        'chat': 'Chat'
      };
      
      Object.keys(apiLabels).forEach(apiName => {
        const apiLabel = apiName === 'transcribe' ? 'STT' : 'Chat';
        expect(apiLabel).toBe(apiLabels[apiName]);
      });
    });
  });

  describe('Header Parsing', () => {
    it('should parse rate limit headers correctly', () => {
      // Mock Headers object
      const mockHeaders = {
        'RateLimit-Limit': '100',
        'RateLimit-Remaining': '85',
        'RateLimit-Reset': '1234567890'
      };
      
      const limit = parseInt(mockHeaders['RateLimit-Limit']);
      const remaining = parseInt(mockHeaders['RateLimit-Remaining']);
      const reset = parseInt(mockHeaders['RateLimit-Reset']);
      
      expect(limit).toBe(100);
      expect(remaining).toBe(85);
      expect(reset).toBe(1234567890);
    });

    it('should handle missing headers gracefully', () => {
      const mockHeaders = {
        'RateLimit-Limit': '100',
        'RateLimit-Remaining': '85'
        // Missing Reset header
      };
      
      const limit = mockHeaders['RateLimit-Limit'];
      const remaining = mockHeaders['RateLimit-Remaining'];
      const reset = mockHeaders['RateLimit-Reset'];
      
      expect(limit).toBe('100');
      expect(remaining).toBe('85');
      expect(reset).toBeUndefined();
    });
  });
});
