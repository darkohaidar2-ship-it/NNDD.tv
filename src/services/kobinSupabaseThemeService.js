/**
 * KOBIN TV - Supabase Realtime Theme & 4K Background Cloud Sync Service
 * Connects the Dashboard 4K Background (Video, Image, Color) directly with Supabase.
 * 
 * Features:
 * 1. Real-time Cloud Sync: Any change made in Admin Panel or App reflects on all connected TVs & Tablets.
 * 2. Supabase Pub/Sub Channel: Listens for Postgres changes on 'kobin_settings'.
 * 3. Graceful Multi-Layer Fallback: Works offline / via BroadcastChannel / localStorage if table not yet created.
 * 4. Diagnostics & 1-Click SQL Script: Easily copy schema to run in Supabase SQL editor.
 */

import { supabase } from '../data/supabaseClient';
import { getSavedThemeConfig, saveThemeConfig } from './kobinThemeService';

const TABLE_NAME = 'kobin_settings';
const THEME_KEY = 'theme_config';

export const SQL_SCHEMA_SNIPPET = `-- KOBIN TV - Theme & 4K Background Table for Supabase
CREATE TABLE IF NOT EXISTS public.kobin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kobin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all kobin_settings" ON public.kobin_settings;
CREATE POLICY "Public all kobin_settings" ON public.kobin_settings 
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.kobin_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'kobin_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kobin_settings;
    END IF;
END $$;`;

// Cache Supabase status: 'connected' | 'table_missing' | 'error' | 'checking'
let supabaseThemeStatus = 'checking';
let lastKnownTheme = null;

/**
 * Check if the Supabase table 'kobin_settings' exists and is accessible
 */
export async function checkSupabaseThemeStatus() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('key', THEME_KEY)
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('not find the table') || error.message?.includes('schema cache')) {
        supabaseThemeStatus = 'table_missing';
        return { status: 'table_missing', message: 'خشتەی kobin_settings لە سوپابەیس بوونی نییە' };
      }
      if (error.code === '42501' || error.message?.includes('violates row-level security')) {
        supabaseThemeStatus = 'rls_blocked';
        return { status: 'rls_blocked', message: 'مۆڵەتی RLS پێویستی بە ئەپدەیت هەیە' };
      }
      supabaseThemeStatus = 'error';
      return { status: 'error', message: error.message };
    }

    supabaseThemeStatus = 'connected';
    return { status: 'connected', data: data?.[0]?.value || null };
  } catch (err) {
    supabaseThemeStatus = 'error';
    return { status: 'error', message: err?.message || 'پەیوەندی لەگەڵ سوپابەیس سەرکەوتوو نەبوو' };
  }
}

/**
 * Fetch theme and background settings from Supabase
 */
export async function fetchThemeFromSupabase() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value, updated_at')
      .eq('key', THEME_KEY)
      .single();

    if (error) {
      return null;
    }

    if (data?.value) {
      lastKnownTheme = data.value;
      // Sync into local theme config
      saveThemeConfig(data.value, false);
      return data.value;
    }
  } catch (err) {
    console.warn('[kobinSupabaseTheme] Fetch notice:', err?.message);
  }
  return null;
}

/**
 * Save theme and background settings to Supabase
 */
export async function saveThemeToSupabase(themeConfig) {
  // 1. Immediately save to local engine and broadcast so UI feels 0ms instant
  saveThemeConfig(themeConfig, true);
  lastKnownTheme = themeConfig;

  // 2. Push to Supabase Cloud
  try {
    const payload = {
      key: THEME_KEY,
      value: themeConfig,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'key' })
      .select();

    if (error) {
      console.warn('[kobinSupabaseTheme] Cloud save warning:', error.message);
      return {
        success: true, // Saved locally
        isSupabase: false,
        status: error.code === '42P01' ? 'table_missing' : 'error',
        message: 'لە ناوخۆدا پاشەکەوت کرا (سوپابەیس پێویستی بە جێبەجێکردنی SQL هەیە)'
      };
    }

    supabaseThemeStatus = 'connected';
    return {
      success: true,
      isSupabase: true,
      status: 'connected',
      message: 'بە سەرکەوتوویی لە Supabase پاشەکەوت کرا و لەسەر هەموو ئامێرەکان سەپێندرا ✨'
    };
  } catch (err) {
    return {
      success: true,
      isSupabase: false,
      status: 'error',
      message: 'لە ناوخۆدا پاشەکەوت کرا'
    };
  }
}

/**
 * Subscribe to real-time changes on Supabase 'kobin_settings'
 */
export function subscribeToSupabaseThemeChanges(onUpdate) {
  let channel = null;
  try {
    channel = supabase
      .channel('kobin_theme_realtime_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE_NAME,
          filter: `key=eq.${THEME_KEY}`
        },
        (payload) => {
          const newTheme = payload?.new?.value;
          if (newTheme) {
            console.log('[kobinSupabaseTheme] Realtime update received from Supabase:', newTheme);
            lastKnownTheme = newTheme;
            saveThemeConfig(newTheme, false);
            onUpdate?.(newTheme);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          supabaseThemeStatus = 'connected';
        }
      });
  } catch (err) {
    console.warn('[kobinSupabaseTheme] Realtime subscription error:', err?.message);
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    }
  };
}

/**
 * Get current cached Supabase status
 */
export function getSupabaseThemeStatus() {
  return supabaseThemeStatus;
}
