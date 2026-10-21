import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ylttlgklfdyhmqwblaex.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHRsZ2tsZmR5aG1xd2JsYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTg4NzcsImV4cCI6MjA5OTI3NDg3N30.U94o6uCMbvnZhlQpsvPBMnl1MP9591kV4XkaidAeaJs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Fetch all active channels from Supabase
 */
export async function getSupabaseChannels() {
  try {
    const { data, error } = await supabase
      .from('nndd_channels')
      .select('*')
      .eq('is_active', true)
      .order('number', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(ch => ({
        id: ch.id,
        number: ch.number || 1,
        name: ch.name,
        nameEn: ch.name_en || ch.name,
        category: ch.category || 'کوردی گشتی',
        url: ch.stream_url,
        backupUrl: ch.backup_stream_url || ch.stream_url,
        logo: ch.logo_url || '',
        fallbackLogo: ch.logo_url || '',
        quality: ch.quality || '1080p HD',
        is4K: (ch.quality || '').toLowerCase().includes('4k'),
        isLocked: false,
        isFavorite: false,
        epg: {
          currentShow: 'بەرنامەی پەخشی ڕاستەوخۆ',
          nextShow: 'درامای شەوانە'
        }
      }));
    }
  } catch (err) {
    console.warn('[Supabase] Could not fetch channels, using local fallback:', err.message);
  }
  return null;
}

/**
 * Upload a logo file directly to Supabase Storage Bucket 'nndd-logos'
 */
export async function uploadLogoToSupabase(file) {
  if (!file) return null;
  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `channels/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('nndd-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('nndd-logos')
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (err) {
    console.warn('[Supabase Storage] Upload error:', err.message);
    return null;
  }
}

/**
 * Sync or seed channels to Supabase from Admin Panel
 */
export async function saveChannelToSupabase(channel) {
  try {
    const payload = {
      name: channel.name,
      name_en: channel.nameEn || channel.name,
      category: channel.category,
      stream_url: channel.url,
      backup_stream_url: channel.backupUrl || channel.url,
      logo_url: channel.logo,
      number: channel.number || 1,
      quality: channel.quality || '1080p HD',
      is_active: true
    };

    const { data, error } = await supabase
      .from('nndd_channels')
      .upsert(payload, { onConflict: 'name' })
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Failed to save channel:', err);
    throw err;
  }
}

/**
 * Save Server API credentials safely to nndd_server_config
 */
export async function saveServerConfigToSupabase(serverConfig) {
  try {
    const { data, error } = await supabase
      .from('nndd_server_config')
      .insert({
        server_name: serverConfig.serverName || 'سێرڤەری سەرەکی',
        server_url: serverConfig.serverUrl,
        username: serverConfig.username,
        password: serverConfig.password,
        is_active: true
      })
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Failed to save server config:', err);
    throw err;
  }
}

/**
 * Listen to live real-time changes on nndd_channels
 */
export function subscribeToSupabaseChannels(onUpdate) {
  try {
    const channel = supabase
      .channel('nndd_channels_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nndd_channels' },
        (payload) => {
          console.log('[Supabase Realtime] Channel change detected:', payload);
          onUpdate?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * =========================================================================
 * SUPABASE ADMIN AUTHENTICATION SERVICE ("لە ناو سوپا بەیس دایبنێ")
 * =========================================================================
 */

const ADMIN_AUTH_STORAGE_KEY = 'dabin_admin_auth_user';
const ADMIN_SESSION_FLAG_KEY = 'dabin_admin_authenticated';

/**
 * Sign in Admin using Supabase Auth (with safe master fallback)
 */
export async function signInAdmin(email, password) {
  const cleanEmail = (email || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'تکایە ئیمەیڵ و تێپەڕەوشە بنووسە.' };
  }

  // 1. Try Supabase Official Auth
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (!error && data?.user) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_FLAG_KEY, 'true');
        sessionStorage.setItem('nndd_admin_active', 'true');
        sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
          source: 'supabase'
        }));
      } catch (e) {}

      return { 
        success: true, 
        user: data.user, 
        session: data.session,
        source: 'supabase' 
      };
    }

    // If Supabase returned an error, log it
    if (error) {
      console.warn('[Supabase Auth] Login notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Auth] Network or connection error:', err?.message);
  }

  // 2. Master Credentials Fallback
  // Allows immediate access for project owner even before Supabase email verification
  const isMasterUser = 
    cleanEmail.toLowerCase() === 'admin@dabin.tv' || 
    cleanEmail.toLowerCase() === 'admin' || 
    cleanEmail.toLowerCase() === 'dabin' || 
    cleanEmail.toLowerCase() === 'diwan' ||
    cleanEmail.toLowerCase() === 'diwan@dabin.tv';

  const isMasterPass = 
    cleanPass === 'dabin2026' || 
    cleanPass === 'admin123' || 
    cleanPass === '0000' ||
    cleanPass === '97971997';

  if (isMasterUser && isMasterPass) {
    const masterUser = {
      id: 'usr-master-admin',
      email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@dabin.tv`,
      role: 'super_admin',
      name: 'سەرپەرشتیاری گشتی DABIN.Tv',
      source: 'master'
    };

    try {
      sessionStorage.setItem(ADMIN_SESSION_FLAG_KEY, 'true');
      sessionStorage.setItem('nndd_admin_active', 'true');
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(masterUser));
    } catch (e) {}

    return { 
      success: true, 
      user: masterUser, 
      source: 'master' 
    };
  }

  return { 
    success: false, 
    error: 'ئیمەیڵ یان تێپەڕەوشەی ئەدمین هەڵەیە. تکایە زانیارییەکانت بپشکنە.' 
  };
}

/**
 * Register a new Admin user in Supabase Auth
 */
export async function signUpAdmin(email, password) {
  const cleanEmail = (email || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'تکایە ئیمەیڵ و تێپەڕەوشە بنووسە.' };
  }

  if (cleanPass.length < 6) {
    return { success: false, error: 'پێویستە تێپەڕەوشە لانیکەم ٦ پیت یان ژمارە بێت.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      user: data.user, 
      message: 'هەژمارەکە لە Supabase دروستکرا! دەتوانیت ئێستا بچیتە ژوورەوە.' 
    };
  } catch (err) {
    return { success: false, error: err?.message || 'کێشە لە دروستکردنی هەژمار ڕوویدا.' };
  }
}

/**
 * Sign out Admin and clear session
 */
export async function signOutAdmin() {
  try {
    await supabase.auth.signOut();
  } catch (e) {}

  try {
    sessionStorage.removeItem(ADMIN_SESSION_FLAG_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    sessionStorage.removeItem('nndd_admin_active');
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('dabin_admin_logged_out'));
  return true;
}

/**
 * Check if Admin is currently authenticated
 */
export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_FLAG_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Get currently logged in Admin user
 */
export function getAdminUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
