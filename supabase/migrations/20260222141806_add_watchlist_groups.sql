-- Create watchlist_groups table
CREATE TABLE public.watchlist_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.watchlist_groups ENABLE ROW LEVEL SECURITY;

-- Policies for watchlist_groups
CREATE POLICY "Users can view own watchlist groups"
    ON public.watchlist_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist groups"
    ON public.watchlist_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist groups"
    ON public.watchlist_groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist groups"
    ON public.watchlist_groups FOR DELETE
    USING (auth.uid() = user_id);

-- Add group_id to watchlists
ALTER TABLE public.watchlists 
ADD COLUMN group_id UUID REFERENCES public.watchlist_groups(id) ON DELETE CASCADE;

-- Update RLS policies for watchlists if necessary
-- Note: existing watchlists RLS might already cover it since user_id is checked.

-- Create a Default group for existing users
-- We can't automatically assign all existing lists to a default group here easily without a PL/pgSQL block, 
-- but we can handle it in the application layer or just leave existing ones as 'null' group.
