CREATE TYPE order_status AS ENUM ('PENDING', 'EXECUTED', 'PARTIAL', 'CANCELLED', 'REJECTED');
CREATE TYPE order_time_validity AS ENUM ('DAY', 'IOC');
CREATE TYPE comprehensive_order_type AS ENUM ('MARKET', 'LIMIT', 'SL', 'SL-M');

CREATE TABLE public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  symbol text not null,
  trade_type text not null check (trade_type in ('BUY', 'SELL')),
  order_type comprehensive_order_type not null,
  qty integer not null,
  filled_qty integer default 0,
  requested_price numeric,
  trigger_price numeric,
  executed_price numeric,
  instrument_type text not null,
  validity order_time_validity default 'DAY',
  status order_status default 'PENDING',
  rejection_reason text,
  charges_breakdown jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for the new orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
