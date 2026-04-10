
CREATE TABLE public.walk_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  mood TEXT,
  reflection_q1 TEXT,
  reflection_q2 TEXT,
  reflection_q3 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.walk_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read walk entries" ON public.walk_entries
  FOR SELECT USING (true);

CREATE POLICY "Insert requires device_id" ON public.walk_entries
  FOR INSERT WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);
