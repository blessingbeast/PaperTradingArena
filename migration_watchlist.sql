-- Add list_name column to watchlists table to support multiple watchlist groups
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS list_name TEXT DEFAULT 'Watchlist 1';
