package com.euaitalk

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

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
    
    // Server URL from BuildConfig - configured per build variant
    // Debug: http://10.0.2.2:3000 (emulator localhost)
    // Release: Set in app/build.gradle
    private val SERVER_URL = BuildConfig.SERVER_URL

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
                Toast.makeText(
                    this@MainActivity,
                    "Fehler beim Laden: ${error?.description}",
                    Toast.LENGTH_LONG
                ).show()
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
                    android.util.Log.d(
                        "WebView",
                        "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}"
                    )
                }
                return true
            }
        }
    }

    /**
     * Load the web app
     */
    private fun loadApp() {
        webView.loadUrl(SERVER_URL)
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
}
