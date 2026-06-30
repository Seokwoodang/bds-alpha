-- v3.2: 국토부 아파트 전월세 실거래 적재 (갭/전세가율용)

create table if not exists public.rents (
  id bigint generated always as identity primary key,
  region text not null,
  lawd_cd text not null,
  apt_name text,
  dong text,
  deposit int not null,                 -- 보증금(만원)
  monthly_rent int not null default 0,  -- 월세(만원). 0 = 전세
  area numeric(7,2),
  floor int,
  build_year int,
  deal_date date not null,
  created_at timestamptz not null default now(),
  unique (lawd_cd, deal_date, apt_name, area, floor, deposit, monthly_rent, dong)
);

create index if not exists rent_region_date_idx on public.rents (region, deal_date);
create index if not exists rent_region_area_idx on public.rents (region, area);

alter table public.rents enable row level security;
drop policy if exists "public read rents" on public.rents;
create policy "public read rents" on public.rents for select using (true);
