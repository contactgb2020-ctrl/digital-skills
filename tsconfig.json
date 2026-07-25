-- Announcements posted by trainers to their students
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: trainers manage their own announcements; anyone can read
alter table public.announcements enable row level security;

create policy "Trainers can CRUD own announcements"
  on public.announcements
  for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Anyone can read announcements"
  on public.announcements
  for select
  using (true);

-- Index for ordering by newest
create index if not exists announcements_trainer_created_idx
  on public.announcements (trainer_id, created_at desc);