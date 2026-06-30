# Change Log — 부동산알파 (bds-alpha)

## 2026-06-30 · update v4 — done — 투자 추천 시뮬레이터
### 추가
- `/invest` 투자 추천: 보유 자본 + 대출 + 유형(갭투자/실거주) 입력 → 진입 가능 **지역 + 개별 매물** 추천(실거래 갭·시세 기반).
- 순수 로직 `invest.ts`(취득세 간이·필요자본·예산 매칭) + 클라 컴포넌트 InvestSimulator(브라우저에서 region_gap·listings 조회·계산). 헤더 nav '투자추천' 추가.
- 인사이트: 지역 median으론 비싼 구도 싼 개별 매물은 갭이 작아 추천됨.
### 테스트/회귀
- vitest 74/74(+7 invest) · e2e 36 pass/1 skip(+INV1/INV2) · 무회귀.


## 2026-06-30 · update v3.2 — done — 갭/전세가율 · 수집 자동화 · 매물 실데이터
### 추가
- **갭/전세가율**: 전월세 실거래 수집(rents 107k건) + region_gap RPC + 시세 화면 '갭 투자 분석'(전세가율 순 랭킹). 클라이언트 컴포넌트(GapAnalysis)로 분리해 시세 칩 상호작용과 독립.
- **시세 평활(0005)**: 대표평형 60~85㎡ + 3개월 이동평균(차트·KPI 노이즈 완화).
- **수집 자동화(#3)**: GitHub Actions(.github/workflows/ingest.yml) 주간+수동, ingest 스크립트 최근 3개월 기본.
- **매물 실데이터(#4)**: listings를 실거래 기반으로 교체(seed-listings-from-tx, 43건, 광진구 1건). 기존 목록/상세/검색/필터/저장 UI 그대로 실데이터 동작.
### 테스트/회귀
- vitest 67/67 · e2e 34 pass/1 skip(+GAP1). 하이드레이션 타이밍 대응(필터 클릭 retry). 무회귀.
### 비고
- 서버 컴포넌트에 무거운 집계 섹션을 추가하면 동일 페이지 클라 상호작용이 깨지는 현상 → 보조 분석은 클라 로드로 분리.


## 2026-06-30 · update v3 — done — 국토부 실거래가 연동(실 시세·평가손익)
### 추가
- 국토부 아파트 매매 실거래가 OpenAPI 수집 파이프라인(`ingest-transactions.mjs`) → `transactions` 26,076건(2025-05~2026-05)
- 집계 RPC(중위값): `region_price_summary`/`region_series`/`region_area_median`
- 시세 화면·홈 통계·지도·막대 전부 **실데이터**로 교체, 보유 자산 **평가손익(현재 추정가 ±%)** 표시
### 테스트/회귀
- vitest 67/67(+5: buildSeriesChart·estimatePL) · e2e 33 pass/1 skip · 무회귀. 라이브 검증.
### 다음
- 전월세 실거래 수집 → 갭/전세가율 · 시세 평활(평형대 필터) · 수집 자동화


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
