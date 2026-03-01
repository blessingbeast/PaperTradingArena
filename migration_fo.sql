-- Futures & Options Schema Updates

-- 1. Create Options Contracts Table
CREATE TABLE IF NOT EXISTS public.options_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(100) NOT NULL UNIQUE, -- e.g. RELIANCE240229C2500
    underlying_symbol VARCHAR(50) NOT NULL, -- e.g. RELIANCE
    expiry_date DATE NOT NULL,
    strike_price NUMERIC NOT NULL,
    option_type VARCHAR(2) NOT NULL CHECK (option_type IN ('CE', 'PE')),
    lot_size INTEGER NOT NULL DEFAULT 1,
    last_price NUMERIC,
    bid NUMERIC,
    ask NUMERIC,
    iv NUMERIC,
    delta NUMERIC,
    theta NUMERIC,
    gamma NUMERIC,
    vega NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Futures Contracts Table
CREATE TABLE IF NOT EXISTS public.futures_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(100) NOT NULL UNIQUE, -- e.g. RELIANCE FEB FUT
    underlying_symbol VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    lot_size INTEGER NOT NULL DEFAULT 1,
    last_price NUMERIC,
    bid NUMERIC,
    ask NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Existing Positions/Orders tables or create a new one
-- To keep things clean without breaking Phase 1-6 features, let's create `fo_positions`
CREATE TABLE IF NOT EXISTS public.fo_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contract_symbol VARCHAR(100) NOT NULL, -- The specific F&O symbol
    underlying_symbol VARCHAR(50) NOT NULL,
    instrument_type VARCHAR(10) NOT NULL CHECK (instrument_type IN ('FUT', 'OPT')),
    option_type VARCHAR(2) CHECK (option_type IN ('CE', 'PE')),
    strike_price NUMERIC,
    expiry_date DATE,
    qty INTEGER NOT NULL, -- Represented in actual shares (lots * lot_size)
    lot_size INTEGER NOT NULL,
    avg_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_fo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_options_contracts_timestamp
BEFORE UPDATE ON public.options_contracts
FOR EACH ROW EXECUTE FUNCTION update_fo_updated_at();

CREATE TRIGGER update_futures_contracts_timestamp
BEFORE UPDATE ON public.futures_contracts
FOR EACH ROW EXECUTE FUNCTION update_fo_updated_at();

CREATE TRIGGER update_fo_positions_timestamp
BEFORE UPDATE ON public.fo_positions
FOR EACH ROW EXECUTE FUNCTION update_fo_updated_at();

-- RLS Policies
ALTER TABLE public.options_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futures_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fo_positions ENABLE ROW LEVEL SECURITY;

-- Anyone can read contracts
CREATE POLICY "Public can view options_contracts" ON public.options_contracts FOR SELECT USING (true);
CREATE POLICY "Public can view futures_contracts" ON public.futures_contracts FOR SELECT USING (true);

-- Only users can view their own positions
CREATE POLICY "Users can view their fo_positions" ON public.fo_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their fo_positions" ON public.fo_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their fo_positions" ON public.fo_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their fo_positions" ON public.fo_positions FOR DELETE USING (auth.uid() = user_id);
