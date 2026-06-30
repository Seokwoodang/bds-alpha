# v3 — 국토부 실거래가 연동 (실 시세 · 평가손익)

더미 시세를 **국토교통부 아파트 매매 실거래가(공공데이터)** 로 교체하고, 보유 자산 **평가손익**을 산출.

## 데이터 파이프라인
- 출처: 국토교통부_아파트 매매 실거래가 상세 OpenAPI (`apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev`). **호출 시 브라우저 User-Agent 필수**(기본 UA는 WAF 차단).
- 수집: `scripts/ingest-transactions.mjs` — 8개 구(법정동코드) × 월별 XML 조회 → 파싱(해제건 제외) → `transactions` 적재. 멱등(on conflict do nothing).
- 적재 결과: **26,076건** (2025-05 ~ 2026-05).
- 키는 `.env.local`의 `DATA_GO_KR_API_KEY`(gitignore). 코드/깃엔 없음.

## 스키마/집계 (`0003_transactions.sql`, `0004_price_rpc.sql`)
- `transactions`(region·lawd_cd·apt_name·dong·deal_amount(만원)·area·floor·build_year·deal_date·cdeal_type). public read RLS.
- RPC(중위값/억): `region_price_summary()`(지역 최신월 중위가+전월대비%), `region_series(region)`(13개월 중위 시계열), `region_area_median(region, area)`(면적±15% 최근3개월 중위가 — 평가손익용). 전부 `security definer` + anon/auth execute.

## 앱 변경
- `getRegions()` → regions 표(이름·순서)에 **실거래 RPC 시세·변동률 병합**(데이터 없으면 더미 fallback). → 홈 통계·지도·시세·막대 **전부 실데이터**(다운스트림 코드 무변경).
- 시세 화면 → `getRegionSeries` + `buildSeriesChart`(실 시계열). 캡션 "국토부 실거래 중위가".
- 마이페이지 보유 자산 → `getRegionAreaMedian`로 **현재 추정가 + 평가손익(±억/±%)** 표시(`estimatePL`).

## 테스트
- 유닛 +5: `buildSeriesChart`(2), `estimatePL`(3). vitest **67/67**.
- e2e **33 pass/1 skip** — 무회귀(실데이터로 prices/home/map 정상).
- 라이브 검증: 강남 27.0억(+1.1%)·시계열 13개월·평가손익(매입 22억→추정 30억 +36.4%) 확인.

## 한계/다음
- 시세=전 평형 중위가라 월별 변동 큼(평형대 필터·이동평균으로 평활 가능 — 후속).
- **갭/전세가율**: 전월세 실거래 API 수집 추가하면 가능(키 공용, F-gap).
- 수집은 수동 스크립트 — 주기 자동화(cron/Edge Function)는 후속.
