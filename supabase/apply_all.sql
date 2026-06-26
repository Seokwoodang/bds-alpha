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
-- 부동산알파 — 시드 데이터(더미). 운영에선 실거래 API/DB로 교체.

insert into public.listings (id,title,type,deal,region,dong,price_text,price_num,area,floor,built,roi,tags,beds) values
 (1,'라이프 청담 102동','아파트','매매','강남구','청담동','24억 5,000',245000,84,'24/30층',2019,3.1,'{한강뷰,역세권}',3),
 (2,'반포 스카이팰리스','아파트','매매','서초구','반포동','32억',320000,59,'15/35층',2021,2.7,'{신축,학군}',2),
 (3,'잠실 레이크포레','아파트','전세','송파구','잠실동','전세 11억',110000,84,'9/24층',2017,0,'{호수뷰,대단지}',3),
 (4,'합정 더원 오피스텔','오피스텔','매매','마포구','합정동','4억 9,000',49000,33,'12/18층',2022,4.8,'{역세권,신축}',1),
 (5,'성수 리버티','아파트','매매','성동구','성수동','18억 2,000',182000,76,'7/15층',2016,3.4,'{카페거리,리버뷰}',3),
 (6,'한남 테라스하우스','주택','매매','용산구','한남동','41억',410000,132,'3/3층',2015,2.2,'{프라이빗,정원}',4),
 (7,'여의도 파이낸스타워 #1204','오피스','월세','영등포구','여의도동','2,000 / 350',35000,56,'24/40층',2020,5.6,'{오피스,금융가}',0),
 (8,'자양 한강센트럴','아파트','매매','광진구','자양동','14억 8,000',148000,59,'18/25층',2018,3.6,'{한강뷰,역세권}',2),
 (9,'역삼 비즈하임','오피스텔','월세','강남구','역삼동','1,000 / 120',12000,29,'8/14층',2021,5.2,'{역세권,풀옵션}',1)
on conflict (id) do nothing;

insert into public.regions (name,price,change,ord) values
 ('강남구',24.0,2.3,0),('서초구',22.0,1.8,1),('용산구',20.0,1.1,2),('송파구',15.0,-0.6,3),
 ('성동구',14.0,3.2,4),('광진구',11.0,1.5,5),('마포구',12.0,2.0,6),('영등포구',10.0,0.9,7)
on conflict (name) do nothing;

insert into public.guides (id,category,title,excerpt,meta,hue,body) values
 (1,'초보 가이드','부동산 투자 처음이라면? 꼭 봐야 할 5가지','입지·시세·세금까지, 첫 투자 전에 반드시 점검해야 할 핵심 체크리스트.','8분 읽기 · 2026.06.10',218,
  array['부동산 투자를 처음 시작할 때 가장 흔한 실수는 시세만 보고 매수를 결정하는 것입니다. 가격은 결과일 뿐, 그 가격을 만든 입지와 수요를 먼저 이해해야 합니다.','첫째, 교통과 학군, 일자리라는 세 가지 수요 축을 확인하세요. 둘째, 최근 3년 실거래가 흐름을 보고 변동성을 파악합니다.','셋째, 보유세·취득세·양도세를 미리 계산해 실질 수익률을 따져야 합니다. 표면 수익률과 세후 수익률은 크게 다를 수 있습니다.','마지막으로, 자금 계획에 항상 여유를 두세요. 금리 변동과 공실 위험은 늘 존재합니다.']),
 (2,'수익률 분석','전세가율로 갭투자 타이밍 읽는 법','전세가율이 알려주는 시장의 온도. 데이터로 진입 시점을 판단하세요.','6분 읽기 · 2026.06.05',155,
  array['전세가율은 매매가 대비 전세가의 비율로, 시장의 투자 심리를 보여주는 핵심 지표입니다.','전세가율이 높다는 것은 실수요가 탄탄하고 갭이 작다는 의미로, 적은 자본으로 진입할 수 있는 환경을 뜻합니다.','다만 전세가율이 지나치게 높으면 매매가 상승 여력이 제한적일 수 있어, 지역별 공급 계획과 함께 해석해야 합니다.','부동산알파의 시세 분석에서 지역별 전세가율 추이를 확인하고 진입 시점을 가늠해 보세요.']),
 (3,'세금 절약','1주택자가 놓치기 쉬운 절세 포인트','장기보유특별공제부터 비과세 요건까지, 실수 없이 챙기는 법.','7분 읽기 · 2026.05.28',28,
  array['양도소득세는 보유 기간과 거주 요건에 따라 크게 달라집니다. 1세대 1주택 비과세 요건을 정확히 이해하는 것이 출발점입니다.','장기보유특별공제는 보유와 거주 기간에 따라 최대 80%까지 적용되므로, 매도 시점을 전략적으로 잡아야 합니다.','일시적 2주택 비과세 특례의 처분 기한도 반드시 캘린더에 표시해 두세요.','세법은 자주 바뀌므로, 큰 거래 전에는 전문가 상담을 권장합니다.']),
 (4,'시장 동향','2026 상반기 서울 아파트 시장 리포트','금리 안정세 속 거래량 회복 신호. 지역별 온도차를 분석합니다.','10분 읽기 · 2026.05.20',262,
  array['2026년 상반기 서울 아파트 시장은 금리 안정과 함께 거래량이 점진적으로 회복되는 모습을 보였습니다.','강남·서초·용산 등 핵심지는 상승세를 유지한 반면, 일부 외곽 지역은 보합 또는 약보합을 나타냈습니다.','정비사업 진척과 공급 일정이 지역별 가격 차별화를 만드는 핵심 변수로 작용하고 있습니다.','하반기에는 입주 물량과 정책 변화가 변동성을 키울 수 있어 모니터링이 필요합니다.']),
 (5,'오피스텔','오피스텔 수익률, 진짜 계산하는 법','공실·관리비·세금을 반영한 실질 수익률 계산 공식을 공개합니다.','5분 읽기 · 2026.05.12',198,
  array['오피스텔 광고에 적힌 수익률은 대개 공실과 비용을 제외하기 전의 표면 수익률입니다.','실질 수익률은 연 임대수입에서 관리비·세금·공실 손실을 빼고, 실투자금으로 나눠 계산합니다.','공실률을 연 5~10%로 보수적으로 가정하고, 임대관리 비용도 반영하는 것이 안전합니다.','부동산알파의 매물 상세에서 예상 수익률을 참고하되, 본인 상황에 맞게 재계산해 보세요.']),
 (6,'입지 분석','역세권의 함정, 거리보다 동선이 중요하다','직선 거리 500m가 의미 없는 이유. 진짜 좋은 입지 보는 눈.','6분 읽기 · 2026.05.03',340,
  array['역까지 직선 거리가 가깝다고 모두 좋은 역세권은 아닙니다. 실제 도보 동선과 경사, 신호 대기가 체감 거리를 좌우합니다.','대로를 건너야 하거나 언덕을 올라야 한다면 표기된 거리보다 훨씬 멀게 느껴집니다.','상권·학교·공원과의 연결 동선도 함께 보면 생활 편의성을 더 정확히 평가할 수 있습니다.','지도에서 거리뿐 아니라 실제 경로를 직접 걸어보는 습관을 권합니다.'])
on conflict (id) do nothing;
