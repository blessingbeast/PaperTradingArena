-- Migration for PaperTradingArena Leaderboard System
-- Creates user_stats, leaderboard_snapshots, anti_cheat_logs, user_badges

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  username text,
  avatar_url text,
  total_equity numeric DEFAULT 0,
  invested numeric DEFAULT 0,
  total_pnl numeric DEFAULT 0,
  total_return_pct numeric DEFAULT 0,
  fno_pnl numeric DEFAULT 0,
  stock_pnl numeric DEFAULT 0,
  win_rate numeric DEFAULT 0,
  trades_count int DEFAULT 0,
  is_hidden boolean DEFAULT false, -- For Privacy Settings (STEP 10)
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  period text NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
  snapshot_date date NOT NULL,
  total_return_pct numeric DEFAULT 0,
  total_pnl numeric DEFAULT 0,
  equity numeric DEFAULT 0,
  rank int NOT NULL
);

-- Index for fast ranking queries on snapshots
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period_date 
ON public.leaderboard_snapshots(period, snapshot_date);

CREATE TABLE IF NOT EXISTS public.anti_cheat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  badge text NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_cheat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Setup basic Read access policies
CREATE POLICY "Public can view user stats" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Public can view leaderboard snapshots" ON public.leaderboard_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can view own anti cheat logs" ON public.anti_cheat_logs FOR SELECT USING (auth.uid() = user_id);

-- Setup internal triggers to update last_updated
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_timestamp 
BEFORE UPDATE ON public.user_stats 
FOR EACH ROW EXECUTE PROCEDURE update_user_stats_updated_at();
