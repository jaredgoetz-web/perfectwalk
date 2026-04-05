
-- Create coach_messages table for conversation history
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Policies based on device_id (no auth required, matches existing pattern)
CREATE POLICY "Read own coach messages"
  ON public.coach_messages FOR SELECT
  USING (true);

CREATE POLICY "Insert own coach messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Delete own coach messages"
  ON public.coach_messages FOR DELETE
  USING (device_id IS NOT NULL AND length(device_id) > 0);

-- Index for fast lookups
CREATE INDEX idx_coach_messages_device_id ON public.coach_messages (device_id, created_at);
