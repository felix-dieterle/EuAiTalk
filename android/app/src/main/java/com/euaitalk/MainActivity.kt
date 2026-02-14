package com.euaitalk

import android.Manifest
import android.app.AlertDialog
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.text.InputType
import android.text.TextUtils
import android.view.Menu
import android.view.MenuItem
import android.webkit.*
import android.widget.EditText
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.text.SimpleDateFormat
import java.util.*

/**
 * Main Activity for EuAiTalk Android App
 * 
 * This app uses a WebView wrapper approach to:
 * - Reuse the existing web frontend (no code duplication)
 * - Maintain the same backend for all platforms
 * - Minimize maintenance effort and error-proneness
 * - Enable quick feature updates across platforms
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 100
    
    // Minimum content length to consider a page successfully loaded
    // Pages with less content are likely blank or incomplete
    private val MIN_PAGE_CONTENT_LENGTH = 100
    
    // SharedPreferences for storing settings
    private val PREFS_NAME = "EuAiTalkPrefs"
    private val PREF_BACKEND_URL = "backend_url"
    
    // Server URL from BuildConfig - configured per build variant
    // Debug: http://10.0.2.2:3000 (emulator localhost)
    // Release: Set in app/build.gradle
    private val DEFAULT_SERVER_URL = BuildConfig.SERVER_URL
    
    // Log storage
    private val logMessages = mutableListOf<LogEntry>()
    private val MAX_LOGS = 100
    
    data class LogEntry(
        val timestamp: Long,
        val level: String,
        val message: String
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)
        
        // Request necessary permissions
        requestPermissions()
        
        // Configure WebView
        setupWebView()
        
        // Setup back button handling
        setupBackNavigation()
        
        // Load the app
        loadApp()
    }
    
    /**
     * Get the configured backend URL from SharedPreferences or use default
     */
    private fun getServerUrl(): String {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val customUrl = prefs.getString(PREF_BACKEND_URL, "")
        return if (customUrl.isNullOrEmpty()) DEFAULT_SERVER_URL else customUrl
    }
    
    /**
     * Save backend URL to SharedPreferences
     */
    private fun saveServerUrl(url: String) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(PREF_BACKEND_URL, url).apply()
    }
    
    /**
     * Add a log entry
     */
    private fun addLog(level: String, message: String) {
        synchronized(logMessages) {
            logMessages.add(LogEntry(System.currentTimeMillis(), level, message))
            if (logMessages.size > MAX_LOGS) {
                logMessages.removeAt(0)
            }
        }
    }

    /**
     * Request required permissions for audio recording
     */
    private fun requestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        )
        
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    /**
     * Configure WebView settings for optimal performance and compatibility
     */
    private fun setupWebView() {
        webView.settings.apply {
            // Enable JavaScript (required for the app)
            javaScriptEnabled = true
            
            // Enable DOM storage (required for web app state)
            domStorageEnabled = true
            
            // Enable media features
            mediaPlaybackRequiresUserGesture = false
            
            // Allow file access (for local resources)
            allowFileAccess = true
            allowContentAccess = true
            
            // Enable database
            databaseEnabled = true
            
            // Better performance
            cacheMode = WebSettings.LOAD_DEFAULT
            
            // Enable zoom controls (optional)
            builtInZoomControls = false
            displayZoomControls = false
            
            // Better rendering
            useWideViewPort = true
            loadWithOverviewMode = true
        }
        
        // Enable debugging in debug builds only
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        
        // Set WebViewClient to handle navigation
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Keep navigation within the WebView
                return false
            }
            
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                
                // Provide user-friendly error message with solution
                val errorCode = error?.errorCode
                val isMainFrameError = request?.isForMainFrame == true
                
                if (isMainFrameError) {
                    // Show error page instead of blank white screen
                    showErrorPage(error)
                    
                    // Log for debugging (debug builds only to avoid exposing URL in production)
                    val serverUrl = getServerUrl()
                    val errorLog = "Error loading $serverUrl: ${error?.description} (code: $errorCode)"
                    addLog("ERROR", errorLog)
                    if (BuildConfig.DEBUG) {
                        android.util.Log.d("MainActivity", errorLog)
                    } else {
                        android.util.Log.e("MainActivity", "Error loading server: ${error?.description} (code: $errorCode)")
                    }
                }
            }
            
            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                
                val isMainFrameError = request?.isForMainFrame == true
                
                if (isMainFrameError) {
                    // Show error page for HTTP errors (4xx, 5xx)
                    // Pass null since we'll generate error details in showErrorPage
                    showErrorPage(null)
                    
                    // Log for debugging
                    val serverUrl = getServerUrl()
                    val errorLog = "HTTP Error loading $serverUrl: ${errorResponse?.statusCode} ${errorResponse?.reasonPhrase}"
                    addLog("ERROR", errorLog)
                    if (BuildConfig.DEBUG) {
                        android.util.Log.d("MainActivity", errorLog)
                    } else {
                        android.util.Log.e("MainActivity", "HTTP Error loading server: ${errorResponse?.statusCode}")
                    }
                }
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                
                val serverUrl = getServerUrl()
                // Only check for blank pages when loading the server URL, not error pages or other navigations
                // This prevents infinite loops where the error page triggers another blank page detection
                if (url != serverUrl) {
                    return
                }
                
                // Check if the page is actually loaded by evaluating JavaScript
                // This helps detect "successful" loads that result in blank pages
                // We look for the container div which should exist in the real app
                view?.evaluateJavascript(
                    "(function() { var container = document.querySelector('.container'); return container && container.innerHTML.trim().length > $MIN_PAGE_CONTENT_LENGTH; })();"
                ) { result ->
                    // result is "true" if page has meaningful content, "false" or "null" if blank
                    if (result == "false" || result == "null") {
                        // Page loaded but is blank or has minimal content - likely a connection issue
                        if (BuildConfig.DEBUG) {
                            android.util.Log.d("MainActivity", "Page loaded but appears blank or incomplete")
                        }
                        // Show error page for blank content
                        // Pass null since the page appears blank
                        showErrorPage(null)
                    }
                }
            }
        }
        
        // Set WebChromeClient to handle permissions and dialogs
        webView.webChromeClient = object : WebChromeClient() {
            
            // Handle permission requests from web page
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    // Grant microphone permission to web page
                    if (it.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        // Check if app has permission
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            it.grant(it.resources)
                        } else {
                            it.deny()
                            Toast.makeText(
                                this@MainActivity,
                                "Mikrofon-Berechtigung erforderlich",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                }
            }
            
            // Handle JavaScript alerts
            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
                result?.confirm()
                return true
            }
            
            // Handle console messages (useful for debugging)
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    val logMsg = "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}"
                    val level = when (it.messageLevel()) {
                        ConsoleMessage.MessageLevel.ERROR -> "ERROR"
                        ConsoleMessage.MessageLevel.WARNING -> "WARN"
                        else -> "INFO"
                    }
                    addLog(level, logMsg)
                    android.util.Log.d("WebView", logMsg)
                }
                return true
            }
        }
    }

    /**
     * Load the web app
     */
    private fun loadApp() {
        val serverUrl = getServerUrl()
        addLog("INFO", "Loading app from: $serverUrl")
        webView.loadUrl(serverUrl)
    }
    
    /**
     * Show error page when server is not reachable
     * 
     * Displays a user-friendly HTML error page instead of a blank white screen when
     * the WebView fails to load the server. The error page includes:
     * - A clear error title and description
     * - Troubleshooting steps tailored to the build type (debug vs release)
     * - A retry button to attempt reloading
     * - App version information
     * 
     * @param error The WebResourceError containing error details, or null for generic errors
     */
    private fun showErrorPage(error: WebResourceError?) {
        val errorCode = error?.errorCode
        val errorDescription = error?.description ?: "Unbekannter Fehler"
        
        // HTML-escape the error description to prevent HTML injection
        val safeErrorDescription = htmlEscape(errorDescription.toString())
        val serverUrl = getServerUrl()
        val safeServerUrl = htmlEscape(serverUrl)
        
        // Build error message components
        // Note: troubleshootingSteps contains intentional HTML markup (list items and code tags)
        // errorDetails is constructed using already-escaped variables (safeServerUrl, safeErrorDescription)
        //   - String templates are safe when interpolating pre-escaped variables
        // errorTitle will be escaped to safeErrorTitle below for defense-in-depth
        val (errorTitle, errorDetails, troubleshootingSteps) = when (errorCode) {
            WebViewClient.ERROR_HOST_LOOKUP,
            WebViewClient.ERROR_CONNECT,
            WebViewClient.ERROR_TIMEOUT -> {
                if (BuildConfig.DEBUG) {
                    Triple(
                        "Server nicht erreichbar",
                        "Verbindung zu $safeServerUrl fehlgeschlagen",
                        """
                        <li>Starten Sie den Backend-Server mit <code>npm start</code></li>
                        <li>Überprüfen Sie die Server-URL in <code>app/build.gradle</code></li>
                        <li>Stellen Sie sicher, dass Ihr Gerät/Emulator mit dem Netzwerk verbunden ist</li>
                        <li>Für echte Geräte: Verwenden Sie die lokale IP-Adresse (z.B. 192.168.1.100:3000)</li>
                        """.trimIndent()
                    )
                } else {
                    Triple(
                        "Server nicht erreichbar",
                        "Die Verbindung zum Server konnte nicht hergestellt werden",
                        """
                        <li>Stellen Sie sicher, dass der Server gestartet ist</li>
                        <li>Überprüfen Sie Ihre Internetverbindung</li>
                        <li>Die Server-URL könnte falsch konfiguriert sein</li>
                        """.trimIndent()
                    )
                }
            }
            else -> Triple(
                "Fehler beim Laden",
                safeErrorDescription,
                "<li>Versuchen Sie es erneut</li><li>Überprüfen Sie Ihre Internetverbindung</li>"
            )
        }
        
        // Escape errorTitle for defense-in-depth security
        // While currently hardcoded, this ensures safety if the code is modified later
        // to include dynamic content, following the principle of "secure by default"
        val safeErrorTitle = htmlEscape(errorTitle)
        val safeVersionName = htmlEscape(BuildConfig.VERSION_NAME)
        
        val html = """
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verbindungsfehler</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        color: #333;
                    }
                    .container {
                        background: white;
                        border-radius: 16px;
                        padding: 30px;
                        max-width: 500px;
                        width: 100%;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    }
                    .icon {
                        font-size: 64px;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        text-align: center;
                        color: #667eea;
                    }
                    .error-details {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        color: #666;
                        word-break: break-word;
                    }
                    .steps {
                        margin-bottom: 20px;
                    }
                    .steps h2 {
                        font-size: 16px;
                        margin-bottom: 10px;
                        color: #555;
                    }
                    .steps ul {
                        padding-left: 20px;
                        line-height: 1.6;
                    }
                    .steps li {
                        margin-bottom: 8px;
                        color: #666;
                        font-size: 14px;
                    }
                    .steps code {
                        background: #f0f0f0;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                    }
                    .button {
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    .button:active {
                        transform: scale(0.98);
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">⚠️</div>
                    <h1>$safeErrorTitle</h1>
                    <div class="error-details">$errorDetails</div>
                    <div class="steps">
                        <h2>Was Sie tun können:</h2>
                        <ul>
                            $troubleshootingSteps
                        </ul>
                    </div>
                    <button class="button" onclick="window.location.reload()">
                        🔄 Erneut versuchen
                    </button>
                    <div class="footer">
                        EuAiTalk v$safeVersionName
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
        
        // Use 'about:blank' as baseURL to prevent potential security issues
        webView.loadDataWithBaseURL("about:blank", html, "text/html", "UTF-8", null)
    }
    
    /**
     * HTML-escape a string to prevent HTML injection attacks
     * 
     * Uses Android's TextUtils.htmlEncode() to properly escape HTML special characters.
     * This ensures comprehensive escaping and handles edge cases correctly.
     * 
     * @param text The text to escape
     * @return The HTML-escaped text
     */
    private fun htmlEscape(text: String): String {
        return TextUtils.htmlEncode(text)
    }

    /**
     * Handle permission request results
     */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Toast.makeText(this, "Berechtigungen erteilt", Toast.LENGTH_SHORT).show()
                    // Reload the page to apply permissions
                    webView.reload()
                } else {
                    Toast.makeText(
                        this,
                        "Mikrofon-Berechtigung ist für diese App erforderlich",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    /**
     * Setup back button navigation for WebView
     * Uses modern OnBackPressedDispatcher API for Android 13+ compatibility
     */
    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    // Let the system handle the back press (exit app)
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    /**
     * Clean up WebView on destroy
     */
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
    
    /**
     * Create options menu
     */
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }
    
    /**
     * Handle menu item selection
     */
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                showSettingsDialog()
                true
            }
            R.id.action_logs -> {
                showLogsDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    /**
     * Show settings dialog for backend URL configuration
     */
    private fun showSettingsDialog() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentUrl = prefs.getString(PREF_BACKEND_URL, "") ?: ""
        
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setText(currentUrl)
            hint = getString(R.string.settings_backend_url_hint)
        }
        
        AlertDialog.Builder(this)
            .setTitle(R.string.settings_title)
            .setMessage(R.string.settings_backend_url_description)
            .setView(input)
            .setPositiveButton(R.string.settings_save) { _, _ ->
                val newUrl = input.text.toString().trim()
                saveServerUrl(newUrl)
                addLog("INFO", "Backend URL updated to: ${if (newUrl.isEmpty()) DEFAULT_SERVER_URL else newUrl}")
                Toast.makeText(this, R.string.backend_url_updated, Toast.LENGTH_SHORT).show()
                // Reload the app with new URL
                loadApp()
            }
            .setNeutralButton(R.string.settings_reset) { _, _ ->
                saveServerUrl("")
                addLog("INFO", "Backend URL reset to default: $DEFAULT_SERVER_URL")
                Toast.makeText(this, R.string.backend_url_reset, Toast.LENGTH_SHORT).show()
                // Reload the app with default URL
                loadApp()
            }
            .setNegativeButton(R.string.settings_cancel, null)
            .show()
    }
    
    /**
     * Show logs dialog
     */
    private fun showLogsDialog() {
        val logsText = StringBuilder()
        val dateFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        
        synchronized(logMessages) {
            if (logMessages.isEmpty()) {
                logsText.append(getString(R.string.logs_empty))
            } else {
                logMessages.forEach { log ->
                    val time = dateFormat.format(Date(log.timestamp))
                    logsText.append("[$time] ${log.level}: ${log.message}\n\n")
                }
            }
        }
        
        val textView = TextView(this).apply {
            text = logsText.toString()
            setPadding(40, 40, 40, 40)
            setTextIsSelectable(true)
        }
        
        val scrollView = ScrollView(this).apply {
            addView(textView)
        }
        
        AlertDialog.Builder(this)
            .setTitle(R.string.logs_title)
            .setView(scrollView)
            .setPositiveButton(R.string.logs_close, null)
            .setNegativeButton(R.string.logs_clear) { _, _ ->
                synchronized(logMessages) {
                    logMessages.clear()
                }
                Toast.makeText(this, R.string.logs_cleared, Toast.LENGTH_SHORT).show()
            }
            .show()
    }
}
