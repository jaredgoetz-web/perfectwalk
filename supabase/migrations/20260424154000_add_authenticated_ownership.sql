-- Add authenticated ownership to persisted app data.

alter table public.user_personalization
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.walk_entries
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.coach_messages
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.user_personalization
  drop constraint if exists user_personalization_device_id_key;

create unique index if not exists user_personalization_user_id_unique
  on public.user_personalization (user_id)
  where user_id is not null;

create unique index if not exists user_personalization_anonymous_device_unique
  on public.user_personalization (device_id)
  where user_id is null;

create index if not exists walk_entries_user_id_created_at_idx
  on public.walk_entries (user_id, created_at desc)
  where user_id is not null;

create index if not exists coach_messages_user_id_created_at_idx
  on public.coach_messages (user_id, created_at)
  where user_id is not null;

drop policy if exists "Anyone can read their own personalization" on public.user_personalization;
drop policy if exists "Anyone can insert personalization" on public.user_personalization;
drop policy if exists "Anyone can update personalization" on public.user_personalization;
drop policy if exists "Allow create personalization with device_id" on public.user_personalization;
drop policy if exists "Allow update personalization with device_id" on public.user_personalization;

create policy "Authenticated users can read personalization"
  on public.user_personalization for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert personalization"
  on public.user_personalization for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can update personalization"
  on public.user_personalization for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own walk entries" on public.walk_entries;
drop policy if exists "Users can insert own walk entries" on public.walk_entries;
drop policy if exists "Users can update own walk entries" on public.walk_entries;

create policy "Authenticated users can read walk entries"
  on public.walk_entries for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert walk entries"
  on public.walk_entries for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can update walk entries"
  on public.walk_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users can delete walk entries"
  on public.walk_entries for delete
  using (auth.uid() = user_id);

drop policy if exists "Read own coach messages" on public.coach_messages;
drop policy if exists "Insert own coach messages" on public.coach_messages;
drop policy if exists "Delete own coach messages" on public.coach_messages;

create policy "Authenticated users can read coach messages"
  on public.coach_messages for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert coach messages"
  on public.coach_messages for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can delete coach messages"
  on public.coach_messages for delete
  using (auth.uid() = user_id);
