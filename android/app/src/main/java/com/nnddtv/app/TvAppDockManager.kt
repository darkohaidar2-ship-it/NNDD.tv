package com.nnddtv.app

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.provider.Settings
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/**
 * TV App representation for the D-Pad focusable App Dock.
 */
data class TvAppItem(
    val id: String,
    val title: String,
    val packageName: String,
    val isPinned: Boolean = false,
    val iconBase64: String = "",
    val category: String = "app" // "video", "store", "browser", "settings", "app"
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("title", title)
            put("packageName", packageName)
            put("isPinned", isPinned)
            put("iconBase64", iconBase64)
            put("category", category)
        }
    }
}

/**
 * KOBIN.tv Integrated TV App Dock Manager
 * Resolves official Leanback banners and launcher shortcuts for:
 * YouTube TV, Google Play Store, Web Browser, Wi-Fi Settings, and all installed TV apps.
 */
object TvAppDockManager {

    private const val TAG = "KOBIN_APP_DOCK"

    /**
     * Resolve priority pinned TV shortcuts.
     */
    @JvmStatic
    fun getPinnedShortcuts(context: Context): List<TvAppItem> {
        val list = mutableListOf<TvAppItem>()
        val pm = context.packageManager

        // 1. YouTube for TV
        val ytPackages = listOf(
            "com.google.android.youtube.tv",
            "com.google.android.youtube.tvmusic",
            "com.google.android.youtube"
        )
        for (pkg in ytPackages) {
            val item = resolveInstalledApp(pm, pkg, "YouTube", "video")
            if (item != null) {
                list.add(item.copy(isPinned = true))
                break
            }
        }

        // 2. Google Play Store
        val playStore = resolveInstalledApp(pm, "com.android.vending", "Play Store", "store")
        if (playStore != null) {
            list.add(playStore.copy(isPinned = true))
        }

        // 3. Web Browser
        val browserPackages = listOf("com.android.chrome", "com.tv.browser", "org.mozilla.tv.firefox")
        var browserItem: TvAppItem? = null
        for (pkg in browserPackages) {
            browserItem = resolveInstalledApp(pm, pkg, "Browser", "browser")
            if (browserItem != null) break
        }
        if (browserItem == null) {
            // Resolve default browser intent
            try {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com"))
                val resolveInfo = pm.resolveActivity(browserIntent, PackageManager.MATCH_DEFAULT_ONLY)
                if (resolveInfo != null) {
                    val pkg = resolveInfo.activityInfo.packageName
                    val title = resolveInfo.loadLabel(pm).toString()
                    val icon = drawableToBase64(resolveInfo.loadIcon(pm))
                    browserItem = TvAppItem(
                        id = "app_browser",
                        title = title.ifEmpty { "Browser" },
                        packageName = pkg,
                        isPinned = true,
                        iconBase64 = icon,
                        category = "browser"
                    )
                }
            } catch (e: Exception) {}
        }
        browserItem?.let { list.add(it.copy(isPinned = true)) }

        // 4. Wi-Fi / TV Network Settings shortcut
        list.add(
            TvAppItem(
                id = "shortcut_wifi",
                title = "Wi-Fi Settings",
                packageName = "com.android.tv.settings",
                isPinned = true,
                iconBase64 = "",
                category = "settings"
            )
        )

        return list
    }

    /**
     * Query all installed apps on Android TV with LEANBACK_LAUNCHER or LAUNCHER categories.
     * Excludes KOBIN.tv itself.
     */
    @JvmStatic
    fun getAllInstalledTvApps(context: Context): List<TvAppItem> {
        val list = mutableListOf<TvAppItem>()
        val pm = context.packageManager
        val selfPkg = context.packageName

        val seenPackages = HashSet<String>()
        seenPackages.add(selfPkg)
        seenPackages.add("com.kobin.tv")

        // 1. First query Leanback TV apps
        val leanbackIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
        }
        val leanbackApps = pm.queryIntentActivities(leanbackIntent, 0)
        for (ri in leanbackApps) {
            val pkg = ri.activityInfo.packageName
            if (seenPackages.add(pkg)) {
                val title = ri.loadLabel(pm).toString()
                // Prefer banner for TV, fallback to icon
                val drawable = ri.activityInfo.loadBanner(pm) ?: ri.loadIcon(pm)
                val iconBase64 = drawableToBase64(drawable)
                list.add(
                    TvAppItem(
                        id = "app_$pkg",
                        title = title,
                        packageName = pkg,
                        isPinned = false,
                        iconBase64 = iconBase64,
                        category = "app"
                    )
                )
            }
        }

        // 2. Also query standard launcher apps for compatibility
        val standardIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val standardApps = pm.queryIntentActivities(standardIntent, 0)
        for (ri in standardApps) {
            val pkg = ri.activityInfo.packageName
            if (seenPackages.add(pkg)) {
                val title = ri.loadLabel(pm).toString()
                val iconBase64 = drawableToBase64(ri.loadIcon(pm))
                list.add(
                    TvAppItem(
                        id = "app_$pkg",
                        title = title,
                        packageName = pkg,
                        isPinned = false,
                        iconBase64 = iconBase64,
                        category = "app"
                    )
                )
            }
        }

        return list.sortedBy { it.title.lowercase() }
    }

    /**
     * Launch an installed app by package name.
     */
    @JvmStatic
    fun launchApp(context: Context, packageName: String): Boolean {
        return try {
            if (packageName == "com.android.tv.settings" || packageName.contains("settings")) {
                return launchWifiSettings(context)
            }

            val pm = context.packageManager
            // 1. Try Leanback TV launch intent
            var launchIntent = pm.getLeanbackLaunchIntentForPackage(packageName)
            // 2. Fallback to standard launch intent
            if (launchIntent == null) {
                launchIntent = pm.getLaunchIntentForPackage(packageName)
            }

            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                true
            } else {
                Log.w(TAG, "No launch intent found for $packageName")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch $packageName", e)
            false
        }
    }

    /**
     * Directly launch TV Wi-Fi / Network Settings so user can change connections.
     */
    @JvmStatic
    fun launchWifiSettings(context: Context): Boolean {
        return try {
            val wifiIntent = Intent(Settings.ACTION_WIFI_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(wifiIntent)
            true
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallbackIntent)
                true
            } catch (e2: Exception) {
                Log.e(TAG, "Failed to open settings", e2)
                false
            }
        }
    }

    /**
     * Helper to resolve an app by package name.
     */
    private fun resolveInstalledApp(
        pm: PackageManager,
        packageName: String,
        fallbackTitle: String,
        category: String
    ): TvAppItem? {
        return try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val title = pm.getApplicationLabel(appInfo).toString()
            val drawable = pm.getApplicationBanner(appInfo) ?: pm.getApplicationIcon(appInfo)
            TvAppItem(
                id = "app_$packageName",
                title = title.ifEmpty { fallbackTitle },
                packageName = packageName,
                isPinned = true,
                iconBase64 = drawableToBase64(drawable),
                category = category
            )
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
    }

    /**
     * Convert Android Drawable to a small Base64 PNG data URL string.
     */
    private fun drawableToBase64(drawable: Drawable?): String {
        if (drawable == null) return ""
        return try {
            val width = if (drawable.intrinsicWidth > 0) minOf(drawable.intrinsicWidth, 128) else 96
            val height = if (drawable.intrinsicHeight > 0) minOf(drawable.intrinsicHeight, 128) else 96

            val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
                Bitmap.createScaledBitmap(drawable.bitmap, width, height, true)
            } else {
                val b = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(b)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                b
            }

            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
            val bytes = stream.toByteArray()
            "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            ""
        }
    }

    /**
     * JSON helper for WebView Bridge.
     */
    @JvmStatic
    fun getDockDataJson(context: Context): String {
        val root = JSONObject()
        val pinnedArray = JSONArray()
        getPinnedShortcuts(context).forEach { pinnedArray.put(it.toJson()) }

        val allArray = JSONArray()
        getAllInstalledTvApps(context).forEach { allArray.put(it.toJson()) }

        root.put("pinned", pinnedArray)
        root.put("all", allArray)
        return root.toString()
    }
}
