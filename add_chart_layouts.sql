-- SQL Migration: Add chart_layouts table
CREATE TABLE IF NOT EXISTS public.chart_layouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  symbol text NOT NULL,
  layout_data jsonb NOT NULL,
  created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.chart_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chart layouts" ON public.chart_layouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chart layouts" ON public.chart_layouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chart layouts" ON public.chart_layouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chart layouts" ON public.chart_layouts FOR DELETE USING (auth.uid() = user_id);
