create table if not exists user_stats (
  user_id uuid primary key,
  username text,
  avatar_url text,
  total_equity numeric default 0,
  invested numeric default 0,
  total_pnl numeric default 0,
  total_return_pct numeric default 0,
  fno_pnl numeric default 0,
  stock_pnl numeric default 0,
  win_rate numeric default 0,
  trades_count int default 0,
  is_hidden boolean default false,
  last_updated timestamptz default now()
);

create table if not exists leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_stats(user_id) on delete cascade,
  period text,
  snapshot_date date,
  total_return_pct numeric,
  total_pnl numeric,
  equity numeric,
  rank int
);

create table if not exists anti_cheat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_stats(user_id) on delete cascade,
  reason text,
  details jsonb,
  created_at timestamptz default now()
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_stats(user_id) on delete cascade,
  badge text,
  awarded_at timestamptz default now(),
  unique(user_id, badge)
);

create index if not exists idx_leaderboard_period on leaderboard_snapshots(period, snapshot_date);
