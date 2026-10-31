package com.nnddtv.app

import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import com.getcapacitor.BridgeActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Universal Entry Point for KOBIN.tv (Android Mobile & Android TV / Google TV).
 * Integrates:
 * - Deterministic Unified Virtual MAC Address
 * - Non-Destructive State-Driven TV Launcher Mode
 * - 2FA Exit Protocol (3.0s D-Pad Center Hold OR 5x Back + 4-Digit PIN)
 * - TV App Dock (YouTube TV, Play Store, Browser, Wi-Fi Settings, All TV Apps)
 * - Mobile-to-TV Wireless ADB Optimizer (Safe Mode)
 * - Native Bridge for the 13% Translucent Cinema Glass Web UI
 */
class MainActivity : BridgeActivity() {

    private val mainScope = CoroutineScope(Dispatchers.Main)
    private val mainHandler = Handler(Looper.getMainLooper())

    // 3.0s Hold Detection for D-Pad Center in TV Launcher Mode
    private var centerKeyDownTime = 0L
    private var isCenterHolding = false
    private val centerHoldThresholdMs = 3000L
    private val centerHoldRunnable = Runnable {
        if (isCenterHolding && LauncherStateManager.isLauncherMode(this)) {
            isCenterHolding = false
            triggerPinDialogInWebView()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Landscape & Cutout layout configuration
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        window.statusBarColor = 0xFF020617.toInt()
        window.navigationBarColor = 0xFF020617.toInt()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        hideSystemUI()
        configureWebView()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        val decorView = window.decorView
        @Suppress("DEPRECATION")
        decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    private fun configureWebView() {
        val webView = bridge?.webView ?: return
        webView.setBackgroundColor(0xFF020617.toInt())

        // Custom WebChromeClient to suppress default ugly video posters
        webView.webChromeClient = object : WebChromeClient() {
            override fun getDefaultVideoPoster(): Bitmap {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            }
        }

        val settings: WebSettings = webView.settings
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.javaScriptEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true

        // Register the Native Bridge into JavaScript window.KobinTvNative
        webView.addJavascriptInterface(KobinTvNativeBridge(), "KobinTvNative")
    }

    override fun onResume() {
        super.onResume()
        configureWebView()
    }

    /**
     * Dispatch key events for D-Pad Remote detection in Launcher Mode.
     * Implements Factor 1 Option A: Press and hold D-Pad Center for 3.0 seconds.
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (LauncherStateManager.isLauncherMode(this)) {
            val keyCode = event.keyCode
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                if (event.action == KeyEvent.ACTION_DOWN) {
                    if (event.repeatCount == 0) {
                        centerKeyDownTime = SystemClock.uptimeMillis()
                        isCenterHolding = true
                        mainHandler.postDelayed(centerHoldRunnable, centerHoldThresholdMs)
                    }
                } else if (event.action == KeyEvent.ACTION_UP) {
                    isCenterHolding = false
                    mainHandler.removeCallbacks(centerHoldRunnable)
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    /**
     * Hardware Back button interception:
     * - If in Launcher Mode: Never drops out to desktop.
     *   Implements Option B of Factor 1 (5 rapid back presses in 3s triggers PIN modal).
     * - If in Normal Mode: Standard in-app history back.
     */
    override fun onBackPressed() {
        if (LauncherStateManager.isLauncherMode(this)) {
            val handled = LauncherStateManager.handleLauncherBackPressed(this) {
                triggerPinDialogInWebView()
            }
            if (handled) return
        }

        val webView = bridge?.webView
        if (webView != null) {
            webView.evaluateJavascript(
                "if (typeof window.__handleHardwareBack === 'function') { window.__handleHardwareBack(); } else { window.history.back(); }",
                null
            )
            return
        }

        super.onBackPressed()
    }

    /**
     * Notify Web UI to show the 4-digit PIN Challenge modal.
     */
    private fun triggerPinDialogInWebView() {
        mainScope.launch {
            bridge?.webView?.evaluateJavascript(
                "if (typeof window.__triggerLauncherExitPinDialog === 'function') { window.__triggerLauncherExitPinDialog(); }",
                null
            )
        }
    }

    /**
     * Native Bridge Exposed to JavaScript via window.KobinTvNative
     */
    inner class KobinTvNativeBridge {

        @JavascriptInterface
        fun getVirtualMac(): String {
            return DeviceIdManager.getVirtualMac(this@MainActivity)
        }

        @JavascriptInterface
        fun isAndroidTv(): Boolean {
            return PlatformUtils.isAndroidTv(this@MainActivity)
        }

        @JavascriptInterface
        fun isLauncherMode(): Boolean {
            return LauncherStateManager.isLauncherMode(this@MainActivity)
        }

        @JavascriptInterface
        fun getDeviceDescriptor(): String {
            return PlatformUtils.getDeviceDescriptor(this@MainActivity)
        }

        @JavascriptInterface
        fun activateLauncher(): Boolean {
            return LauncherStateManager.activateLauncherMode(this@MainActivity)
        }

        @JavascriptInterface
        fun verifyPinAndExitLauncher(pin: String): Boolean {
            return LauncherStateManager.verifyPinAndExit(this@MainActivity, pin)
        }

        @JavascriptInterface
        fun getTvAppDockData(): String {
            return TvAppDockManager.getDockDataJson(this@MainActivity)
        }

        @JavascriptInterface
        fun launchApp(packageName: String): Boolean {
            return TvAppDockManager.launchApp(this@MainActivity, packageName)
        }

        @JavascriptInterface
        fun launchWifiSettings(): Boolean {
            return TvAppDockManager.launchWifiSettings(this@MainActivity)
        }

        @JavascriptInterface
        fun runTvOptimizer(tvIp: String, tvPort: Int) {
            mainScope.launch {
                MobileTvOptimizerService.runOptimizationPipeline(
                    this@MainActivity,
                    tvIp,
                    tvPort,
                    object : OptimizerProgressListener {
                        override fun onStepUpdate(step: Int, totalSteps: Int, description: String, isComplete: Boolean, isError: Boolean) {
                            mainScope.launch {
                                val json = JSONObject().apply {
                                    put("step", step)
                                    put("totalSteps", totalSteps)
                                    put("description", description)
                                    put("isComplete", isComplete)
                                    put("isError", isError)
                                }
                                bridge?.webView?.evaluateJavascript(
                                    "if (typeof window.__onKobinOptimizerProgress === 'function') { window.__onKobinOptimizerProgress($json); }",
                                    null
                                )
                            }
                        }
                    }
                )
            }
        }

        @JavascriptInterface
        fun restoreTvDefault(tvIp: String, tvPort: Int) {
            mainScope.launch {
                MobileTvOptimizerService.runRestorePipeline(
                    tvIp,
                    tvPort,
                    object : OptimizerProgressListener {
                        override fun onStepUpdate(step: Int, totalSteps: Int, description: String, isComplete: Boolean, isError: Boolean) {
                            mainScope.launch {
                                val json = JSONObject().apply {
                                    put("step", step)
                                    put("totalSteps", totalSteps)
                                    put("description", description)
                                    put("isComplete", isComplete)
                                    put("isError", isError)
                                }
                                bridge?.webView?.evaluateJavascript(
                                    "if (typeof window.__onKobinOptimizerProgress === 'function') { window.__onKobinOptimizerProgress($json); }",
                                    null
                                )
                            }
                        }
                    }
                )
            }
        }
    }
}
