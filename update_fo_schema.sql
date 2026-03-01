
-- Update fo_positions to support lots and units
ALTER TABLE public.fo_positions 
ADD COLUMN IF NOT EXISTS qty_lots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qty_units INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1;

-- Update orders to support lots and units
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS qty_lots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS asset_class TEXT;

-- Update trades to support lots and units
-- Wait, check if 'trades' exists. In database.sql it's there.
-- Let's check journals too if needed.
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS qty_lots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1;
