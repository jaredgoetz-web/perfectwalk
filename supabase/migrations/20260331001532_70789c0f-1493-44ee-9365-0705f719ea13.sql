-- Table to store user personalization data and AI-generated walk prompts
CREATE TABLE public.user_personalization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  answers JSONB NOT NULL DEFAULT '{}',
  phase_prompts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_personalization ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write by device_id (no auth required for now)
CREATE POLICY "Anyone can read their own personalization"
  ON public.user_personalization FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert personalization"
  ON public.user_personalization FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update personalization"
  ON public.user_personalization FOR UPDATE
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_personalization_updated_at
  BEFORE UPDATE ON public.user_personalization
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();