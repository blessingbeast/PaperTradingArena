-- 1. Modify existing Users table for RBAC
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set a default admin (Update this to the user's actual desired admin UUID or email later if needed via UI)
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@email.com';

-- 2. Admin Action Logging Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for admin_logs (Only admins can read/write logs)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" 
    ON public.admin_logs FOR SELECT 
    USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can insert logs" 
    ON public.admin_logs FOR INSERT 
    WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- 3. System Runtime Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed Default Settings
INSERT INTO public.system_settings (key, value)
VALUES 
    ('market_open', 'true'),
    ('simulation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS for System Settings (Anyone can read to know if market is open, only admins can update)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" 
    ON public.system_settings FOR SELECT 
    USING ( true );

CREATE POLICY "Admins can update system settings" 
    ON public.system_settings FOR UPDATE 
    USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can insert system settings" 
    ON public.system_settings FOR INSERT 
    WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
