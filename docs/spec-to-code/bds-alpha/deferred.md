# Deferred & Blocked — 부동산알파 (bds-alpha)

| ID | Item | Origin | Reason | Revisit when | Links | Status |
|----|------|--------|--------|--------------|-------|--------|
| F1 | 소셜 OAuth provider(Google·Kakao) 설정 | P3 결정5 | blocked-on Supabase 콘솔 설정 | 콘솔에서 provider 등록 시 | design §6, C55 | open |
| F2 | 실 지도 SDK(Kakao/Naver) 연동 | spec/AD7 | out-of-scope(이번 docs) | 지도 기능 정식화 시 | design MapPins, C73 | open |
| F3 | 실 매물 이미지·가이드 커버 에셋 | spec | out-of-scope | 에셋 확보 시 | C30, C66 | open |
| F4 | 상담 신청 폼/백엔드 | AD12 | out-of-scope | 상담 기능 착수 시 | C35(상담버튼) | open |
| F5 | 실 시세 시계열 테이블(현재 합성식) | AD9 | out-of-scope | 실거래 시계열 확보 시 | chart.ts, C59 | open |
| F6 | GREEN 구현 + 마이그레이션/시드 Supabase 적용 | docs scope | postponed(이번 run은 RED까지) | 다음 개발 단계 | 전체 RED 테스트 | done(이어서 구현·적용 완료) |
| F7 | 태그 **부분일치** 검색 | review R4 | blocked-on PostgREST 한계(text[] ilike 불가) | RPC/생성컬럼 도입 시 | listingsQuery.ts | open |
| F8 | 없는 매물 **HTTP 404 상태코드** | review/verify | blocked-on Next force-dynamic 스트리밍 한계(상태 200 커밋) | 미들웨어 존재확인 or PPR 안정화 시 | listings/[id], not-found.tsx | open |

### F6 · GREEN 구현 + Supabase 적용 (docs→build 핸드오프)
- **Where:** 빈 프로젝트(`/Users/luke/Desktop/bds-alpha`). 설계 `03-design.md §2`의 파일 트리 전체.
- **What's missing:** 모든 source/컴포넌트 구현, Supabase 테이블/RLS/시드 적용(`supabase/migrations/0001_init.sql`, `seed.sql`), `.env.local` 설정.
- **Done when:** `04-test-doc.md`의 RED 테스트가 전부 GREEN이 되고, Playwright 시각 검증 통과, 리뷰 루프 통과.
- **Stub now:** 코드 없음(테스트만 존재 → import 미해결로 RED). 다음 run은 `/spec-to-code-frontend`(또는 fullstack)로 testsApproved부터 이어서.

### F7 · 태그 부분일치 검색 (blocked-on PostgREST)
- **Where:** `src/lib/listingsQuery.ts` — 현재 tags는 `tags.cs.{q}`(완전 태그 일치). '한강뷰' 검색 OK, '한강'(부분)은 미매칭.
- **What's missing:** `ANY(tags) ILIKE '%q%'` 부분일치. PostgREST `.or()` 문자열로는 배열 요소 ilike 불가.
- **Done when:** Postgres RPC(함수) 또는 `tags_text` 생성컬럼(예: `array_to_string(tags,' ')`) 도입 후 부분일치 쿼리로 교체. 단, 필드경계 거짓매칭(C9) 회피를 위해 tags 전용 컬럼이어야 함.
- **Stub now:** 완전 태그 일치(검증됨). Decision 7의 "부분일치"에서 tags만 예외.

### F8 · 없는 매물 HTTP 404 상태코드 (blocked-on Next 한계)
- **Where:** `src/app/listings/[id]/page.tsx`의 `notFound()` → `not-found.tsx`. 전용 not-found 페이지는 정상 렌더(함수적 404, e2e T66 검증)되나, 프로덕션 force-dynamic 스트리밍에서 응답 상태가 200으로 커밋됨.
- **What's missing:** 진짜 404 HTTP 상태(SEO·크롤러용).
- **Done when:** (a) 미들웨어에서 id 존재 사전 확인 후 404 응답, 또는 (b) Next PPR/렌더 모델 변경으로 notFound 상태가 스트리밍 전에 커밋되는 시점.
- **Stub now:** notFound() 유지(사용자에겐 정상 404 페이지 노출). 상태코드만 미해결.

### F1 · 소셜 OAuth provider (blocked-on 설정)
- **Where:** `src/components/AuthForm.tsx`(소셜 버튼), `src/app/auth/callback/route.ts`.
- **What's missing:** Supabase 콘솔에서 Google·Kakao provider 활성화 + redirect URL 등록.
- **Done when:** provider 등록되면 `signInWithOAuth` 동작, C55 테스트 un-skip.
- **Stub now:** 소셜 버튼은 클릭 시 "준비 중" 안내(provider 미설정 graceful).
