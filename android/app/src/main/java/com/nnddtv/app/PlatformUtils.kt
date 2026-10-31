package com.nnddtv.app

import android.app.UiModeManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build

/**
 * KOBIN.tv Hardware and Platform Detection Utility
 * Dynamically distinguishes between Android TV / Google TV boxes
 * and standard Android Mobile Phones/Tablets.
 */
object PlatformUtils {

    /**
     * Returns true if running on Android TV, Google TV, or any device
     * with leanback hardware or TV UI mode.
     */
    @JvmStatic
    fun isAndroidTv(context: Context): Boolean {
        return try {
            val uiModeManager = context.getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
            val isTvUi = uiModeManager?.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION

            val hasLeanback = context.packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
            val hasLiveTv = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                context.packageManager.hasSystemFeature(PackageManager.FEATURE_LIVE_TV)
            } else {
                false
            }

            isTvUi || hasLeanback || hasLiveTv
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Returns true if running on a regular Android Mobile Phone or Tablet.
     */
    @JvmStatic
    fun isMobilePhone(context: Context): Boolean {
        return !isAndroidTv(context)
    }

    /**
     * Human-readable device hardware descriptor.
     */
    @JvmStatic
    fun getDeviceDescriptor(context: Context): String {
        val type = if (isAndroidTv(context)) "Android TV" else "Android Mobile"
        return "$type (${Build.MANUFACTURER} ${Build.MODEL}, Android ${Build.VERSION.RELEASE})"
    }
}
