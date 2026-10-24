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

-- 8. Optional Seed Device (Commented out for 100% clean & fresh device list)
-- INSERT INTO public.devices (
--     mac_address,
--     device_key,
--     customer_name,
--     customer_phone,
--     server_url,
--     xtream_user,
--     xtream_pass,
--     app_expiry_date,
--     panel_expiry_date,
--     status,
--     is_online,
--     last_active
-- ) VALUES (
--     'DA:B1:24:97:88:12',
--     '7788',
--     'تێستەری سەرەکی DABIN.tv',
--     '+9647701234567',
--     'http://line.liondnscloud.ru:80',
--     '292c8215',
--     'adef5d6e',
--     NOW() + INTERVAL '365 days',
--     NOW() + INTERVAL '30 days',
--     'active',
--     true,
--     NOW()
-- ) ON CONFLICT (mac_address) DO NOTHING;


-- =========================================================================
-- TABLE 2: category_overrides
-- Purpose: Admin overrides for upstream LionOTT categories (Show/Hide, Custom Name, Sort Order)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.category_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_type TEXT NOT NULL DEFAULT 'live' CHECK (category_type IN ('live', 'movie', 'series')),
    upstream_category_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    custom_name TEXT DEFAULT '',
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (category_type, upstream_category_id)
);

CREATE INDEX IF NOT EXISTS idx_cat_overrides_type ON public.category_overrides (category_type);
CREATE INDEX IF NOT EXISTS idx_cat_overrides_upstream_id ON public.category_overrides (upstream_category_id);
CREATE INDEX IF NOT EXISTS idx_cat_overrides_visible ON public.category_overrides (is_visible);
CREATE INDEX IF NOT EXISTS idx_cat_overrides_sort ON public.category_overrides (sort_order);

DROP TRIGGER IF EXISTS trigger_category_overrides_updated_at ON public.category_overrides;
CREATE TRIGGER trigger_category_overrides_updated_at
    BEFORE UPDATE ON public.category_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.category_overrides REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'category_overrides'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.category_overrides;
    END IF;
END $$;

ALTER TABLE public.category_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read category_overrides" ON public.category_overrides;
CREATE POLICY "Public read category_overrides" ON public.category_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert category_overrides" ON public.category_overrides;
CREATE POLICY "Public insert category_overrides" ON public.category_overrides FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update category_overrides" ON public.category_overrides;
CREATE POLICY "Public update category_overrides" ON public.category_overrides FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete category_overrides" ON public.category_overrides;
CREATE POLICY "Public delete category_overrides" ON public.category_overrides FOR DELETE USING (true);


-- =========================================================================
-- TABLE 3: custom_categories (Virtual Bouquets)
-- Purpose: Custom bouquets created by Admin from scratch with assigned stream_ids
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.custom_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_type TEXT NOT NULL DEFAULT 'live' CHECK (category_type IN ('live', 'movie', 'series')),
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📺',
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 10,
    stream_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_cat_type ON public.custom_categories (category_type);
CREATE INDEX IF NOT EXISTS idx_custom_cat_visible ON public.custom_categories (is_visible);
CREATE INDEX IF NOT EXISTS idx_custom_cat_sort ON public.custom_categories (sort_order);

DROP TRIGGER IF EXISTS trigger_custom_categories_updated_at ON public.custom_categories;
CREATE TRIGGER trigger_custom_categories_updated_at
    BEFORE UPDATE ON public.custom_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.custom_categories REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'custom_categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_categories;
    END IF;
END $$;

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read custom_categories" ON public.custom_categories;
CREATE POLICY "Public read custom_categories" ON public.custom_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert custom_categories" ON public.custom_categories;
CREATE POLICY "Public insert custom_categories" ON public.custom_categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update custom_categories" ON public.custom_categories;
CREATE POLICY "Public update custom_categories" ON public.custom_categories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete custom_categories" ON public.custom_categories;
CREATE POLICY "Public delete custom_categories" ON public.custom_categories FOR DELETE USING (true);


-- =========================================================================
-- TABLE 4: channel_overrides
-- Purpose: Overrides for specific streams (Rename Channel, Custom Logo, Hide Stream)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.channel_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id TEXT NOT NULL UNIQUE,
    original_name TEXT DEFAULT '',
    custom_name TEXT DEFAULT '',
    custom_logo TEXT DEFAULT '',
    is_hidden BOOLEAN DEFAULT false,
    custom_category_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_overrides_stream_id ON public.channel_overrides (stream_id);
CREATE INDEX IF NOT EXISTS idx_channel_overrides_hidden ON public.channel_overrides (is_hidden);

DROP TRIGGER IF EXISTS trigger_channel_overrides_updated_at ON public.channel_overrides;
CREATE TRIGGER trigger_channel_overrides_updated_at
    BEFORE UPDATE ON public.channel_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.channel_overrides REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'channel_overrides'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_overrides;
    END IF;
END $$;

ALTER TABLE public.channel_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read channel_overrides" ON public.channel_overrides;
CREATE POLICY "Public read channel_overrides" ON public.channel_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert channel_overrides" ON public.channel_overrides;
CREATE POLICY "Public insert channel_overrides" ON public.channel_overrides FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update channel_overrides" ON public.channel_overrides;
CREATE POLICY "Public update channel_overrides" ON public.channel_overrides FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete channel_overrides" ON public.channel_overrides;
CREATE POLICY "Public delete channel_overrides" ON public.channel_overrides FOR DELETE USING (true);


-- =========================================================================
-- SEED INITIAL BOUQUET DATA FOR DABIN.TV
-- =========================================================================

-- 1. Pin [KU] KURDISTAN to #1 and rename to 'کەناڵە کوردییەکان'
INSERT INTO public.category_overrides (
    category_type,
    upstream_category_id,
    original_name,
    custom_name,
    is_visible,
    sort_order
) VALUES (
    'live',
    '818',
    '[KU] KURDISTAN',
    'کەناڵە کوردییەکان',
    true,
    1
) ON CONFLICT (category_type, upstream_category_id) DO UPDATE SET
    custom_name = EXCLUDED.custom_name,
    is_visible = EXCLUDED.is_visible,
    sort_order = EXCLUDED.sort_order;

-- 2. Create Initial Custom Bouquet 'DABIN VIP'
INSERT INTO public.custom_categories (
    category_type,
    name,
    icon,
    is_visible,
    sort_order,
    stream_ids
) VALUES (
    'live',
    'DABIN VIP 👑',
    '👑',
    true,
    0,
    '[682184, 673660, 588449, 588446]'::jsonb
) ON CONFLICT DO NOTHING;

