-- Run this in your Supabase SQL Editor to create the required tables

-- Users table (profiles linked to Supabase Auth)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  area text,
  bio text,
  child_name text,
  child_age text,
  interests text[] default '{}',
  is_verified boolean default false,
  is_founding_member boolean default false,
  invite_code text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Allow insert during signup (user inserts their own row)
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Invite codes table
create table if not exists public.invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  is_used boolean default false,
  used_by uuid references public.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.invite_codes enable row level security;

-- Anyone can check if a code is valid (needed before auth)
create policy "Anyone can read invite codes"
  on public.invite_codes for select
  to anon, authenticated
  using (true);

-- Authenticated users can mark a code as used
create policy "Authenticated users can update invite codes"
  on public.invite_codes for update
  to authenticated
  using (true);

-- Seed some invite codes (replace or add your own)
insert into public.invite_codes (code) values
  ('MAMASQUAD2026'),
  ('FOUNDING-MOM'),
  ('CICI-INVITED'),
  ('BETA-MOM'),
  ('SQUAD-ONE')
on conflict (code) do nothing;
