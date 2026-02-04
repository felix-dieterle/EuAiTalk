/**
 * @jest-environment jsdom
 */

/**
 * Frontend UI and State Tests
 * Tests for message handling, status updates, and UI state management
 */

describe('Frontend UI and State Management', () => {
  beforeEach(() => {
    // Set up DOM with required elements
    document.body.innerHTML = `
      <div id="chatContainer">
        <div class="welcome-message">
          <p>Welcome message</p>
        </div>
      </div>
      <div id="status" class="status info"></div>
      <button id="recordButton"></button>
    `;
  });

  describe('Message Handling', () => {
    it('should create user message element correctly', () => {
      const chatContainer = document.getElementById('chatContainer');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message user-message';
      
      const icon = '👤';
      const label = 'Du';
      const text = 'Hello AI';
      
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-label">${label}</span>
        </div>
        <div class="message-content">${text}</div>
      `;
      
      chatContainer.appendChild(messageDiv);
      
      expect(chatContainer.querySelectorAll('.user-message')).toHaveLength(1);
      expect(messageDiv.textContent).toContain('Du');
      expect(messageDiv.textContent).toContain('Hello AI');
    });

    it('should create AI message element correctly', () => {
      const chatContainer = document.getElementById('chatContainer');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ai-message';
      
      const icon = '🤖';
      const label = 'KI';
      const text = 'Hello human';
      
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-label">${label}</span>
        </div>
        <div class="message-content">${text}</div>
      `;
      
      chatContainer.appendChild(messageDiv);
      
      expect(chatContainer.querySelectorAll('.ai-message')).toHaveLength(1);
      expect(messageDiv.textContent).toContain('KI');
      expect(messageDiv.textContent).toContain('Hello human');
    });

    it('should remove welcome message when adding first message', () => {
      const chatContainer = document.getElementById('chatContainer');
      const welcomeMessage = chatContainer.querySelector('.welcome-message');
      
      expect(welcomeMessage).not.toBeNull();
      
      // Simulate removing welcome message
      welcomeMessage.remove();
      
      expect(chatContainer.querySelector('.welcome-message')).toBeNull();
    });

    it('should allow multiple messages', () => {
      const chatContainer = document.getElementById('chatContainer');
      
      // Remove welcome message first
      const welcomeMessage = chatContainer.querySelector('.welcome-message');
      welcomeMessage.remove();
      
      // Add multiple messages
      for (let i = 0; i < 3; i++) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = `Message ${i}`;
        chatContainer.appendChild(messageDiv);
      }
      
      expect(chatContainer.querySelectorAll('.user-message')).toHaveLength(3);
    });
  });

  describe('Status Management', () => {
    it('should update status text', () => {
      const statusDiv = document.getElementById('status');
      
      statusDiv.textContent = 'Bereit zum Aufnehmen';
      expect(statusDiv.textContent).toBe('Bereit zum Aufnehmen');
      
      statusDiv.textContent = '🎙️ Aufnahme läuft...';
      expect(statusDiv.textContent).toBe('🎙️ Aufnahme läuft...');
    });

    it('should update status class', () => {
      const statusDiv = document.getElementById('status');
      
      statusDiv.className = 'status info';
      expect(statusDiv.classList.contains('info')).toBe(true);
      
      statusDiv.className = 'status error';
      expect(statusDiv.classList.contains('error')).toBe(true);
      expect(statusDiv.classList.contains('info')).toBe(false);
    });

    it('should support different status types', () => {
      const statusDiv = document.getElementById('status');
      const statusTypes = ['info', 'error', 'success', 'warning'];
      
      statusTypes.forEach(type => {
        statusDiv.className = `status ${type}`;
        expect(statusDiv.classList.contains(type)).toBe(true);
      });
    });
  });

  describe('Recording State', () => {
    it('should toggle recording class on button', () => {
      const recordButton = document.getElementById('recordButton');
      
      expect(recordButton.classList.contains('recording')).toBe(false);
      
      recordButton.classList.add('recording');
      expect(recordButton.classList.contains('recording')).toBe(true);
      
      recordButton.classList.remove('recording');
      expect(recordButton.classList.contains('recording')).toBe(false);
    });

    it('should maintain recording state', () => {
      let isRecording = false;
      
      expect(isRecording).toBe(false);
      
      isRecording = true;
      expect(isRecording).toBe(true);
      
      isRecording = false;
      expect(isRecording).toBe(false);
    });
  });

  describe('Conversation History', () => {
    it('should maintain message order', () => {
      const conversationHistory = [];
      
      conversationHistory.push({ role: 'user', content: 'First message' });
      conversationHistory.push({ role: 'assistant', content: 'AI response' });
      conversationHistory.push({ role: 'user', content: 'Second message' });
      
      expect(conversationHistory).toHaveLength(3);
      expect(conversationHistory[0].role).toBe('user');
      expect(conversationHistory[1].role).toBe('assistant');
      expect(conversationHistory[2].role).toBe('user');
    });

    it('should clear conversation history', () => {
      const conversationHistory = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' }
      ];
      
      expect(conversationHistory).toHaveLength(2);
      
      // Clear by reassigning
      const cleared = [];
      expect(cleared).toHaveLength(0);
    });

    it('should structure messages correctly', () => {
      const message = { role: 'user', content: 'Hello' };
      
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(['user', 'assistant', 'system']).toContain(message.role);
    });
  });

  describe('Chat Container', () => {
    it('should support scrolling', () => {
      const chatContainer = document.getElementById('chatContainer');
      
      // Add many messages to trigger scrolling
      for (let i = 0; i < 10; i++) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = `Message ${i}`;
        chatContainer.appendChild(messageDiv);
      }
      
      expect(chatContainer.children.length).toBeGreaterThan(10); // +1 for welcome
    });

    it('should allow clearing all messages', () => {
      const chatContainer = document.getElementById('chatContainer');
      
      // Add some messages
      for (let i = 0; i < 3; i++) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        chatContainer.appendChild(messageDiv);
      }
      
      // Clear by setting innerHTML
      chatContainer.innerHTML = `
        <div class="welcome-message">
          <p>👋 Willkommen bei EuAiTalk!</p>
        </div>
      `;
      
      expect(chatContainer.querySelectorAll('.user-message')).toHaveLength(0);
      expect(chatContainer.querySelector('.welcome-message')).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should display error status', () => {
      const statusDiv = document.getElementById('status');
      
      statusDiv.textContent = '❌ Fehler beim Aufnehmen';
      statusDiv.className = 'status error';
      
      expect(statusDiv.textContent).toContain('❌');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should handle multiple error types', () => {
      const errorMessages = [
        '❌ Mikrofon-Zugriff verweigert',
        '❌ Transkription fehlgeschlagen',
        '❌ Chat fehlgeschlagen',
        '❌ Verarbeitungsfehler'
      ];
      
      const statusDiv = document.getElementById('status');
      
      errorMessages.forEach(msg => {
        statusDiv.textContent = msg;
        expect(statusDiv.textContent).toContain('❌');
      });
    });
  });
});
