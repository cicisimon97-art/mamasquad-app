-- Run this in your Supabase SQL Editor to create the required tables

-- Users table (profiles linked to Supabase Auth)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  area text,
  bio text,
  mom_age text,
  kids jsonb default '[]',
  interests text[] default '{}',
  quick_answers jsonb default '{}',
  is_verified boolean default false,
  is_beta_member boolean default false,
  is_founding_memeber boolean default false,
  verification_status text,
  stripe_verification_id text,
  role text,
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

-- ─── Groups ───

create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  area text,
  age_group text default 'All Ages',
  max_members int default 30,
  is_private boolean default true,
  rules text[] default '{}',
  emoji text default '👥',
  color text default '#FF6B8A',
  admin_id uuid references public.users(id),
  admin_name text,
  created_at timestamptz default now()
);

alter table public.groups enable row level security;

-- Anyone authenticated can read groups
create policy "Authenticated users can read groups"
  on public.groups for select
  to authenticated
  using (true);

-- Authenticated users can create groups
create policy "Authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = admin_id);

-- Admin can update their own groups
create policy "Admin can update own groups"
  on public.groups for update
  to authenticated
  using (auth.uid() = admin_id);

-- ─── Group Members ───

create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

-- Anyone authenticated can read group members
create policy "Authenticated users can read group members"
  on public.group_members for select
  to authenticated
  using (true);

-- Authenticated users can insert (join a group / be added)
create policy "Authenticated users can insert group members"
  on public.group_members for insert
  to authenticated
  with check (true);

-- Members can remove themselves, admins can remove anyone in their group
create policy "Members can delete own membership"
  on public.group_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Join Requests ───

create table if not exists public.join_requests (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  user_name text,
  user_avatar text,
  user_bio text,
  child_age text,
  message text,
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.join_requests enable row level security;

-- Users can read their own requests; group admins can read requests for their groups
create policy "Users can read own join requests"
  on public.join_requests for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.groups
      where groups.id = join_requests.group_id
      and groups.admin_id = auth.uid()
    )
  );

-- Authenticated users can create join requests
create policy "Authenticated users can create join requests"
  on public.join_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Group admins can update request status (approve/deny)
create policy "Group admins can update join requests"
  on public.join_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.groups
      where groups.id = join_requests.group_id
      and groups.admin_id = auth.uid()
    )
  );

-- ─── Events / Playdates ───

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  location text,
  date text,
  time text,
  ages text default 'All Ages',
  max_attendees int default 15,
  description text,
  host_id uuid references public.users(id),
  host_name text,
  group_id uuid references public.groups(id) on delete set null,
  color text default '#FF6B8A',
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Anyone authenticated can read events"
  on public.events for select
  to authenticated
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Host can update own events"
  on public.events for update
  to authenticated
  using (auth.uid() = host_id);

create policy "Host can delete own events"
  on public.events for delete
  to authenticated
  using (auth.uid() = host_id);

-- ─── Event RSVPs ───

create table if not exists public.event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create policy "Anyone authenticated can read RSVPs"
  on public.event_rsvps for select
  to authenticated
  using (true);

create policy "Users can RSVP"
  on public.event_rsvps for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own RSVP"
  on public.event_rsvps for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Comments ───

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  user_name text,
  text text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Anyone authenticated can read comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Authenticated users can post comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);
