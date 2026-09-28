-- SMART SOKO: REPAIR REGISTRATION / "Database error saving new user"
--
-- Tumia SQL hii kwenye Supabase SQL Editor kwa project ya SMART SOKO.
-- Hii haifuti auth.users; inarekebisha public.profiles na trigger ya usajili.
--
-- SABABU YA ERROR:
-- Supabase Auth inaunda auth.users kwanza, kisha trigger inaandika public.profiles.
-- Kama profiles iliundwa zamani ikiwa na schema tofauti, /auth/v1/signup inaweza kurudisha 500.

create extension if not exists pgcrypto;

-- Ondoa trigger ya zamani kwanza.
drop trigger if exists on_auth_user_created_smart_soko on auth.users;

-- Ondoa function ya zamani ili schema ya function iwe safi.
drop function if exists public.handle_new_smart_soko_user();

-- SmartSoko orders/delivery hazitegemei public.profiles moja kwa moja,
-- hivyo tunaweza kuunda profiles upya bila kufuta auth.users.
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_phone_idx on public.profiles(phone);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Trigger function. SECURITY DEFINER inaruhusu function kuandika profile
-- wakati Supabase Auth bado inamalizia signup.
create or replace function public.handle_new_smart_soko_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    updated_at = now();

  return new;
end;
$$;

-- Trigger mpya.
create trigger on_auth_user_created_smart_soko
after insert on auth.users
for each row
execute function public.handle_new_smart_soko_user();

-- Rejesha profiles za users ambao walishasajiliwa kabla ya repair.
insert into public.profiles (id, full_name, phone)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  updated_at = now();

-- Hakikisha function inaweza kuitwa na trigger bila kubadilisha ownership.
revoke all on function public.handle_new_smart_soko_user() from public;
revoke all on function public.handle_new_smart_soko_user() from anon;
revoke all on function public.handle_new_smart_soko_user() from authenticated;

grant execute on function public.handle_new_smart_soko_user() to postgres;

