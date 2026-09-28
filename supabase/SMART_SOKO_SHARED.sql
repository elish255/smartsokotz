-- SMART SOKO: users + orders + delivery + FimiPay
-- Run once in the same Supabase project used by SMART SOKO.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists on_auth_user_created_smart_soko on auth.users;
create trigger on_auth_user_created_smart_soko
after insert on auth.users
for each row execute procedure public.handle_new_smart_soko_user();

create table if not exists public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  region text not null,
  district text not null,
  place text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'payment_pending',
  payment_status text not null default 'pending',
  payment_provider text,
  payment_order_id text,
  payment_response jsonb,
  subtotal numeric(14,2) not null default 0,
  delivery_fee numeric(14,2) not null default 0,
  delivery_distance_km numeric(10,2) not null default 0,
  delivery_rate_per_km numeric(10,2) not null default 2000,
  total numeric(14,2) not null default 0,
  currency text not null default 'TZS',
  delivery_full_name text not null default '',
  customer_phone text not null default '',
  delivery_region text not null default '',
  delivery_district text not null default '',
  delivery_place text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null default '',
  product_title text not null,
  variant_id text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_phone_idx on public.profiles(phone);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_payment_order_idx on public.orders(payment_order_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists delivery_addresses_user_idx on public.delivery_addresses(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.delivery_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "delivery_select_own" on public.delivery_addresses;
create policy "delivery_select_own" on public.delivery_addresses for select to authenticated using (user_id = auth.uid());
drop policy if exists "delivery_insert_own" on public.delivery_addresses;
create policy "delivery_insert_own" on public.delivery_addresses for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "delivery_update_own" on public.delivery_addresses;
create policy "delivery_update_own" on public.delivery_addresses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Server-side FimiPay API uses the service-role/secret key and bypasses RLS.
-- Do not expose that key with a VITE_ prefix.
