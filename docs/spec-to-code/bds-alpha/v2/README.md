# v2 — 내 집 등록 (보유 자산 관리)

spec-to-code v2 (update). 로그인 사용자가 보유 주택을 등록/관리하는 기능.

## 결정 (사용자 해소)
- 입력: 자유입력 + **지역은 8개 구에서 선택**(시세 연동 키)
- 범위: **등록·수정·삭제(CRUD) 전부**
- 위치: **마이페이지 내 '내 보유 자산' 섹션**
- 평가손익: **지금은 매입정보만**, 손익은 실거래가 연동(v3) 후

## 데이터 (`supabase/migrations/0002_properties.sql`)
`properties(id uuid, user_id→auth.users, name, region, dong?, type, area, purchase_price(만원), purchase_date, memo?, created_at)`
- **RLS: 본인 행만** select/insert/update/delete (`auth.uid() = user_id`).

## 구현
- 순수 로직 `src/lib/property.ts`: `validateProperty`(필수/지역/유형/면적>0/매입가>0/미래일 거부), `formatPriceManwon`, `holdingMonths`/`holdingText`.
- 서버 액션 `src/lib/queries/properties.ts`: `addProperty`/`updateProperty`/`deleteProperty` (세션 필수→비로그인 /login, 서버 재검증, user_id 필터+RLS). 읽기 `propertiesRead.ts`.
- UI `src/components/PropertyForm.tsx`(인라인 검증) + `MyAssets.tsx`(목록/추가/수정/삭제) → `app/mypage/page.tsx`에 섹션 추가, KPI '보유 자산 N' 반영.

## 테스트 (TDD)
- 유닛 `src/lib/__tests__/property.test.ts` — 15개(포맷·보유기간·검증 분기). 
- e2e `e2e/my-assets.spec.ts` — PA1 비로그인 가드 / PA2 등록→표시→수정→삭제 / PA3 검증오류. 라이브 Supabase.
- 회귀: v1 전체 e2e + 유닛 통과(무회귀).

## 검증 결과
- vitest **62/62**(47 v1 + 15 v2) · e2e **33 pass/1 skip**(v1 + my-assets) · tsc/build clean. 라이브 Supabase에서 CRUD·RLS·검증·가드 확인.

## 다음 (v3 후보)
- 실거래가 API(공공데이터포털) 연동 → 보유 자산 **평가손익**, 시세 비교, 갭/상승 분석.
