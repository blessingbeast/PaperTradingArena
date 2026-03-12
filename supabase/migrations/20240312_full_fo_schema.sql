-- ==========================================
-- FULL F&O ORDER SCHEMA MIGRATION
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add all F&O columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lot_size     INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lots         INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity     INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS execution_price NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS option_type  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS strike_price NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expiry_date  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS underlying   TEXT;

-- 2. Populate quantity for existing rows that have qty but not quantity
UPDATE orders SET quantity = qty WHERE quantity IS NULL AND qty IS NOT NULL;

-- 3. Populate lot_size = 1 for equity orders
UPDATE orders SET lot_size = 1 WHERE lot_size IS NULL AND instrument_type = 'STOCK';

-- 4. Parse option_type and strike_price from symbol for existing OPTION orders
-- (These will be populated on new orders going forward via the API)
-- You can manually run targeted UPDATEs if needed for existing records.

-- 5. Ensure instrument_type has proper values (normalize casing)
UPDATE orders SET instrument_type = 'STOCK'  WHERE instrument_type IS NULL;
UPDATE orders SET instrument_type = 'OPTION' WHERE instrument_type IN ('option', 'OPTION', 'OPT');
UPDATE orders SET instrument_type = 'FUTURE' WHERE instrument_type IN ('future', 'FUTURE', 'FUT');

-- 6. Ensure status is uppercase EXECUTED for all paper trades
UPDATE orders SET status = 'EXECUTED' WHERE status IN ('executed', 'filled', 'FILLED', 'pending', 'PENDING');

-- 7. Admin panel tables (if not already created)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
UPDATE public.users SET role = 'admin' WHERE email = 'ashu.bisht.31105@gmail.com';

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id   UUID REFERENCES public.users(id),
    action     TEXT NOT NULL,
    target     TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO public.system_settings (key, value)
VALUES ('market_open', 'true'), ('simulation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
