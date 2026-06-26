-- 부동산알파 — 초기 스키마 + RLS
-- 적용: Supabase SQL editor 또는 `supabase db push`.

create table if not exists public.listings (
  id int primary key,
  title text not null,
  type text not null,
  deal text not null,
  region text not null,
  dong text not null,
  price_text text not null,
  price_num int not null,
  area int not null,
  floor text not null,
  built int not null,
  roi numeric(4,1) not null,
  tags text[] not null default '{}',
  beds int not null default 0
);

create table if not exists public.regions (
  name text primary key,
  price numeric(5,1) not null,
  change numeric(4,1) not null,
  ord int not null default 0
);

create table if not exists public.guides (
  id int primary key,
  category text not null,
  title text not null,
  excerpt text not null,
  meta text not null,
  hue int not null,
  body text[] not null
);

create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id int not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists listings_region_idx on public.listings (region);
create index if not exists listings_deal_idx on public.listings (deal);
create index if not exists listings_type_idx on public.listings (type);

-- RLS
alter table public.listings enable row level security;
alter table public.regions enable row level security;
alter table public.guides enable row level security;
alter table public.saved_listings enable row level security;

drop policy if exists "public read listings" on public.listings;
drop policy if exists "public read regions" on public.regions;
drop policy if exists "public read guides" on public.guides;
create policy "public read listings" on public.listings for select using (true);
create policy "public read regions"  on public.regions  for select using (true);
create policy "public read guides"   on public.guides   for select using (true);

drop policy if exists "own saved select" on public.saved_listings;
drop policy if exists "own saved insert" on public.saved_listings;
drop policy if exists "own saved delete" on public.saved_listings;
create policy "own saved select" on public.saved_listings for select using (auth.uid() = user_id);
create policy "own saved insert" on public.saved_listings for insert with check (auth.uid() = user_id);
create policy "own saved delete" on public.saved_listings for delete using (auth.uid() = user_id);
