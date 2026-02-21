-- Create chart_layouts table to store user's saved layouts, timeframes, and indicators
CREATE TABLE public.chart_layouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  symbol text NOT NULL,
  layout_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, symbol)
);

-- RLS Policies
ALTER TABLE public.chart_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chart layouts" 
ON public.chart_layouts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart layouts" 
ON public.chart_layouts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart layouts" 
ON public.chart_layouts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chart layouts" 
ON public.chart_layouts FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chart_layouts_modtime
BEFORE UPDATE ON public.chart_layouts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
