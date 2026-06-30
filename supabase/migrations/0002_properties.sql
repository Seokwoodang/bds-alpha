-- v2: 보유 자산(내 집) 테이블 + RLS

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                 -- 단지명/별칭
  region text not null,               -- 8개 구 중 하나(시세 연동 키)
  dong text,                          -- 동(선택)
  type text not null,                 -- 아파트/오피스텔/주택/오피스
  area numeric(6,1) not null,         -- 전용면적 ㎡
  purchase_price int not null,        -- 매입가(만원 단위, 예: 245000 = 24.5억)
  purchase_date date not null,
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists properties_user_idx on public.properties (user_id);

alter table public.properties enable row level security;
drop policy if exists "own properties select" on public.properties;
drop policy if exists "own properties insert" on public.properties;
drop policy if exists "own properties update" on public.properties;
drop policy if exists "own properties delete" on public.properties;
create policy "own properties select" on public.properties for select using (auth.uid() = user_id);
create policy "own properties insert" on public.properties for insert with check (auth.uid() = user_id);
create policy "own properties update" on public.properties for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own properties delete" on public.properties for delete using (auth.uid() = user_id);
