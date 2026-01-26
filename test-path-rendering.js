/**
 * Path Rendering Test
 * This test starts the server, navigates to the path test page,
 * and takes a screenshot for documentation purposes.
 */

const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const SCREENSHOT_PATH = path.join(SCREENSHOT_DIR, 'path-rendering.png');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
    let server = null;
    let browser = null;

    try {
        console.log('🚀 Starting server...');
        
        // Start the Express server
        server = spawn('node', ['server/index.js'], {
            stdio: 'pipe',
            env: { ...process.env, PORT: SERVER_PORT }
        });

        // Wait for server to start
        await new Promise((resolve) => {
            server.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`   ${output.trim()}`);
                if (output.includes('Server running') || output.includes('listening')) {
                    resolve();
                }
            });
            
            // Fallback timeout
            setTimeout(resolve, 3000);
        });

        console.log('✅ Server started\n');

        console.log('🌐 Launching browser...');
        
        // Launch browser
        browser = await chromium.launch({
            headless: true,
            executablePath: '/usr/bin/chromium'
        });

        const context = await browser.newContext({
            viewport: { width: 1200, height: 900 }
        });

        const page = await context.newPage();

        console.log('📄 Navigating to path test page...');
        
        // Navigate to the test page
        await page.goto(`${SERVER_URL}/path-test.html`, {
            waitUntil: 'networkidle'
        });

        console.log('✅ Page loaded\n');

        // Wait a bit for any animations to complete
        await page.waitForTimeout(500);

        console.log('📸 Taking screenshot...');
        
        // Take screenshot
        await page.screenshot({
            path: SCREENSHOT_PATH,
            fullPage: true
        });

        console.log(`✅ Screenshot saved to: ${SCREENSHOT_PATH}\n`);

        // Print success message
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Path rendering test completed successfully!');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📸 Screenshot: ${SCREENSHOT_PATH}`);
        console.log(`🔗 Test page: ${SERVER_URL}/path-test.html`);
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }

        if (server) {
            server.kill();
            console.log('🛑 Server stopped\n');
        }
    }
}

// Run the test
runTest();
