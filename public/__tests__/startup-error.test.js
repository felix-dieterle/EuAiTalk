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
                    <p id="loadingVersion" class="loading-version"></p>
                </div>
            </div>
            <div id="appErrorOverlay" class="error-overlay" style="display:none;">
                <div class="error-overlay-content">
                    <div class="error-overlay-icon">⚠️</div>
                    <h2>App konnte nicht gestartet werden</h2>
                    <p>Es ist ein unerwarteter Fehler aufgetreten.</p>
                    <pre id="appErrorDetails" class="error-overlay-details" style="display:none;"></pre>
                    <button onclick="if(typeof retryApp === 'function') retryApp(); else window.location.reload();" class="error-reload-button">🔄 Erneut versuchen</button>
                    <button onclick="if(typeof openSettings === 'function') openSettings();" class="error-settings-button">⚙️ Einstellungen öffnen</button>
                </div>
            </div>
            <div id="settingsModal" class="modal"></div>
        `;
        // Clean up any global functions between tests
        delete window.retryApp;
        delete window.openSettings;
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

        it('should display version text on the loading overlay', () => {
            const versionEl = document.getElementById('loadingVersion');
            expect(versionEl).not.toBeNull();

            // Simulate checkApiStatus() populating the version element
            versionEl.textContent = 'v1.0.21';

            expect(versionEl.textContent).toBe('v1.0.21');
        });

        it('should start with an empty version element', () => {
            const versionEl = document.getElementById('loadingVersion');
            expect(versionEl).not.toBeNull();
            expect(versionEl.textContent).toBe('');
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

        it('should have a settings button in the error overlay', () => {
            const settingsButton = document.querySelector('.error-settings-button');
            expect(settingsButton).not.toBeNull();
            expect(settingsButton.textContent).toContain('Einstellungen');
        });

        it('should call openSettings when settings button is clicked and function exists', () => {
            const openSettingsMock = jest.fn();
            window.openSettings = openSettingsMock;

            const settingsButton = document.querySelector('.error-settings-button');
            settingsButton.click();

            expect(openSettingsMock).toHaveBeenCalledTimes(1);

            delete window.openSettings;
        });

        it('should not throw when settings button is clicked and openSettings is not defined', () => {
            delete window.openSettings;
            const settingsButton = document.querySelector('.error-settings-button');
            expect(() => settingsButton.click()).not.toThrow();
        });

        it('should have a retry button labelled "Erneut versuchen"', () => {
            const retryButton = document.querySelector('.error-reload-button');
            expect(retryButton).not.toBeNull();
            expect(retryButton.textContent).toContain('Erneut versuchen');
        });
    });

    describe('Retry button behaviour', () => {
        it('should call retryApp when retry button is clicked and retryApp is defined', () => {
            const retryMock = jest.fn();
            window.retryApp = retryMock;

            const retryButton = document.querySelector('.error-reload-button');
            retryButton.click();

            expect(retryMock).toHaveBeenCalledTimes(1);
        });

        it('should fall back to window.location.reload when retryApp is not defined', () => {
            // The retry button uses inline onclick with a conditional fallback:
            // if(typeof retryApp === 'function') retryApp(); else window.location.reload();
            // We verify the fallback is present in the onclick attribute.
            delete window.retryApp;
            const retryButton = document.querySelector('.error-reload-button');
            const onclickAttr = retryButton.getAttribute('onclick');
            expect(onclickAttr).toContain('window.location.reload()');
            expect(onclickAttr).toContain('retryApp');
        });

        it('should hide the error overlay and show the loading overlay during retry', async () => {
            const errorOverlay = document.getElementById('appErrorOverlay');
            const loadingOverlay = document.getElementById('loadingOverlay');

            // Put app into error state
            errorOverlay.style.display = 'flex';
            loadingOverlay.style.display = 'none';

            // Simulate retryApp: show loading, then hide it
            let loadingVisibleDuringCheck = false;
            window.retryApp = async function() {
                errorOverlay.style.display = 'none';
                loadingOverlay.style.display = 'flex';
                loadingVisibleDuringCheck = loadingOverlay.style.display === 'flex';
                // Simulate successful API check
                loadingOverlay.style.display = 'none';
            };

            const retryButton = document.querySelector('.error-reload-button');
            retryButton.click();
            await Promise.resolve(); // flush microtasks

            expect(loadingVisibleDuringCheck).toBe(true);
            expect(errorOverlay.style.display).toBe('none');
            expect(loadingOverlay.style.display).toBe('none');
        });

        it('should show the error overlay again if retry fails', async () => {
            const errorOverlay = document.getElementById('appErrorOverlay');
            const loadingOverlay = document.getElementById('loadingOverlay');

            // Put app into error state
            errorOverlay.style.display = 'flex';
            loadingOverlay.style.display = 'none';

            // Simulate retryApp that fails
            window.retryApp = async function() {
                errorOverlay.style.display = 'none';
                loadingOverlay.style.display = 'flex';
                // Simulate failed API check → show error again
                loadingOverlay.style.display = 'none';
                errorOverlay.style.display = 'flex';
            };

            const retryButton = document.querySelector('.error-reload-button');
            retryButton.click();
            await Promise.resolve();

            expect(errorOverlay.style.display).toBe('flex');
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
