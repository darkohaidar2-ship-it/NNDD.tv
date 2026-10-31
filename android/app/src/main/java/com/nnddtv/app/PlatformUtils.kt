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
     * Returns true if running on a regular Android Mobile Phone.
     */
    @JvmStatic
    fun isMobilePhone(context: Context): Boolean {
        return !isAndroidTv(context) && !isTablet(context)
    }

    /**
     * Returns true if running on an Android Tablet (screen width >= 600dp or LARGE layout).
     */
    @JvmStatic
    fun isTablet(context: Context): Boolean {
        return try {
            val config = context.resources.configuration
            val isLarge = (config.screenLayout and Configuration.SCREENLAYOUT_SIZE_MASK) >= Configuration.SCREENLAYOUT_SIZE_LARGE
            val sw = config.smallestScreenWidthDp
            isLarge || sw >= 600
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Returns true if running on either an Android TV or Tablet.
     */
    @JvmStatic
    fun isTabletOrTv(context: Context): Boolean {
        return isAndroidTv(context) || isTablet(context)
    }

    /**
     * Human-readable device hardware descriptor.
     */
    @JvmStatic
    fun getDeviceDescriptor(context: Context): String {
        val type = when {
            isAndroidTv(context) -> "Android TV"
            isTablet(context) -> "Android Tablet"
            else -> "Android Mobile"
        }
        return "$type (${Build.MANUFACTURER} ${Build.MODEL}, Android ${Build.VERSION.RELEASE})"
    }
}
