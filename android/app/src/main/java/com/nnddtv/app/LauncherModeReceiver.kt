package com.nnddtv.app

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log

/**
 * KOBIN.tv Remote ADB State Receiver
 * Listens for ADB / broadcast commands from the Mobile Optimizer tool:
 * am broadcast -a com.kobin.tv.ACTION_SET_LAUNCHER_MODE --ez enable_launcher true -n com.nnddtv.app/.LauncherModeReceiver
 */
class LauncherModeReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "KOBIN_RECEIVER"
        const val ACTION_SET_LAUNCHER_MODE_KOBIN = "com.kobin.tv.ACTION_SET_LAUNCHER_MODE"
        const val ACTION_SET_LAUNCHER_MODE_APP = "com.nnddtv.app.ACTION_SET_LAUNCHER_MODE"
        const val EXTRA_ENABLE_LAUNCHER = "enable_launcher"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != ACTION_SET_LAUNCHER_MODE_KOBIN && action != ACTION_SET_LAUNCHER_MODE_APP) {
            return
        }

        val enableLauncher = intent.getBooleanExtra(EXTRA_ENABLE_LAUNCHER, false)
        Log.i(TAG, "Received ACTION_SET_LAUNCHER_MODE: enable=$enableLauncher")

        val aliasComponent = ComponentName(context, "com.nnddtv.app.TvLauncherAlias")

        if (enableLauncher) {
            // Persist state
            context.getSharedPreferences("kobin_launcher_prefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("PREF_IS_LAUNCHER_MODE", true)
                .commit()

            // Enable alias
            context.packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            // Bring MainActivity to foreground
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            context.startActivity(launchIntent)
            Log.i(TAG, "Launcher mode enabled via broadcast")
        } else {
            // Persist state
            context.getSharedPreferences("kobin_launcher_prefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("PREF_IS_LAUNCHER_MODE", false)
                .commit()

            // Disable alias
            context.packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )

            // Launch stock home
            LauncherStateManager.launchStockTvHome(context)
            Log.i(TAG, "Launcher mode disabled via broadcast")
        }
    }
}
