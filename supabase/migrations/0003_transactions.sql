-- v3: 국토부 아파트 매매 실거래 적재 테이블 (공공데이터)

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  region text not null,            -- 우리 8개 구 이름(LAWD_CD 매핑)
  lawd_cd text not null,           -- 법정동코드 앞5자리
  apt_name text,
  dong text,                       -- 법정동(umdNm)
  deal_amount int not null,        -- 거래금액(만원)
  area numeric(7,2),               -- 전용면적(㎡)
  floor int,
  build_year int,
  deal_date date not null,
  cdeal_type text,                 -- 해제여부(O=해제). 적재 시 해제건 제외
  created_at timestamptz not null default now(),
  unique (lawd_cd, deal_date, apt_name, area, floor, deal_amount, dong)
);

create index if not exists tx_region_date_idx on public.transactions (region, deal_date);
create index if not exists tx_region_area_idx on public.transactions (region, area);

alter table public.transactions enable row level security;
drop policy if exists "public read transactions" on public.transactions;
create policy "public read transactions" on public.transactions for select using (true);
-- 쓰기는 서버(서비스키/마이그레이션)만 — 클라 insert 정책 없음(RLS로 차단)
