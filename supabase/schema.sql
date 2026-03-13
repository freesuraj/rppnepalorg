create extension if not exists pgcrypto;

create table if not exists public.movement_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 5 and 255),
  phone text not null check (char_length(trim(phone)) between 5 and 40),
  tiktok text,
  instagram text,
  facebook text,
  x_profile text,
  source_language text not null default 'ne' check (source_language in ('ne', 'en')),
  consent boolean not null default false,
  review_status text not null default 'new' check (
    review_status in ('new', 'reviewed', 'contacted', 'archived')
  )
);

create index if not exists movement_signups_created_at_idx
  on public.movement_signups (created_at desc);

alter table public.movement_signups enable row level security;

drop policy if exists "Public can insert movement signups" on public.movement_signups;

create policy "Public can insert movement signups"
on public.movement_signups
for insert
to anon
with check (consent is true);
