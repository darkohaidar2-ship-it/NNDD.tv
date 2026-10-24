-- =========================================================================
-- DABIN.TV - REAL-TIME DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Table: devices
-- Purpose: Real-Time MAC Address & Device Key Authentication, 
--          Smart Credit-Saving Lifecycle, and Upstream LionOTT Line Binding
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing table if recreating (uncomment if clean migration needed)
-- DROP TABLE IF EXISTS public.devices CASCADE;

-- 3. Create devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mac_address TEXT NOT NULL UNIQUE,
    device_key TEXT NOT NULL,
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    server_url TEXT DEFAULT 'http://line.liondnscloud.ru:80',
    xtream_user TEXT DEFAULT '',
    xtream_pass TEXT DEFAULT '',
    app_expiry_date TIMESTAMPTZ,
    panel_expiry_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'needs_panel_renewal', 'banned', 'expired')),
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_devices_mac ON public.devices (mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices (status);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON public.devices (last_active);
CREATE INDEX IF NOT EXISTS idx_devices_xtream_user ON public.devices (xtream_user);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_devices_updated_at ON public.devices;
CREATE TRIGGER trigger_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Realtime Pub/Sub for Instant Synchronization
ALTER TABLE public.devices REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'devices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
    END IF;
END $$;

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read & write for IPTV player middleware & admin panel
DROP POLICY IF EXISTS "Public read devices" ON public.devices;
CREATE POLICY "Public read devices" ON public.devices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert devices" ON public.devices;
CREATE POLICY "Public insert devices" ON public.devices
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update devices" ON public.devices;
CREATE POLICY "Public update devices" ON public.devices
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete devices" ON public.devices;
CREATE POLICY "Public delete devices" ON public.devices
    FOR DELETE USING (true);

-- 8. Seed Default Test Device (Using the provided LionOTT test credentials)
INSERT INTO public.devices (
    mac_address,
    device_key,
    customer_name,
    customer_phone,
    server_url,
    xtream_user,
    xtream_pass,
    app_expiry_date,
    panel_expiry_date,
    status,
    is_online,
    last_active
) VALUES (
    'DA:B1:24:97:88:12',
    '7788',
    'تێستەری سەرەکی DABIN.tv',
    '+9647701234567',
    'http://line.liondnscloud.ru:80',
    '292c8215',
    'adef5d6e',
    NOW() + INTERVAL '365 days',
    NOW() + INTERVAL '30 days',
    'active',
    true,
    NOW()
) ON CONFLICT (mac_address) DO UPDATE SET
    xtream_user = EXCLUDED.xtream_user,
    xtream_pass = EXCLUDED.xtream_pass,
    server_url = EXCLUDED.server_url,
    app_expiry_date = EXCLUDED.app_expiry_date,
    panel_expiry_date = EXCLUDED.panel_expiry_date,
    status = EXCLUDED.status;
