-- FinAI: profiles table + auto-create trigger
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id        uuid references auth.users(id) on delete cascade primary key,
  name      text        not null default '',
  avatar    text        not null default '',
  color     text        not null default '#6366f1',
  score     integer     not null default 742,
  created_at timestamptz not null default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Trigger: auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _name   text;
  _avatar text;
begin
  _name   := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Usuário'
  );
  _avatar := coalesce(
    new.raw_user_meta_data->>'avatar',
    upper(left(_name, 2))
  );

  insert into public.profiles (id, name, avatar, color)
  values (new.id, _name, _avatar, '#6366f1')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
