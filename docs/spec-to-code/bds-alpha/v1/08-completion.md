# Completion — 부동산알파 (bds-alpha)
date: 2026-06-25   status: awaiting Gate-2 approval

## Summary
디자인 핸드오프(HTML 프로토타입 7화면 + ListingCard + 가이드 오버레이)를 **Next.js 15(App Router) + TypeScript + Supabase**로 재구현했다. 매물/지역시세/가이드는 Supabase 테이블, 검색·필터·정렬은 서버사이드 쿼리(URL 쿼리 구동), 관심매물은 로그인 사용자별 테이블(RLS), 인증은 Supabase Auth(이메일+비번 / 소셜은 deferred). 7개 화면·재사용 카드·접근성 모달까지 hifi 디자인 토큰 그대로 구현하고, 유닛 47 + e2e 30(라이브 Supabase)으로 검증했다. 처음엔 "문서까지만" 범위였으나 사용자 요청으로 GREEN 구현·라이브 검증·리뷰까지 완주했다.

## Key decisions made (계약 → 코드)
- URL 쿼리가 필터/정렬/검색/지역의 진실(공유·딥링크·새로고침 생존) — D1
- 데이터 = Supabase(async) → loading/error/empty 상태 구현 — D2
- 홈 = 시안 A 고정 — D3
- 가이드 = 클라이언트 모달(ESC·focus-trap·scroll-lock·role) — D4
- Supabase Auth + 관심매물 DB(RLS) + 비로그인 하트/마이 → /login — D5·D6·D9
- 검색 = 서버 per-field + tags(완전일치) — D7 (tags 부분일치는 F7)
- 없는 id → notFound 페이지 — D8 (HTTP 상태코드는 F8)
- 유사매물 0 → 섹션 숨김 — D10

## Architecture — logic / UI split
- **Logic(순수, vitest 96%):** `src/lib/{format,listingsQuery,chart,stats,cover}.ts` — UI/네트워크 무관.
- **Data:** `src/lib/supabase/{client,server,middleware}.ts` + `src/lib/queries/*` (listings/regions/guides/saved/savedRead).
- **UI(thin):** `src/components/*` + `src/app/**`(서버 컴포넌트로 fetch, 클라 컴포넌트로 상호작용).
- **Auth:** `@supabase/ssr` 미들웨어 세션 동기 + 보호경로 가드.

## How to run & verify
```bash
# 1) 의존성
npm install
# 2) 환경변수 (.env.local — gitignore, 평문 커밋 금지)
#    NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable)
# 3) DB (이미 적용됨): supabase/migrations/0001_init.sql + supabase/seed.sql
# 4) 개발 / 빌드
npm run dev        # 또는: npm run build && npm run start
# 5) 테스트
npm test           # vitest 47/47
npm run e2e        # playwright 30 pass/1 skip (라이브 Supabase + e2e 계정 필요)
```
- e2e 인증 테스트용 확인 계정: `e2e@bds.test` (scripts/create-e2e-user.mjs로 생성됨).

## Test results
- **vitest 47/47** (로직 line 96%/branch 93%) · **e2e 30 pass / 1 skip**(T62→컴포넌트 이전) · tsc/build clean.
- 셀 커버리지 100%(in-scope). 상세 07-verify.md.

## Review loop
- 2라운드(r1 17건 → 15 fix·2 reject), 회귀 0, 승인됨. r1.md·r2.md.
- 라이브 검증 중 발견·수정한 실제 버그 3건: 검색 전면실패(tags 배열 ilike)·뒤로가기 필터유실·필터 stale-snapshot 경합.

## Screenshots (appearance baselines — bless 필요)
`v1/screenshots/`: home · listings · listings-filtered · detail · 404 · prices · guides · guide-overlay · map · login · mypage. (디자인 토큰/레이아웃 일치 확인; 매물사진·지도는 의도된 플레이스홀더)

## Deferred / blocked / residual (deferred.md)
- **F1** 소셜 OAuth provider 콘솔 설정(현재 "준비 중" 안내) · **F2** 실 지도 SDK · **F4** 상담 신청(비활성 stub) · **F5** 실 시세 시계열(현 합성식) · **F7** tags 부분일치 검색 · **F8** 없는 매물 HTTP 404 상태코드(페이지는 정상).
- 보안: Supabase publishable 키는 `.env.local`만(gitignore). DB 비밀번호가 채팅에 노출됐으므로 **로테이션 권장**.
- 참고: `pg`는 스크립트 전용이나 dependencies에 위치(devDependencies 이동 권장).

## Open for approval
- [ ] 스크린샷 baseline bless
- [ ] 커밋 승인 (스킬은 지시 없이는 커밋 안 함 — 현재 git 미초기화 상태)
