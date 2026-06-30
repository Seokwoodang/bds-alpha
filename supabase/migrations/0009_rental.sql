-- 0009: 보유 자산에 임대(월세) 정보 추가 — 지식산업센터·상가·오피스텔 임대 물건
alter table public.properties
  add column if not exists is_rental    boolean not null default false,
  add column if not exists deposit      integer not null default 0,   -- 보증금(만원)
  add column if not exists monthly_rent integer not null default 0,   -- 월세(만원)
  add column if not exists rent_day     integer,                      -- 월세 수령일(1~31)
  add column if not exists lease_start  date,
  add column if not exists lease_end    date;

-- 만기 임박 조회용(본인 행 한정 RLS는 기존 정책이 커버)
create index if not exists properties_lease_end_idx on public.properties (user_id, lease_end);
