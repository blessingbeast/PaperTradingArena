-- migration_settings_tables.sql

-- 1. Create Privacy Settings Table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    show_trade_history BOOLEAN DEFAULT true,
    show_equity BOOLEAN DEFAULT true,
    show_win_rate BOOLEAN DEFAULT true,
    hide_open_positions BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for Privacy
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Create Trading Preferences Table
CREATE TABLE IF NOT EXISTS public.trading_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_order_type TEXT DEFAULT 'MARKET',
    default_qty INTEGER DEFAULT 1,
    auto_sl_target BOOLEAN DEFAULT false,
    slippage_simulation BOOLEAN DEFAULT true,
    price_refresh_speed INTEGER DEFAULT 1, -- in seconds
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for Trading Preferences
ALTER TABLE public.trading_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trading preferences" ON public.trading_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own trading preferences" ON public.trading_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Create Notification Settings Table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_executed BOOLEAN DEFAULT true,
    margin_warning BOOLEAN DEFAULT true,
    rank_change BOOLEAN DEFAULT true,
    email_alerts BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for Notification Settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON public.notification_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Extend Profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='twitter_url') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='linkedin_url') THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
    END IF;
END $$;

-- 5. Trigger to auto-create settings rows for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger AS $$
BEGIN
  -- Insert default privacy settings
  INSERT INTO public.privacy_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  -- Insert default trading preferences
  INSERT INTO public.trading_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  -- Insert default notification settings
  INSERT INTO public.notification_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();
