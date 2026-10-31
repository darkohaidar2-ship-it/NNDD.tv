package com.nnddtv.app

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.os.SystemClock
import android.util.Log

/**
 * KOBIN.tv State-Driven TV Launcher Manager
 * Manages atomic transitions between Normal App Mode and TV Home Launcher Mode.
 * Implements strict Two-Factor Exit (Gesture + 4-Digit PIN) and safe stock home restoration.
 */
object LauncherStateManager {

    private const val TAG = "KOBIN_LAUNCHER"
    private const val PREFS_NAME = "kobin_launcher_prefs"
    private const val PREF_IS_LAUNCHER_MODE = "PREF_IS_LAUNCHER_MODE"
    private const val PREF_CUSTOM_PIN = "PREF_CUSTOM_PIN"
    private const val DEFAULT_PIN = "0000"

    // Back key burst detection: 5 presses within 3000ms
    private const val BACK_BURST_REQUIRED_COUNT = 5
    private const val BACK_BURST_WINDOW_MS = 3000L

    private var backPressCount = 0
    private var firstBackPressTime = 0L

    /**
     * Check if KOBIN.tv is currently set to Launcher Mode.
     */
    @JvmStatic
    fun isLauncherMode(context: Context): Boolean {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(PREF_IS_LAUNCHER_MODE, false)
    }

    /**
     * Get the active 4-digit PIN for exiting launcher mode.
     */
    @JvmStatic
    fun getExitPin(context: Context): String {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(PREF_CUSTOM_PIN, DEFAULT_PIN) ?: DEFAULT_PIN
    }

    /**
     * Set a custom 4-digit PIN.
     */
    @JvmStatic
    fun setExitPin(context: Context, pin: String): Boolean {
        if (pin.length != 4 || !pin.all { it.isDigit() }) return false
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(PREF_CUSTOM_PIN, pin)
            .apply()
        return true
    }

    /**
     * STATE 2 ACTIVATION: Switch to Active TV Launcher Mode.
     * Enables .TvLauncherAlias and prompts the OS to set KOBIN.tv as default Home launcher.
     */
    @JvmStatic
    fun activateLauncherMode(activity: Activity): Boolean {
        return try {
            val context = activity.applicationContext
            val aliasComponent = ComponentName(context, "com.nnddtv.app.TvLauncherAlias")

            // 1. Persist state
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_IS_LAUNCHER_MODE, true)
                .commit()

            // 2. Enable .TvLauncherAlias component without killing current app process
            context.packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            Log.i(TAG, "KOBIN.tv Launcher Mode ACTIVATED. Alias enabled.")

            // 3. Prompt Android OS to show Home selector or bind KOBIN.tv as Home
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(homeIntent)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to activate Launcher Mode", e)
            false
        }
    }

    /**
     * Verify 4-digit PIN and execute atomic exit back to Normal App Mode.
     * Returns true if PIN is correct and exit succeeded.
     */
    @JvmStatic
    fun verifyPinAndExit(activity: Activity, enteredPin: String): Boolean {
        val currentPin = getExitPin(activity)
        if (enteredPin != currentPin) {
            Log.w(TAG, "PIN verification failed: entered $enteredPin, expected $currentPin")
            return false
        }

        return deactivateLauncherMode(activity, exitToStockHome = true)
    }

    /**
     * STATE 1 RESTORATION: Atomically disable .TvLauncherAlias and return to stock TV Home.
     */
    @JvmStatic
    fun deactivateLauncherMode(activity: Activity, exitToStockHome: Boolean = true): Boolean {
        return try {
            val context = activity.applicationContext
            val aliasComponent = ComponentName(context, "com.nnddtv.app.TvLauncherAlias")

            // 1. Persist state synchronously
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_IS_LAUNCHER_MODE, false)
                .commit()

            // 2. Disable .TvLauncherAlias component without killing the app
            context.packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )

            Log.i(TAG, "KOBIN.tv Launcher Mode DEACTIVATED. Alias disabled.")

            // 3. Safely launch the stock TV home launcher
            if (exitToStockHome) {
                launchStockTvHome(activity)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to deactivate Launcher Mode", e)
            false
        }
    }

    /**
     * Resolve and explicitly launch the original stock TV home launcher (e.g. Google TV, Android TV Leanback).
     */
    @JvmStatic
    fun launchStockTvHome(context: Context) {
        try {
            val pm = context.packageManager
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
            }

            val resolveList: List<ResolveInfo> = pm.queryIntentActivities(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
            var targetHome: ResolveInfo? = null

            for (info in resolveList) {
                val pkg = info.activityInfo.packageName
                if (pkg != context.packageName && pkg != "com.kobin.tv") {
                    targetHome = info
                    break
                }
            }

            if (targetHome != null) {
                val explicitIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    component = ComponentName(targetHome.activityInfo.packageName, targetHome.activityInfo.name)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                context.startActivity(explicitIntent)
                Log.i(TAG, "Launched stock TV home launcher: ${targetHome.activityInfo.packageName}")
            } else {
                // Fallback generic HOME intent
                val fallbackIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                context.startActivity(fallbackIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error launching stock TV home", e)
        }
    }

    /**
     * Intercept hardware back button press in Launcher Mode.
     * Implements Option B of Factor 1 (5 back presses in 3 seconds triggers 2FA challenge).
     *
     * @return true if the back press was consumed (never drops out to desktop)
     *         triggerPinDialog will be called when burst is achieved.
     */
    @JvmStatic
    fun handleLauncherBackPressed(
        context: Context,
        onTriggerPinChallenge: () -> Unit
    ): Boolean {
        if (!isLauncherMode(context)) {
            return false // Let system handle back
        }

        val now = SystemClock.uptimeMillis()
        if (now - firstBackPressTime > BACK_BURST_WINDOW_MS) {
            firstBackPressTime = now
            backPressCount = 1
        } else {
            backPressCount++
            if (backPressCount >= BACK_BURST_REQUIRED_COUNT) {
                backPressCount = 0
                firstBackPressTime = 0L
                onTriggerPinChallenge()
            }
        }

        return true // Always consume in Launcher Mode
    }
}
