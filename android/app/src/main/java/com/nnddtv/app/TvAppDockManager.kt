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

        // 1. YouTube for TV / Mobile / Tablet
        val ytPackages = listOf(
            "com.google.android.youtube",
            "com.google.android.youtube.tv",
            "com.google.android.youtube.tvmusic",
            "com.google.android.youtube.googletv"
        )
        var ytItem: TvAppItem? = null
        for (pkg in ytPackages) {
            ytItem = resolveInstalledApp(pm, pkg, "YouTube", "video")
            if (ytItem != null) break
        }
        if (ytItem == null) {
            ytItem = TvAppItem(
                id = "app_youtube",
                title = "YouTube",
                packageName = "com.google.android.youtube",
                isPinned = true,
                iconBase64 = "",
                category = "video"
            )
        }
        list.add(ytItem.copy(isPinned = true))

        // 2. Google Play Store
        var playStore = resolveInstalledApp(pm, "com.android.vending", "Play Store", "store")
        if (playStore == null) {
            playStore = TvAppItem(
                id = "app_playstore",
                title = "Play Store",
                packageName = "com.android.vending",
                isPinned = true,
                iconBase64 = "",
                category = "store"
            )
        }
        list.add(playStore.copy(isPinned = true))

        // 3. Web Browser
        val browserPackages = listOf(
            "com.android.chrome",
            "com.sec.android.app.sbrowser",
            "org.mozilla.firefox",
            "com.opera.browser",
            "com.tv.browser",
            "org.mozilla.tv.firefox"
        )
        var browserItem: TvAppItem? = null
        for (pkg in browserPackages) {
            browserItem = resolveInstalledApp(pm, pkg, "Browser", "browser")
            if (browserItem != null) break
        }
        if (browserItem == null) {
            browserItem = TvAppItem(
                id = "app_browser",
                title = "Browser",
                packageName = "com.android.chrome",
                isPinned = true,
                iconBase64 = "",
                category = "browser"
            )
        }
        list.add(browserItem.copy(isPinned = true))

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
            val lower = packageName.lowercase()
            if (lower == "com.android.tv.settings" || lower.contains("settings") || lower == "wifi") {
                return launchWifiSettings(context)
            }

            val pm = context.packageManager
            val candidates = mutableListOf<String>()
            candidates.add(packageName)

            if (lower.contains("youtube") || lower == "yt") {
                candidates.add("com.google.android.youtube")
                candidates.add("com.google.android.youtube.tv")
                candidates.add("com.google.android.youtube.tvmusic")
                candidates.add("com.google.android.youtube.googletv")
            } else if (lower.contains("chrome") || lower.contains("browser")) {
                candidates.add("com.android.chrome")
                candidates.add("com.sec.android.app.sbrowser")
                candidates.add("org.mozilla.firefox")
                candidates.add("com.opera.browser")
            } else if (lower.contains("vending") || lower.contains("store") || lower == "playstore") {
                candidates.add("com.android.vending")
            }

            for (pkg in candidates) {
                var launchIntent = pm.getLeanbackLaunchIntentForPackage(pkg)
                if (launchIntent == null) {
                    launchIntent = pm.getLaunchIntentForPackage(pkg)
                }
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
                    context.startActivity(launchIntent)
                    return true
                }
            }

            // Universal web and market fallbacks so it never fails on tablets/phones:
            if (lower.contains("youtube") || lower == "yt") {
                val ytWebIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(ytWebIntent)
                return true
            }

            if (lower.contains("browser") || lower.contains("chrome")) {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(browserIntent)
                return true
            }

            if (lower.contains("vending") || lower.contains("store") || lower == "playstore") {
                val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(marketIntent)
                return true
            }

            Log.w(TAG, "No launch intent or fallback found for $packageName")
            false
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
