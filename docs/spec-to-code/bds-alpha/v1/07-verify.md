# Verify — 부동산알파 (bds-alpha)   date: 2026-06-25

## Suite
- runner: vitest 2.1.9 (node + jsdom) · @vitest/coverage-v8
- e2e: @playwright/test, 시스템 Chrome, **라이브 Supabase**(zvbysnzonvgsgtwmzvqi), 프로덕션 빌드(`next start`)
- 결과: **vitest 47/47 pass** · **e2e 30 pass / 1 skip** · `tsc --noEmit` ✅ · `next build` ✅

## Cell coverage (모든 00-grid in-scope cell → case → test)
- 총 in-scope cell: 05-traceability.md의 행 전체. **uncovered cell: 0** (전부 ≥1 테스트).
- deferred(빈칸 아님, 의식적 보류): auth·social provider(F1), map real-SDK(F2), 상담(F4), tags 부분일치(F7), 404 상태코드(F8).
- 정방향: resolved-spec C1–C83 전부 grid cell에 매핑(누락 0). 역방향: 모든 cell이 테스트 보유.

## Conformance (각 cell이 실제로 단언되는가 — "통과"가 아니라 "회귀 시 실패하는가")
| 영역 | cell 예 | test | 실제 단언? | verdict |
|---|---|---|---|---|
| 검색 per-field+tags | search·tags-match | T20 | tags 빠지면 한강뷰→0건으로 실패함(라이브 2건 확인) | ✅ |
| 검색 경계 거짓매칭 제거 | search·no-cross-boundary | T25 | 각 조건이 단일 필드 참조 단언 | ✅ |
| 주입 방지 | (R1) | 라이브 q='강남,역삼'→무에러 빈상태 | 정규화 없으면 or() 깨짐 | ✅ |
| 정렬 roi=0 최하단 | sort·roi0-bottom | T34 | roi desc 단언 | ✅ |
| 필터 URL 생존 | listings·refresh-persist | T59 | reload 후 활성칩+개수 동일 단언 | ✅ |
| 404 not-found | detail·404 | T66 | not-found 페이지 렌더 + 정상상세 부재 단언(상태코드는 F8) | ✅(함수적) |
| 유사매물 0 숨김 | detail·similar-hidden | T67 | 섹션 heading 부재 단언 | ✅ |
| 뒤로가기 필터보존 | detail·back-preserve | T68 | back 후 deal/region 쿼리 단언 | ✅ |
| 하트 a11y+토글 | card·heart-aria | T55/T56 | aria-pressed 토글+키보드+상세이동 안 함 단언 | ✅ |
| 비로그인 하트→login | saved·anon-redirect | T57 | /login 리다이렉트 단언 | ✅ |
| 마이페이지 가드 | auth·mypage-redirect | T82 | 비로그인 /mypage→/login 단언 | ✅ |
| 로그인→returnTo | auth·login-success | T77 | returnTo 복귀+로그아웃 버튼 단언(라이브 계정) | ✅ |
| RLS 본인행만 | saved·rls | 라이브 curl | anon saved_listings→[] 확인 | ✅ |
| 오버레이 a11y | overlay·a11y | T74 | scroll-lock+focus-trap+포커스복귀 단언 | ✅ |
| 시세 동기 | prices·region-sync | T70 | 지역선택→차트(path2)+KPI+URL 단언 | ✅ |
> spec-verifier 대체: 각 테스트가 "동작 부재 시 실패"하도록 작성됨(RED→GREEN 전환을 실제로 관찰: 검색 버그는 RED로 노출 후 수정으로 GREEN). 항상-green 트리비얼 테스트 없음.

## Coverage 수치 (정직 보고)
- **로직 코어**(`src/lib` 순수: chart/format/listingsQuery/stats): **line 96% / branch 93% / func 100%** (vitest).
- **정석 분모**(`src/**` 전체, all:true): vitest line 8.9% / branch 61% — 낮은 이유는 UI/페이지/데이터 레이어가 **e2e로 검증**(vitest 미계측)되기 때문. 컴포넌트 렌더 유닛은 미작성(의식적, e2e로 대체).
- **행동(셀) 커버리지: 100%** (in-scope). **e2e 시나리오: 30** (전 화면+인증+RLS).

## Traceability — TODO/empty 없음
- 05-traceability.md 전 행 ✅(in-scope). deferred는 별도 표기(빈칸 아님).

## Logic/UI separation
- `src/lib/*` 순수 로직에 React/Next/Supabase import 없음(쿼리빌더·포맷터·차트 전부 순수, 유닛 직접 호출). 데이터 접근은 `lib/queries`, UI는 thin. 분리 준수 확인.

## Review
- 리뷰 2라운드(r1 17건 → 15 fix·2 reject), 회귀 0, reviewApproved.

## Result
- **pass — Gate 2 준비 완료.** 미해결 in-scope 항목 없음. 잔여는 deferred F1·F2·F4·F7·F8(전부 revisit 조건 명시).
