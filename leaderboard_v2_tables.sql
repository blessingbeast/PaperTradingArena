-- 1. Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  bio text,
  avatar_url text,
  country text,
  is_private boolean default false,
  created_at timestamptz default now()
);

-- Migrate existing users from user_stats to profiles to keep mock data
insert into profiles (id, username, is_private)
select user_id, username, is_hidden from user_stats
on conflict (id) do nothing;

-- 2. Create leaderboard_stats table
create table if not exists leaderboard_stats (
  user_id uuid primary key references profiles(id) on delete cascade,
  total_return_pct numeric default 0,
  total_pnl numeric default 0,
  equity numeric default 0,
  trades_count int default 0,
  win_rate numeric default 0,
  max_drawdown numeric default 0,
  best_trade numeric default 0,
  worst_trade numeric default 0,
  fno_pnl numeric default 0,
  stock_pnl numeric default 0,
  updated_at timestamptz default now()
);

-- Migrate existing stats
insert into leaderboard_stats (user_id, total_return_pct, total_pnl, equity, trades_count, fno_pnl, stock_pnl, updated_at)
select user_id, total_return_pct, total_pnl, total_equity, trades_count, fno_pnl, stock_pnl, last_updated from user_stats
on conflict (user_id) do nothing;

-- 3. Fix foreign keys on existing tables to point to profiles instead of user_stats
alter table leaderboard_snapshots drop constraint if exists leaderboard_snapshots_user_id_fkey;
alter table leaderboard_snapshots add constraint leaderboard_snapshots_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

alter table anti_cheat_logs drop constraint if exists anti_cheat_logs_user_id_fkey;
alter table anti_cheat_logs add constraint anti_cheat_logs_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

alter table user_badges drop constraint if exists user_badges_user_id_fkey;
alter table user_badges add constraint user_badges_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

-- Now safe to drop user_stats (optional, we can leave it, but good to clean up)
drop table if exists user_stats;

-- 4. Create friends table
create table if not exists friends (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

-- 5. Create storage bucket for avatars (runs if the current user has permissions, otherwise do manually in dashboard)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
