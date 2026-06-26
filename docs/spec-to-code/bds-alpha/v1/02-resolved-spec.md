# Resolved Spec — 부동산알파 (bds-alpha)
source spec: ../source/ (README + 부동산알파.dc.html + ListingCard.dc.html)   resolved: 2026-06-23
scope: **docs** (Phase 1–6, 구현 없음 — RED 테스트까지). 단, Phase 3에서 데이터 백엔드가 **Supabase**로 확정되어 사실상 풀스택 계약 — 문서는 프론트 + Supabase 데이터/인증 계약을 모두 명세한다.

## Scope
부동산알파 7개 화면(홈·매물목록·매물상세·시세분석·가이드·지도·마이페이지) + 재사용 ListingCard + 가이드 리딩 오버레이를 **Next.js(App Router) + TypeScript + Supabase**로 재구현하기 위한 설계·테스트 문서. 데이터(매물/지역시세/가이드)는 Supabase 테이블, 검색·필터·정렬은 서버사이드 Supabase 쿼리, 관심매물은 로그인 사용자별 Supabase 테이블, 인증은 Supabase Auth(이메일+비밀번호 및 소셜). 매물 사진·지도는 플레이스홀더(실 SDK/이미지는 deferred). 디자인 토큰/타이포/인터랙션은 hifi 확정값 그대로.

**범위 외(이번 docs run):** 실제 구현(GREEN), Supabase 프로젝트에 테이블/RLS/시드 적용(마이그레이션은 설계로 명세하되 적용은 후속), 실 지도 SDK, 실 매물 이미지, 상담 신청 백엔드, 관리자/시드 콘솔, 애널리틱스.

## Decisions (gap → resolution)
| # | Gap (category) | Question | Decision | Severity |
|---|----------------|----------|----------|----------|
| 1 | nav/persist (ROUTE-1/2) | 필터·검색·정렬·선택지역 상태 위치 | **URL 쿼리**로 노출(공유·딥링크·새로고침 생존). 라우트별 쿼리 파라미터가 진실 원천 | BLOCKER |
| 2 | states/data (X5) | 데이터 공급 방식 | **Supabase**(async, 서버사이드 쿼리). loading/error/empty 상태 전부 설계·테스트 대상 | BLOCKER |
| 3 | flag (HOME-1) | 홈 hero 시안 | **시안 A 고정**(분할형). 토글·variant 상태 제거 | BEHAVIORAL |
| 4 | nav/a11y (GUIDE-1/2) | 가이드 오버레이 | **클라이언트 모달** + ESC·focus-trap·body scroll-lock·`role=dialog`. URL 변화 없음 | BEHAVIORAL |
| 5 | auth (X7) | 인증 범위 | **Supabase Auth 포함**. 이메일+비밀번호 **및 소셜(Google·Kakao)**. 로그인/회원가입/로그아웃 | BLOCKER |
| 6 | persist (MY-4) | 관심매물 저장 위치 | **Supabase 테이블 `saved_listings`**(사용자별, RLS). 익명 저장 없음 | BLOCKER |
| 7 | input (LIST-1/2/3) | 검색·필터·정렬 | **서버사이드 Supabase 쿼리**. 검색 = 제목·지역·동·유형·**tags** 필드별 부분일치(ilike), 영문 대소문자 무시. 원본 concat 경계-거짓매칭 제거 | BEHAVIORAL |
| 8 | error (ROUTE-3/DET-1) | 없는 매물 id 딥링크 | **`notFound()` → 404** 전용 페이지 | BEHAVIORAL |
| 9 | nav (Y축) | 비로그인 하트/마이페이지 | **`/login` 리다이렉트**(returnTo 보존, 로그인 후 복귀) | BEHAVIORAL |
| 10 | empty (DET-2) | 유사매물 0개 | **섹션 숨김**(헤딩까지 미표시) | BEHAVIORAL |

## Assumed defaults (trivial/관례 — 사용자 veto 가능)
- **AD1 (CARD-1, a11y):** ListingCard를 **중첩 인터랙티브 제거** 구조로 재구성 — 카드 전체는 상세로 가는 링크(`<a>`/clickable), 하트는 그 위에 겹치는 **별도 `<button aria-pressed>`**. (button 안 clickable span 금지)
- **AD2 (PRICE-6):** 시세 KPI 다크카드의 "평균 매매가"는 **regions 테이블의 `price` 기준으로 통일**(차트 마지막 점 cur과 라벨 불일치 제거). 차트는 별도 시계열.
- **AD3 (HOME-5):** hero 플로팅 통계 카드(강남 24.0억 ▲2.3% / 평균 수익률 3.8%)와 공통 카피의 통계 수치는 **regions/listings 집계에서 파생**(하드코딩 대신 실제 데이터로 계산; 강남 24.0억은 regions에서, 3.8%는 listings roi 평균). 불일치 시 데이터가 진실.
- **AD4 (HOME-2/3/4):** 홈 검색 제출은 q가 비어도 `/listings`로 이동(전체). 입력 q는 `/listings?q=` 로 전달. 빠른 지역 칩은 `/listings?region=X` (다른 필터 미설정 상태로 이동).
- **AD5 (LIST-5):** 정렬 동률은 id 오름차순 안정 정렬. 수익률순에서 roi=0(전세)은 최하단. 거래유형 혼합 정렬 경고 없음(요청대로 동작).
- **AD6 (LIST-4):** 서버사이드 검색은 입력 **300ms debounce** 후 쿼리(왕복 최소화). URL은 debounce 후 갱신.
- **AD7 (MAP-1/2):** 지도는 **패턴 플레이스홀더 + 가격 핀**으로 구현, 실 지도 SDK는 **deferred(F)**. 핀은 절대 % 위치 유지, 작은 화면 겹침 허용(개선 deferred).
- **AD8 (MY-2):** 마이페이지 "최근 본 지역"은 **selRegion 프록시**(별도 조회기록 추적 없음).
- **AD9 (PRICE-1/3):** 시세 차트 12개월 시계열은 **원본 합성식 유지**(regions.price 기반 결정적 생성) — 실 시계열 테이블은 deferred. KPI 임계 규칙(전국평균 대비 price>15→높음, 활발도 change>1.5→활발) 원본 유지.
- **AD10 (ROUTE-5/6/7/8):** detail·mypage·login에서 nav 활성 항목 없음(매물 상세는 '매물' 약하이라이트 없이 무강조). 헤더 로그인 버튼 = 비로그인 "로그인"(→/login), 로그인 "로그아웃". 푸터 링크 = **정적 no-op(`#`)**. savedCount 배지는 로그인 시 항상 표시(0이면 "0"), 비로그인 시 미표시.
- **AD11 (X4/X6/X2):** i18n 미적용(한국어 단일), 애널리틱스/로깅 없음, 반응형은 순수 유체(명시 breakpoint 없음, 헤더 nav flex-wrap).
- **AD12 (DET-3):** 상세 "상담 신청하기" = 이번 범위 no-op 버튼(클릭 시 토스트 "준비 중" 또는 비활성). 백엔드 연동 deferred(F).
- **AD13 (소셜 provider):** Google·Kakao OAuth는 코드/설계로 명세하되, **Supabase 콘솔 provider 설정**은 적용 단계 의존 → deferred(F) 설정작업으로 기록.
- **AD14 (X1, SSR):** 인증 세션은 `@supabase/ssr` 미들웨어로 서버/클라 동기화. saved 등 사용자별 데이터는 서버에서 세션 기반 조회(하이드레이션 불일치 방지).

## Supabase 데이터 계약 (설계 기준 — 상세 SQL은 03-design.md)
- **테이블:** `listings`(매물 9 시드), `regions`(지역시세 8 시드), `guides`(가이드 6 시드, body는 text[]), `saved_listings`(user_id, listing_id, created_at — 복합 PK/유니크).
- **인증:** Supabase Auth. `auth.users`가 소유자. `saved_listings.user_id → auth.uid()`.
- **RLS:** listings/regions/guides = public select. saved_listings = `user_id = auth.uid()` 행만 select/insert/delete.
- **쿼리:** 목록 = `listings` select + `.eq`/`.ilike`/`.order` (필터/검색/정렬), 상세 = `.eq('id',id).single()`(없으면 notFound), 시세 = regions select + 클라 차트 계산, 가이드 = guides select.
- **환경변수:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(클라), `SUPABASE_SERVICE_ROLE_KEY`(서버 전용·시드). **비밀번호/키는 `.env.local`(gitignore)에만, 문서·코드에 평문 금지.**

---

## Cases (the testable enumeration) — given/when/then

### 검색 / 필터 / 정렬 (서버사이드 쿼리, logic = 쿼리빌더 단위테스트)
- **C1** (search·title): given 매물들, when q가 어떤 매물 제목에만 부분일치, then 그 매물 포함·다른 필드만 맞는 것 제외.
- **C2** (search·region): when q가 지역명에만 일치, then 해당 지역 매물 반환.
- **C3** (search·dong): when q가 동명에만 일치, then 해당 매물 반환.
- **C4** (search·type): when q가 유형(아파트 등)에만 일치, then 해당 유형 매물 반환.
- **C5** (search·tags): when q가 tag('한강뷰')에만 일치, then **해당 매물 반환**(원본과 달리 tags 검색 포함).
- **C6** (search·case-insensitive): when q가 영문 대소문자 다르게 입력, then 대소문자 무시하고 매칭.
- **C7** (search·no-match): when q가 어떤 필드와도 불일치, then 빈 결과(에러 없음) → 빈 상태.
- **C8** (search·empty/whitespace): when q가 ""/공백만, then 전체 통과(필터 미적용).
- **C9** (search·no-cross-boundary): when q가 한 매물의 제목끝+지역시작에 걸치는 문자열, then **매칭 안 됨**(필드별 매칭이라 경계 거짓매칭 없음).
- **C10** (filter·dealType): when dealType=매매, then deal='매매'만; '전체'면 전체.
- **C11** (filter·region): when region=강남구, then region 일치만; '전체'면 전체.
- **C12** (filter·ptype): when ptype=오피스텔, then type 일치만; '전체'면 전체.
- **C13** (filter·combo-AND): when 여러 필터 동시, then 모두 만족하는 매물만(AND).
- **C14** (filter·combo-zero): when 조합 결과 0건, then 빈 상태.
- **C15** (sort·추천순): then 기본(id 순) 순서.
- **C16** (sort·priceDesc): then priceNum 내림차순.
- **C17** (sort·priceAsc): then priceNum 오름차순.
- **C18** (sort·roiDesc): then roi 내림차순, roi=0(전세)은 최하단.
- **C19** (sort·tie-stable): when 동일 키 값, then id 오름차순 안정.
- **C20** (count): when listCount=N, then "총 N개 매물" 표기(숫자 강조).

### URL ↔ 상태
- **C21** (url·filters): when /listings?deal=매매&region=강남구&sort=가격높은순, then 진입 시 해당 필터 적용된 결과.
- **C22** (url·refresh): when 필터 적용 상태에서 새로고침, then 동일 결과 유지(URL이 진실).
- **C23** (url·share): when 필터 URL 복사 후 새 탭, then 같은 필터 결과.
- **C24** (url·prices-region): when /prices?region=성동구, then 성동구 선택 상태로 진입.

### 데이터 페치 상태
- **C25** (data·loading): when 목록 데이터 로딩 중, then 스켈레톤 표시.
- **C26** (data·error): when Supabase 쿼리 실패, then 에러 배너 + "다시 시도"(결과 리스트 비표시).
- **C27** (data·empty): when 쿼리 성공 0건, then 빈 상태(🔍).

### 매물 카드 / 상세
- **C28** (card·roi>0): given roi>0, then "연 N.N%" 표기.
- **C29** (card·roi=0): given roi=0(전세 id3), then "—" 표기.
- **C30** (card·dealStyle): then 매매/전세/월세별 배지 색(#0C2340/#1C5DDA/#0E9F6E).
- **C31** (card·area): then "{area}㎡ · {floor}".
- **C32** (card·click→detail): when 카드 본문 클릭, then /listings/[id] 이동.
- **C33** (card·heart-separate): when 하트 클릭, then 카드 이동 없이 저장 토글만(stopPropagation).
- **C34** (card·heart-a11y): then 하트는 별도 button, `aria-pressed` 저장상태 반영, 키보드(Enter/Space) 동작.
- **C35** (detail·valid): when 유효 id 진입, then 상세 렌더(8행 표 + 투자포인트 3 + 사이드).
- **C36** (detail·invalid): when 없는 id 딥링크, then **404 notFound**.
- **C37** (detail·beds=0): given id7(beds=0), then 방개수 "오피스/원룸".
- **C38** (detail·beds>0): then "{beds}개".
- **C39** (detail·roi=0-spec): given roi=0, then 예상수익률 "해당 없음" + detailPoints[2] 실거주 문구.
- **C40** (detail·points-fallback): given tags[1] 부재, then "우수한 생활 인프라" fallback.
- **C41** (detail·similar≥1): when 같은 지역 다른 매물 ≥1, then 최대 3개 그리드.
- **C42** (detail·similar=0): when 같은 지역 다른 매물 0, then **유사매물 섹션 숨김**.
- **C43** (detail·back): when "← 매물 목록으로", then /listings 복귀(필터 URL 보존).

### 관심 매물 / 인증
- **C44** (saved·authed-add): given 로그인, when 미저장 매물 하트, then saved_listings insert + ♥ + 배지/마이페이지 갱신.
- **C45** (saved·authed-remove): given 로그인+저장됨, when 하트, then delete + ♡.
- **C46** (saved·global-sync): then 헤더 배지·카드·상세·마이페이지 하트가 동일 상태 연동.
- **C47** (saved·anon-redirect): given 비로그인, when 하트 클릭, then /login 리다이렉트(returnTo 보존).
- **C48** (saved·rls): then 사용자는 본인 saved 행만 조회/변경(RLS).
- **C49** (mypage·authed): given 로그인, then KPI 3 + 저장 매물 그리드(saved>0) / 빈 상태(saved=0, "매물 둘러보기").
- **C50** (mypage·anon-redirect): given 비로그인, when /mypage 접근, then /login 리다이렉트.
- **C51** (auth·login-success): when 이메일+비번 정상, then 세션 생성 + returnTo 복귀.
- **C52** (auth·login-fail): when 잘못된 자격, then 인라인 에러, 폼 유지.
- **C53** (auth·signup-dup): when 중복 이메일 가입, then 인라인 안내.
- **C54** (auth·validation): when 빈/형식오류 제출, then 검증 메시지(제출 차단).
- **C55** (auth·social): when 소셜 로그인(Google/Kakao), then OAuth 콜백 후 세션(provider 미설정 시 안내).
- **C56** (auth·logout): when 로그아웃, then 세션 제거 + / 이동 + saved UI 비움.
- **C57** (auth·session-expired): given 세션 만료, when 저장 시도, then 401 → /login.
- **C58** (header·badge): given 로그인, then savedCount 배지 표시(0이면 "0"); 비로그인 미표시.

### 시세 분석
- **C59** (prices·chart): given selRegion, then 12개월 합성 시계열 라인/area/dots(짝수)/grid 5선/xlabels(2칸).
- **C60** (prices·kpi-price): then 다크카드 평균매매가 = regions.price 기준(AD2).
- **C61** (prices·kpi-change): then 전월대비 ±% + up(#0E9F6E)/down(#E5484D) 색.
- **C62** (prices·kpi-rules): then 전국평균대비(price>15→높음) · 활발도(change>1.5→활발).
- **C63** (prices·select-chip): when 지역 칩 클릭, then selRegion 갱신 → 차트·KPI·막대 동기 + URL ?region 갱신.
- **C64** (prices·select-bar): when 막대 클릭, then 동일 지역 선택.
- **C65** (prices·bar-style): then 활성 막대 #1C5DDA, 나머지 #C5D4E8, 높이 24+(price/max)*150, transition.

### 가이드 + 오버레이
- **C66** (guides·list): then 피처드(첫 가이드) + 6개 그리드(커버/카테고리/제목/요약/meta).
- **C67** (overlay·open): when 가이드 카드 클릭, then 모달(dim+blur, article 680, 커버+카테고리+본문 문단).
- **C68** (overlay·close-bg): when 배경 클릭, then 닫힘.
- **C69** (overlay·close-x): when ✕ 클릭, then 닫힘.
- **C70** (overlay·body-stop): when 본문 클릭, then 유지(stopPropagation).
- **C71** (overlay·esc): when ESC, then 닫힘.
- **C72** (overlay·a11y): then `role=dialog`+focus-trap+body scroll-lock; 닫으면 트리거로 포커스 복귀.

### 지도
- **C73** (map·placeholder): then 패턴 배경 + "[지도 영역…]" 안내 + "한강" 라벨.
- **C74** (map·pins): then 8개 가격 핀(활성 #1C5DDA+흰테두리 z20 / 비활성 #0C2340 z10) 절대 % 위치.
- **C75** (map·pin-click): when 핀/리스트 행 클릭, then selRegion 갱신(활성 행 #EAF1FC).
- **C76** (map·to-prices): when "상세 시세 분석 →", then /prices?region=selRegion.

### 공통 셸 / 네비
- **C77** (shell·nav): then 5개 nav 라우트 이동 + 활성 하이라이트(#EAF1FC/#1C5DDA), detail/mypage 무강조.
- **C78** (shell·logo): when 로고 클릭, then /.
- **C79** (shell·footer): then 3컬럼 정적 링크(no-op) + 카피라이트 + 투자유의 문구.
- **C80** (home·variant-A): then 분할형 hero만 렌더(토글 없음), 검색바·빠른칩·공통 하단 3섹션.
- **C81** (home·search-submit): when 검색 제출(q有/無), then /listings(?q=) 이동.
- **C82** (home·quick-chip): when 빠른 지역 칩, then /listings?region=X.
- **C83** (responsive): then 카드 그리드 auto-fill, 헤더 nav flex-wrap, clamp 폰트(모바일/데스크탑).

---
*모든 케이스는 `00-behavior-grid.md`의 셀에서 유래하며, `04-test-doc.md`에서 셀 단위로 테스트화된다(케이스가 여러 등가클래스를 묶으면 클래스별 1테스트). 미해결 gap 0 · 모든 항목 test-shaped.*
