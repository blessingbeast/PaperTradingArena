-- Drop the old unique constraint that restricted a single symbol per user globally
ALTER TABLE public.watchlists DROP CONSTRAINT IF EXISTS watchlists_user_id_symbol_key;

-- Add a new unique constraint that restricts a singular symbol per user PER group
ALTER TABLE public.watchlists ADD CONSTRAINT watchlists_user_id_symbol_list_name_key UNIQUE (user_id, symbol, list_name);
