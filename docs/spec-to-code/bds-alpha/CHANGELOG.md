# Change Log — 부동산알파 (bds-alpha)

## 2026-06-30 · update v2 — done — 내 집 등록(보유 자산 관리)
### 추가
- `properties` 테이블 + RLS(본인 행만) · 마이페이지 '내 보유 자산' 섹션(등록/수정/삭제)
- 순수 로직 `property.ts`(검증·가격포맷·보유기간) + 서버 액션 CRUD + 폼/목록 컴포넌트
### 결정
- 자유입력 + 지역 8개 선택 · CRUD 전부 · 마이페이지 섹션 · 손익은 실거래가 연동(v3) 후
### 테스트/회귀
- vitest 62/62(+15) · e2e 33 pass/1 skip(+my-assets 3) · 무회귀. 라이브 Supabase 검증.
### 다음
- v3: 공공데이터포털 실거래가 API 연동 → 평가손익·시세비교·갭/상승 분석


## 2026-06-23 · fresh (docs scope) — done (Tests 게이트 정지)
### 한 일
- Phase 1–6 완료: 정규화 → gap 그리드(인라인+자가 critic; fan-out은 인프라 장애로 대체) → Gate-1 승인 → 설계 → RED 테스트.
- Phase 3에서 데이터=**Supabase**(Auth+DB, 서버사이드 쿼리, 사용자별 saved, 404, /login 리다이렉트)로 확정 → 계약이 풀스택으로 확장. docs scope는 유지.
- 산출물: 00~05 문서 + RED 테스트(`src/lib/__tests__/*` 3개, `e2e/*` 3개). 90개 테스트(T1~T90), 모든 grid cell 매핑.
- testsApproved 미설정(구현 차단 유지). active:false로 종료.
### 다음(GREEN)
- 툴체인 설치 + 마이그레이션/시드 적용 + 구현으로 RED→GREEN, 이후 리뷰/검증/Gate2.

## 2026-06-23 · fresh (docs scope) — (계획)
- 초기 문서화: 디자인 핸드오프(HTML 디자인 레퍼런스 + README)를 대상으로 spec-to-code 문서 흐름의 Phase 1–6 실행.
- 산출물: `00-behavior-grid.md`, `01-working-spec.md`, `02-resolved-spec.md`, `03-design.md`, `04-test-doc.md`, `05-traceability.md`(draft) + 실패하는 RED 테스트 파일.
- 범위: **docs only** — 구현(GREEN)은 하지 않음. 후속 개발자가 RED 테스트를 통과시키며 구현.
- 대상 스택(설계 기준): Next.js(App Router) + TypeScript + 클라이언트 컴포넌트, Vitest(로직 단위) + Playwright(UI 동작/스크린샷). 빈 프로젝트에서 시작.
