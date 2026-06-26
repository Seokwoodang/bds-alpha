# Design — 부동산알파 (bds-alpha)
slug: bds-alpha   from: 02-resolved-spec.md   status: draft (Tests 게이트에서 테스트와 함께 승인)

> 이 문서만으로 다음 개발자가 구현 가능해야 한다. 원본 HTML은 **시각/마크업 레퍼런스**(색·간격·구조 그대로 차용)이고, 동작/상태/데이터는 아래 표준 방식으로 옮긴다. *docs scope: 본 설계 + RED 테스트까지 작성, GREEN 구현은 후속.*

## 1. Approach & architecture
- **스택:** Next.js(App Router) + TypeScript + React 클라이언트/서버 컴포넌트 혼합 + Supabase(Postgres + Auth + RLS). 스타일은 원본 인라인 스타일을 토큰화한 CSS(변수 `--navy` 등) 또는 Tailwind 중 택1 — **CSS Modules + 전역 토큰 변수** 권장(원본이 인라인 스타일이라 토큰만 추출하면 1:1 이식 쉬움).
- **데이터 흐름:** 목록/상세/시세/가이드 = **서버 컴포넌트에서 Supabase 서버 클라이언트로 fetch**(SEO·초기 렌더 빠름). 필터/검색/정렬은 **URL searchParams → 서버 쿼리**. 관심매물(하트)·인증 UI = **클라이언트 컴포넌트**(세션 필요, 상호작용). 
- **Layer split (엄격):**
  - **logic(순수, UI/네트워크 무관, Vitest 단위):** `src/lib/` — 쿼리 빌더(필터/검색/정렬 → Supabase 쿼리 파라미터로 변환하는 순수 함수), 표시 포맷터(roiText/areaText/dealStyle/detailSpecs/detailPoints), 차트 계산(buildChart), KPI 규칙, 통계 집계.
  - **data(Supabase 접근):** `src/lib/supabase/` (클라이언트 팩토리) + `src/lib/queries/` (DB 호출 = 위 순수 빌더 결과를 받아 실행).
  - **UI(thin):** `src/components/`, `src/app/**` — 테스트된 logic 위에 얇게. 비즈니스 분기는 logic에서.
- **인증:** `@supabase/ssr` 기반 미들웨어로 서버/클라 세션 동기화. 보호 경로(/mypage, 하트 액션) = 세션 없으면 `/login?returnTo=...` 리다이렉트.

## 2. Files (생성/수정 — 모든 경로)
| Path | New | Purpose |
|------|-----|---------|
| `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example` | new | 프로젝트 스캐폴드(설정). 실제 `.env.local`은 gitignore |
| `vitest.config.ts`, `playwright.config.ts` | new | 테스트 러너(로직 단위 / E2E) |
| `src/lib/supabase/server.ts` | new | 서버 컴포넌트/액션용 Supabase 클라이언트(`@supabase/ssr`) |
| `src/lib/supabase/client.ts` | new | 브라우저 클라이언트 |
| `src/lib/supabase/middleware.ts` + `middleware.ts`(root) | new | 세션 갱신 + 보호경로 리다이렉트 |
| `src/lib/types.ts` | new | Listing/Region/Guide/SavedRow 등 타입 |
| `src/lib/format.ts` | new | **순수 포맷터**: roiText, areaText, dealBadge, priceLabel, detailSpecs, detailPoints, statsAggregate |
| `src/lib/listingsQuery.ts` | new | **순수**: searchParams → `{filters, search, order}` 쿼리 스펙으로 변환(검증·정규화) |
| `src/lib/chart.ts` | new | **순수**: buildChart(regionPrice) → 시계열/path/dots/grid; kpiRules |
| `src/lib/queries/listings.ts` | new | getListings(querySpec), getListingById(id)→notFound, getSimilar(region,id) |
| `src/lib/queries/regions.ts` | new | getRegions() |
| `src/lib/queries/guides.ts` | new | getGuides(), getGuide(id) |
| `src/lib/queries/saved.ts` | new | getSaved(userId), toggleSave(userId,listingId) (server action) |
| `src/app/layout.tsx` | new | 루트 레이아웃(폰트 Pretendard, 토큰 CSS, Header/Footer 셸) |
| `src/app/globals.css` | new | 디자인 토큰 변수 + keyframes(bdsFade/bdsFadeUp) |
| `src/components/Header.tsx` | new | sticky 헤더, nav 활성, savedCount 배지, 로그인/로그아웃 |
| `src/components/Footer.tsx` | new | 다크 푸터(정적 링크) |
| `src/components/ListingCard.tsx` | new | 재사용 카드(링크 + 별도 하트 button, aria-pressed) |
| `src/components/HeartButton.tsx` | new | 클라이언트 하트 토글(세션 없으면 /login) |
| `src/components/FilterPanel.tsx` | new | 검색/거래/지역/유형 필터(URL 갱신, debounce 검색) |
| `src/components/SortSelect.tsx` | new | 정렬 select(URL 갱신) |
| `src/components/EmptyState.tsx` | new | 빈 상태(목록 🔍 / 마이 ♡) |
| `src/components/ErrorRetry.tsx` | new | 에러 배너 + 다시 시도 |
| `src/components/Skeleton*.tsx` | new | 로딩 스켈레톤(카드/차트) |
| `src/components/PriceChart.tsx` | new | SVG 라인 차트(chart.ts 결과 렌더) |
| `src/components/RegionBars.tsx` | new | 막대 비교(클릭→지역 선택, URL) |
| `src/components/GuideOverlay.tsx` | new | 모달(role=dialog, ESC, focus-trap, scroll-lock) |
| `src/components/MapPins.tsx` | new | 지도 placeholder + 핀 |
| `src/app/page.tsx` | new | 홈(시안 A) — 서버: featured listings/guides + stats |
| `src/app/listings/page.tsx` | new | 목록(searchParams → 쿼리, 카운트, 그리드/빈/에러) |
| `src/app/listings/[id]/page.tsx` | new | 상세(getListingById→notFound, 유사매물) |
| `src/app/listings/[id]/not-found.tsx` | new | 404 매물 없음 |
| `src/app/prices/page.tsx` | new | 시세(?region, 차트/KPI/막대) |
| `src/app/guides/page.tsx` | new | 가이드(피처드+그리드, 오버레이는 클라 상태) |
| `src/app/map/page.tsx` | new | 지도(?region) |
| `src/app/mypage/page.tsx` | new | 마이페이지(보호경로, saved 그리드/빈) |
| `src/app/login/page.tsx` + `src/components/AuthForm.tsx` | new | 로그인/회원가입(이메일+비번, 소셜 버튼), returnTo |
| `src/app/auth/callback/route.ts` | new | OAuth 콜백 핸들러 |
| `supabase/migrations/0001_init.sql` | new | 테이블 + RLS + 인덱스 (설계 계약; 적용은 후속) |
| `supabase/seed.sql` | new | 시드(9 listings, 8 regions, 6 guides) |

## 3. Data models / types + Supabase schema

### 타입 (`src/lib/types.ts`)
```ts
export type Deal = '매매' | '전세' | '월세';
export type PType = '아파트' | '오피스텔' | '주택' | '오피스';
export interface Listing {
  id: number; title: string; type: PType; deal: Deal;
  region: string; dong: string; price_text: string; price_num: number;
  area: number; floor: string; built: number; roi: number; tags: string[]; beds: number;
}
export interface Region { name: string; price: number; change: number; } // price 억, change %
export interface Guide { id: number; category: string; title: string; excerpt: string; meta: string; hue: number; body: string[]; }
export interface SavedRow { user_id: string; listing_id: number; created_at: string; }
export type SortKey = '추천순' | '가격높은순' | '가격낮은순' | '수익률순';
export interface QuerySpec {
  deal: Deal | '전체'; region: string; ptype: PType | '전체'; q: string; sort: SortKey;
}
```

### 스키마 (`supabase/migrations/0001_init.sql` — 계약)
```sql
create table public.listings (
  id int primary key, title text not null, type text not null, deal text not null,
  region text not null, dong text not null, price_text text not null, price_num int not null,
  area int not null, floor text not null, built int not null, roi numeric(4,1) not null,
  tags text[] not null default '{}', beds int not null default 0
);
create table public.regions (
  name text primary key, price numeric(5,1) not null, change numeric(4,1) not null,
  ord int not null default 0  -- 표시 순서(시안C 미니리스트 상위5·막대·지도 핀 순서). select 제외, order by에만 사용
);
create table public.guides (
  id int primary key, category text not null, title text not null, excerpt text not null,
  meta text not null, hue int not null, body text[] not null
);
create table public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id int not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index on public.listings (region);
create index on public.listings (deal);
create index on public.listings (type);

-- RLS
alter table public.listings enable row level security;
alter table public.regions enable row level security;
alter table public.guides enable row level security;
alter table public.saved_listings enable row level security;
create policy "public read listings" on public.listings for select using (true);
create policy "public read regions"  on public.regions  for select using (true);
create policy "public read guides"   on public.guides   for select using (true);
create policy "own saved select" on public.saved_listings for select using (auth.uid() = user_id);
create policy "own saved insert" on public.saved_listings for insert with check (auth.uid() = user_id);
create policy "own saved delete" on public.saved_listings for delete using (auth.uid() = user_id);
```
시드(`seed.sql`): 01-working-spec §3 표의 9 listings / 8 regions / 6 guides 그대로 insert(가이드 body 포함).

## 4. Functions / API (시그니처 · 동작)

### 순수 logic (`src/lib/`)
- `parseListingParams(searchParams: URLSearchParams): QuerySpec` — URL → QuerySpec. 미지정 시 기본('전체'/''/'추천순'). 알 수 없는 값은 기본으로 정규화. **순수**.
- `buildListingsQuery(spec: QuerySpec)` → `{ eq: {deal?,region?,type?}, ilikeOr: string[]|null, order: {col,asc}|null }` — '전체'는 eq 제외; q(trim, lower)면 제목/지역/동/유형/tags 필드별 ilike OR; 정렬키→{price_num desc/asc | roi desc | none}. **순수** — Supabase 호출은 queries 레이어가 이 스펙으로 수행. (검색 대소문자 무시 = ilike + lower)
- `roiText(roi: number): string` → roi>0 ? `연 {roi.toFixed(1)}%` : `—`.
- `priceLabelDetail(deal, price_text)` → `{deal}가` + price_text.
- `dealBadge(deal): {bg:string}` → 매매#0C2340/전세#1C5DDA/월세#0E9F6E.
- `areaText(area, floor)` → `{area}㎡ · {floor}`.
- `detailSpecs(l: Listing): {k,v}[]` (8행, beds=0→'오피스/원룸', roi=0→'해당 없음').
- `detailPoints(l: Listing): string[]` (3개, tags[1] 없으면 '우수한 생활 인프라', roi=0 분기).
- `buildChart(basePrice: number)` → `{ line, area, dots[], xlabels[], grid[], viewBox, cur }` (원본 공식: months 12, `base*(0.94+0.012*i+0.018*sin(i*0.9))`, 좌표계 760×300, dots i%2===1, xlabels i%2===0, grid 5선). **순수·결정적**.
- `kpiRules(region: Region)` → `[{label:'전월 대비',value,color}, {label:'전국 평균 대비',value:price>15?'높음':'보통'}, {label:'거래 활발도',value:change>1.5?'활발':'보통'}]`.
- `aggregateStats(listings, regions)` → hero 통계(평균 roi, 지역 수 등) — AD3.
- `barHeight(price, max)` → `24 + (price/max)*150`.

### data (`src/lib/queries/`)
- `getListings(spec)` → buildListingsQuery로 Supabase select. 반환 `{rows, count}`. 실패 throw → 페이지에서 ErrorRetry.
- `getListingById(id)` → `.eq('id',id).maybeSingle()`; null이면 호출부에서 `notFound()`.
- `getSimilar(region, excludeId)` → 같은 region, id≠, limit 3.
- `getRegions()` / `getGuides()` / `getGuide(id)`.
- `getSaved(userId)` → number[] (listing_id 목록).
- `toggleSave(listingId)` *(server action)* — 세션 확인(없으면 redirect /login?returnTo). 있으면 saved_listings에 있으면 delete, 없으면 insert. revalidate.

### 컴포넌트 (props/상태/핸들러 요약)
- `<ListingCard listing isSaved>` — 카드 전체 `<Link href=/listings/{id}>` + 우상단 `<HeartButton listingId isSaved>`(absolute, stopPropagation 불필요한 형제 구조). 표시값은 format.ts.
- `<HeartButton listingId isSaved>` *(client)* — `aria-pressed={isSaved}`, 클릭 시 toggleSave action; 비로그인 응답이 redirect면 /login 이동.
- `<FilterPanel spec>` *(client)* — 입력 변경 → `router.replace`로 URL 갱신(검색은 300ms debounce). 활성 칩 스타일.
- `<SortSelect value>` *(client)* — onChange → URL `?sort=`.
- `<PriceChart data>` — chart.ts 결과를 SVG로(viewBox, path, dots, grid, labels).
- `<RegionBars regions selected>` *(client)* — 막대 클릭 → `?region=`.
- `<GuideOverlay guide onClose>` *(client)* — `role=dialog` `aria-modal`, mount 시 focus-trap + `document.body` scroll-lock, ESC/배경클릭 close, 본문 클릭 stopPropagation, close 시 트리거 포커스 복귀.
- `<MapPins regions selected>` *(client)* — 절대 % 핀, 클릭 → `?region=`.
- `<AuthForm mode returnTo>` *(client)* — 이메일+비번 폼(zod 검증), 소셜 버튼(Google/Kakao → `signInWithOAuth`), 에러 인라인.
- `<Header session savedCount>` — nav 활성(usePathname), 로그인 시 로그아웃·배지, 비로그인 로그인 링크.

## 5. Behavior spec (전수 — 02-resolved-spec Cases와 1:1)
- **검색/필터/정렬:** parseListingParams→buildListingsQuery→getListings. '전체'=조건 제외, q는 5개 필드 ilike OR(대소문자 무시, tags 포함, 경계-거짓매칭 없음), 정렬 4종(roi=0 최하단, tie=id asc). 결과 0→EmptyState, 실패→ErrorRetry, 로딩→Skeleton. URL이 진실(refresh/공유/딥링크 일관). [C1–C27, C21–C24]
- **카드:** 본문 클릭→상세 라우트, 하트→toggleSave(형제 button, aria-pressed, 키보드). roi/area/deal 표시 포맷. [C28–C34]
- **상세:** 유효 id→8행 표(beds·roi 분기)+포인트(tags/roi 분기)+사이드(가격 32px, 수익률/면적 분할, 상담=no-op AD12, 하트). 없는 id→notFound 404. 유사매물 ≥1→최대 3, 0→섹션 숨김. 뒤로가기→목록(URL 필터 보존). [C35–C43]
- **관심/인증:** 로그인 하트→DB upsert/delete, 전역 동기(헤더 배지/카드/상세/마이). 비로그인 하트·/mypage→/login(returnTo). RLS로 본인 행만. 로그인/회원가입(이메일+비번 검증·중복·실패 인라인), 소셜(OAuth 콜백, provider 미설정 안내), 로그아웃→/. 세션 만료→401→/login. [C44–C58]
- **시세:** ?region 선택(칩/막대 클릭→URL), buildChart 12개월, KPI(price 기준 통일 AD2, 전월대비 색, 규칙), 막대(활성색/높이/transition). [C59–C65]
- **가이드/오버레이:** 피처드+6그리드, 카드→모달(role=dialog, ESC/배경/✕ close, 본문 stop, scroll-lock, focus 복귀). [C66–C72]
- **지도:** placeholder + 8핀(활성/비활성 색·z), 핀·행 클릭→?region, "상세 시세 분석"→/prices?region. [C73–C76]
- **셸/홈/반응형:** nav 활성(detail/mypage 무강조), 로고→/, 정적 푸터, 홈 시안 A(검색 제출→/listings?q, 빠른칩→?region), 유체 반응형. [C77–C83]

## 6. Dependencies / integration points
- `next`, `react`, `typescript`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`(폼 검증), `vitest`+`@testing-library/*`(로직/컴포넌트 단위), `@playwright/test`(E2E/스크린샷).
- Supabase 프로젝트: `zvbysnzonvgsgtwmzvqi.supabase.co`. 환경변수 `.env.local`(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY). **키는 문서/코드 평문 금지.**
- 소셜 provider(Google/Kakao)는 Supabase 콘솔 설정 필요 → F1.
- 마이그레이션/시드 적용(`supabase db push`/SQL editor) → 구현 단계.

## 7. Out of scope / open (→ deferred.md)
- F1: 소셜 OAuth provider 콘솔 설정(Google/Kakao). — blocked-on 설정.
- F2: 실 지도 SDK(Kakao/Naver) 연동. — placeholder로 대체 중.
- F3: 실 매물 이미지/가이드 커버 에셋. — 그라데이션 placeholder.
- F4: 상담 신청 백엔드/폼. — no-op 버튼(AD12).
- F5: 실 시세 시계열 테이블(현재 합성식 AD9). 
- F6: 마이그레이션/시드의 실제 Supabase 적용 + GREEN 구현(이번 docs scope 외 — RED 테스트 통과시키기).
- (Gate 1 이후 미해결 gap 없음.)
