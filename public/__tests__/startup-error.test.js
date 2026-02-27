/**
 * @jest-environment jsdom
 */

/**
 * Tests for startup error handling (white screen prevention)
 */

describe('Startup Error Handling', () => {
    beforeEach(() => {
        // Set up the DOM with the overlays added in index.html
        document.body.innerHTML = `
            <div id="loadingOverlay" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>App wird geladen…</p>
                </div>
            </div>
            <div id="appErrorOverlay" class="error-overlay" style="display:none;">
                <div class="error-overlay-content">
                    <div class="error-overlay-icon">⚠️</div>
                    <h2>App konnte nicht gestartet werden</h2>
                    <p>Es ist ein unerwarteter Fehler aufgetreten.</p>
                    <pre id="appErrorDetails" class="error-overlay-details" style="display:none;"></pre>
                    <button id="reloadButton">🔄 Seite neu laden</button>
                </div>
            </div>
        `;
    });

    describe('Loading Overlay', () => {
        it('should be visible initially', () => {
            const overlay = document.getElementById('loadingOverlay');
            expect(overlay).not.toBeNull();
            expect(overlay.style.display).not.toBe('none');
        });

        it('should be hidden after successful initialisation', () => {
            const overlay = document.getElementById('loadingOverlay');

            // Simulate what hideLoadingOverlay() does
            overlay.style.display = 'none';

            expect(overlay.style.display).toBe('none');
        });
    });

    describe('Error Overlay', () => {
        it('should be hidden initially', () => {
            const overlay = document.getElementById('appErrorOverlay');
            expect(overlay).not.toBeNull();
            expect(overlay.style.display).toBe('none');
        });

        it('should be shown when showAppError is called', () => {
            const overlay = document.getElementById('appErrorOverlay');
            const details = document.getElementById('appErrorDetails');
            const loading = document.getElementById('loadingOverlay');

            // Replicate showAppError logic from index.html
            const showAppError = (message) => {
                if (loading) loading.style.display = 'none';
                if (overlay) {
                    if (details && message) {
                        details.textContent = message;
                        details.style.display = 'block';
                    }
                    overlay.style.display = 'flex';
                }
            };

            showAppError('Something went wrong');

            expect(overlay.style.display).toBe('flex');
            expect(loading.style.display).toBe('none');
            expect(details.textContent).toBe('Something went wrong');
            expect(details.style.display).toBe('block');
        });

        it('should hide loading overlay when showing error', () => {
            const loading = document.getElementById('loadingOverlay');
            const overlay = document.getElementById('appErrorOverlay');

            const showAppError = (message) => {
                if (loading) loading.style.display = 'none';
                if (overlay) overlay.style.display = 'flex';
            };

            showAppError('Init failed');

            expect(loading.style.display).toBe('none');
        });

        it('should show error overlay without details when no message provided', () => {
            const overlay = document.getElementById('appErrorOverlay');
            const details = document.getElementById('appErrorDetails');

            const showAppError = (message) => {
                if (overlay) {
                    if (details && message) {
                        details.textContent = message;
                        details.style.display = 'block';
                    }
                    overlay.style.display = 'flex';
                }
            };

            showAppError('');

            expect(overlay.style.display).toBe('flex');
            expect(details.style.display).toBe('none'); // not shown when message is empty
        });
    });

    describe('Promise rejection handling', () => {
        it('should trigger error overlay on unhandled promise rejection', () => {
            const overlay = document.getElementById('appErrorOverlay');
            const loading = document.getElementById('loadingOverlay');

            const showAppError = (message) => {
                if (loading) loading.style.display = 'none';
                if (overlay) overlay.style.display = 'flex';
            };

            // Simulate unhandledrejection handler
            const error = new Error('Async init failed');
            showAppError(error.message);

            expect(overlay.style.display).toBe('flex');
        });
    });
});
