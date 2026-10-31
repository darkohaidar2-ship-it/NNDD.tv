package com.nnddtv.app

import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings
import java.security.MessageDigest
import java.util.Locale

/**
 * KOBIN.tv Unified Cryptographic Device ID Generator
 * Generates and persists a deterministic, RFC-compliant Virtual MAC address
 * from Settings.Secure.ANDROID_ID using SHA-256.
 *
 * Ensures the TV and mobile clients present the exact same hardware identity
 * across Normal App Mode, TV Launcher Mode, and app restarts.
 */
object DeviceIdManager {

    private const val PREF_NAME = "kobin_device_prefs"
    private const val KEY_UNIFIED_MAC = "KEY_UNIFIED_MAC"
    private const val FALLBACK_ANDROID_ID = "kobin_default_tv_device_id"

    @Volatile
    private var cachedVirtualMac: String? = null

    /**
     * Retrieve the deterministic Virtual MAC address formatted as XX:XX:XX:XX:XX:XX.
     * Guaranteed to return the same MAC on every call.
     */
    @JvmStatic
    fun getVirtualMac(context: Context): String {
        cachedVirtualMac?.let { return it }

        val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val savedMac = prefs.getString(KEY_UNIFIED_MAC, null)
        if (!savedMac.isNullOrEmpty()) {
            cachedVirtualMac = savedMac
            return savedMac
        }

        synchronized(this) {
            val doubleCheck = prefs.getString(KEY_UNIFIED_MAC, null)
            if (!doubleCheck.isNullOrEmpty()) {
                cachedVirtualMac = doubleCheck
                return doubleCheck
            }

            val androidId = getAndroidId(context)
            val generatedMac = generateMacFromAndroidId(androidId)

            prefs.edit().putString(KEY_UNIFIED_MAC, generatedMac).apply()
            cachedVirtualMac = generatedMac
            return generatedMac
        }
    }

    /**
     * Retrieve hardware Settings.Secure.ANDROID_ID or a safe fallback.
     */
    @JvmStatic
    fun getAndroidId(context: Context): String {
        return try {
            val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            if (id.isNullOrBlank() || id == "9774d56d682e549c") {
                FALLBACK_ANDROID_ID
            } else {
                id
            }
        } catch (e: Exception) {
            FALLBACK_ANDROID_ID
        }
    }

    /**
     * Hashes the ANDROID_ID using SHA-256, takes the first 6 bytes,
     * sets the locally administered unicast bit on byte 0,
     * and returns the colon-separated hex string.
     */
    private fun generateMacFromAndroidId(androidId: String): String {
        return try {
            val md = MessageDigest.getInstance("SHA-256")
            val hash = md.digest(androidId.toByteArray(Charsets.UTF_8))

            // Take the first 6 bytes for a 48-bit MAC address
            val macBytes = ByteArray(6)
            System.arraycopy(hash, 0, macBytes, 0, 6)

            // Bit 0 of Byte 0: 0 = Unicast
            // Bit 1 of Byte 0: 1 = Locally Administered
            // macBytes[0] = (macBytes[0] & 0xFE) | 0x02
            val b0 = (macBytes[0].toInt() and 0xFE or 0x02).toByte()
            macBytes[0] = b0

            // Format as XX:XX:XX:XX:XX:XX
            macBytes.joinToString(":") { byte ->
                String.format(Locale.US, "%02X", byte.toInt() and 0xFF)
            }
        } catch (e: Exception) {
            // Safe fallback RFC-compliant locally administered MAC
            "02:4B:4F:42:49:4E" // 02:KO:BI:N
        }
    }

    /**
     * Force clear cache (for testing or profile migration).
     */
    @JvmStatic
    fun clearCache(context: Context) {
        cachedVirtualMac = null
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_UNIFIED_MAC)
            .apply()
    }
}
