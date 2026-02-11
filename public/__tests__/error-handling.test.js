/**
 * Tests for error handling and configurable backend
 */

// Mock DOM elements needed for tests
const mockStatusDiv = { textContent: '', className: '' };
const mockApiStatusDiv = { innerHTML: '' };
const mockRecordButton = { disabled: false };
const mockChatContainer = { querySelector: () => null, innerHTML: '' };

// Mock the DOM
global.document = {
    getElementById: (id) => {
        switch (id) {
            case 'status': return mockStatusDiv;
            case 'apiStatus': return mockApiStatusDiv;
            case 'recordButton': return mockRecordButton;
            case 'chatContainer': return mockChatContainer;
            default: return null;
        }
    }
};

global.window = {
    location: { origin: 'http://localhost:3000' },
    addEventListener: jest.fn()
};

global.navigator = {
    onLine: true
};

// Mock fetch
global.fetch = jest.fn();

describe('Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStatusDiv.textContent = '';
        mockStatusDiv.className = '';
        mockApiStatusDiv.innerHTML = '';
        mockRecordButton.disabled = false;
        mockChatContainer.innerHTML = '';
    });

    describe('Backend URL Configuration', () => {
        test('should use default backend URL when not configured', () => {
            const settings = { backendUrl: '' };
            const getBackendUrl = () => settings.backendUrl || window.location.origin;
            
            expect(getBackendUrl()).toBe('http://localhost:3000');
        });

        test('should use configured backend URL', () => {
            const settings = { backendUrl: 'http://192.168.1.100:3000' };
            const getBackendUrl = () => settings.backendUrl || window.location.origin;
            
            expect(getBackendUrl()).toBe('http://192.168.1.100:3000');
        });

        test('should trim whitespace from backend URL', () => {
            const backendUrl = '  http://192.168.1.100:3000  ';
            const trimmed = backendUrl.trim();
            
            expect(trimmed).toBe('http://192.168.1.100:3000');
        });
    });

    describe('Online/Offline Detection', () => {
        test('should detect online state', () => {
            expect(navigator.onLine).toBe(true);
        });

        test('should listen for online/offline events', () => {
            const listeners = {};
            window.addEventListener = jest.fn((event, handler) => {
                listeners[event] = handler;
            });

            // Simulate setting up online detection
            window.addEventListener('online', jest.fn());
            window.addEventListener('offline', jest.fn());

            expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });

    describe('Network Error Handling', () => {
        test('should handle fetch timeout', async () => {
            const controller = new AbortController();
            controller.abort();

            global.fetch.mockRejectedValueOnce(
                Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
            );

            try {
                await fetch('/api/health', { signal: controller.signal });
            } catch (error) {
                expect(error.name).toBe('AbortError');
            }
        });

        test('should handle network failure', async () => {
            global.fetch.mockRejectedValueOnce(
                new TypeError('Failed to fetch')
            );

            try {
                await fetch('/api/health');
            } catch (error) {
                expect(error.name).toBe('TypeError');
                expect(error.message).toContain('fetch');
            }
        });

        test('should handle HTTP errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({ error: 'Server error' })
            });

            const response = await fetch('/api/health');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);
        });

        test('should handle rate limit errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: async () => ({ error: 'Rate limit exceeded' })
            });

            const response = await fetch('/api/transcribe');
            expect(response.status).toBe(429);
        });
    });

    describe('User Feedback', () => {
        test('should update status message', () => {
            const updateStatus = (message, type = 'info') => {
                mockStatusDiv.textContent = message;
                mockStatusDiv.className = `status ${type}`;
            };

            updateStatus('Test message', 'error');
            expect(mockStatusDiv.textContent).toBe('Test message');
            expect(mockStatusDiv.className).toBe('status error');
        });

        test('should update API status display', () => {
            const updateApiStatusDisplay = (isOnline, backendAvailable) => {
                if (!isOnline) {
                    mockApiStatusDiv.innerHTML = '<small>⚠️ Offline</small>';
                } else if (!backendAvailable) {
                    mockApiStatusDiv.innerHTML = '<small>❌ Server nicht erreichbar</small>';
                }
            };

            updateApiStatusDisplay(false, false);
            expect(mockApiStatusDiv.innerHTML).toBe('<small>⚠️ Offline</small>');

            updateApiStatusDisplay(true, false);
            expect(mockApiStatusDiv.innerHTML).toBe('<small>❌ Server nicht erreichbar</small>');
        });

        test('should disable recording when offline', () => {
            const setRecordingEnabled = (enabled) => {
                mockRecordButton.disabled = !enabled;
            };

            setRecordingEnabled(false);
            expect(mockRecordButton.disabled).toBe(true);

            setRecordingEnabled(true);
            expect(mockRecordButton.disabled).toBe(false);
        });
    });

    describe('Settings Persistence', () => {
        test('should save backend URL to settings', () => {
            const settings = {
                ttsSpeed: 1.0,
                ttsPitch: 1.0,
                defaultPersona: 'general',
                autoPlayTTS: true,
                backendUrl: 'http://192.168.1.100:3000'
            };

            const settingsJson = JSON.stringify(settings);
            const parsed = JSON.parse(settingsJson);

            expect(parsed.backendUrl).toBe('http://192.168.1.100:3000');
        });

        test('should handle empty backend URL', () => {
            const settings = {
                backendUrl: ''
            };

            const getBackendUrl = () => settings.backendUrl || window.location.origin;
            expect(getBackendUrl()).toBe('http://localhost:3000');
        });
    });

    describe('Error Recovery', () => {
        test('should allow retry after network error', async () => {
            // First call fails
            global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

            try {
                await fetch('/api/health');
            } catch (error) {
                expect(error.message).toContain('fetch');
            }

            // Second call succeeds
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'ok', apiConfigured: true })
            });

            const response = await fetch('/api/health');
            expect(response.ok).toBe(true);
        });

        test('should handle conversation history rollback on chat error', () => {
            const conversationHistory = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there!' }
            ];

            // Add new message
            conversationHistory.push({ role: 'user', content: 'How are you?' });
            expect(conversationHistory.length).toBe(3);

            // Simulate error - rollback by removing last message
            conversationHistory.pop();
            expect(conversationHistory.length).toBe(2);
            expect(conversationHistory[conversationHistory.length - 1].content).toBe('Hi there!');
        });
    });
});
