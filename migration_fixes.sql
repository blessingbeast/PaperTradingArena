-- 1. Remove the strict 'EQUITY' or 'F&O' check constraint because we are injecting MIS/CNC
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_instrument_type_check;
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_instrument_type_check;

-- 2. Add missing UPDATE policy for Portfolios so balance actually deducts
DROP POLICY IF EXISTS "Users can update own portfolio" ON public.portfolios;
CREATE POLICY "Users can update own portfolio" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);

-- 3. Add missing INSERT/UPDATE/DELETE policies for Positions
DROP POLICY IF EXISTS "Users can insert own positions" ON public.positions;
DROP POLICY IF EXISTS "Users can update own positions" ON public.positions;
DROP POLICY IF EXISTS "Users can delete own positions" ON public.positions;

CREATE POLICY "Users can insert own positions" ON public.positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.positions FOR DELETE USING (auth.uid() = user_id);
