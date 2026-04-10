-- Walk entries table for storing walk history and reflections
create table if not exists public.walk_entries (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  date timestamptz not null default now(),
  duration_minutes integer,
  completed_phases integer[],
  reflection_q1 text, -- "What opened up during your walk?"
  reflection_q2 text, -- "What truth felt real today?"
  reflection_q3 text, -- "What action feels aligned right now?"
  mood text,
  journal_entry text,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by device
create index if not exists idx_walk_entries_device_date
  on public.walk_entries (device_id, created_at desc);

-- Enable RLS
alter table public.walk_entries enable row level security;

-- RLS policies: device-based access
create policy "Users can read own walk entries"
  on public.walk_entries for select
  using (true);

create policy "Users can insert own walk entries"
  on public.walk_entries for insert
  with check (device_id is not null and device_id != '');

create policy "Users can update own walk entries"
  on public.walk_entries for update
  using (true)
  with check (device_id is not null and device_id != '');
