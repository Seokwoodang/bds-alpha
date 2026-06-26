# Gap Analysis — 부동산알파 (bds-alpha)
slug: bds-alpha   phase: 2
fan-out: **시도했으나 일시적 인프라(분류기) 장애로 gap-hunter 서브에이전트 spawn이 차단됨** → 스킬의 degrade 경로("agents absent → inline")로 **인라인 전수 열거 + 자가 적대적 완전성 비평**으로 대체. (원래 8개 섹션 fan-out 계획: 셸/라우팅 · 홈 · 목록 · 카드/상세 · 시세 · 가이드 · 지도 · 마이페이지+전역상태. 인프라 복구 시 재실행 제안 — 사용자 선택.)

> 이 그리드는 **스펙 전체의 행동 분해**(gap만이 아니라 happy path 셀 포함)이다. 빈 셀 = 미결정 gap → Gate-1 질문. 모든 데이터/화면은 원본 HTML 로직 기준으로 결정되었거나 GAP으로 표시됨.

## Axis checklist (각 축 명시적으로 체크 또는 N/A)
- [x] **states** — 화면 7종 + 가이드 오버레이 + 빈/결과 상태. 단, 데이터가 정적(로컬 상수)이라 loading/error/offline 상태는 **현재 범위에서 미발생 추정** → GAP-X5에서 확정 필요(정적 번들 vs API).
- [x] **inputs + boundaries** — 검색 q(빈/공백/유니코드/매우김/필드경계 매칭), 필터 3축, 정렬 4종, listing id(유효/무효/타입), saved 배열, selRegion, selGuide. (목록·카드/상세 표에서 전수)
- [x] **roles / permissions** — 인증/로그인 없음 추정(GAP-X7). 모든 화면 비로그인 접근.
- [~] **external-call outcomes** — N/A 추정: 데이터가 로컬 상수면 외부 호출 없음. GAP-X5가 확정하면 ok/empty/error/timeout 축 추가 여부 결정.
- [x] **navigation & persistence** — SPA→Next 라우트 재설계가 핵심 위험. refresh/deep-link/back, URL-state 여부(GAP-ROUTE-1/2/3/4), saved localStorage 영속(GAP-MY-4).
- [x] **concurrency / timing** — 하트 연타, 검색 입력 debounce, 막대/핀 빠른 클릭, 정렬 중 필터 변경. (대부분 동기 로컬 연산 → 경합 낮음)
- [x] **a11y** — 카드 nested-interactive(GAP-CARD-1), 하트 aria-pressed/label, 오버레이 dialog 시맨틱·focus-trap·ESC·scroll-lock(GAP-GUIDE-2), nav 키보드, 차트/플레이스홀더 대체텍스트.
- [x] **i18n** — 한국어 단일, i18n 미적용 추정(GAP-X4).
- [x] **responsive / breakpoints** — 미디어쿼리 거의 없음, auto-fill/flex-wrap/clamp 유체. 지도 핀 절대 % 위치 리사이즈(GAP-MAP-2), 상세 sticky 사이드(GAP-DET wrap).
- [~] **performance limits** — 데이터 9건/8지역/6가이드로 소량 → N/A. 검색 debounce는 trivial.
- [x] **feature flags / rollout** — 홈 variant 토글이 사실상 디자인 탐색 플래그(GAP-HOME-1: 운영 시 제거/고정).
- [x] **security / authz** — 로그인/상담/제휴 등 액션 onClick 미정의(GAP-ROUTE-6, GAP-DET-3). 외부 입력 없음.

> 미체크 박스 없음. `~`(부분/조건부 N·A)는 GAP-X5/X7 확정에 의존 — Gate-1 질문에 포함.

---

## A. 라우팅 · 공통 셸 (state×event / decision)

### A1. Route ↔ state 매핑 (decision table)
| screen (원본) | Next route | 진입 트리거 | nav 활성표시 | 비고 |
|---|---|---|---|---|
| home | `/` | 로고, nav 홈 | 홈 | variant 쿼리?(GAP-HOME-1) |
| listings | `/listings` | nav 매물, 홈 검색/칩, 전체보기 | 매물 | 필터 URL?(GAP-ROUTE-1) |
| detail | `/listings/[id]` | 카드 클릭 | 매물(GAP-ROUTE-5) | 무효 id?(GAP-ROUTE-3) |
| prices | `/prices` | nav 시세, 지도 버튼, 시안C CTA | 시세 | selRegion URL?(GAP-ROUTE-1) |
| guides | `/guides` | nav 가이드, 홈 전체보기 | 가이드 | — |
| map | `/map` | nav 지도 | 지도 | — |
| mypage | `/mypage` | 헤더 관심목록 버튼 | 없음(GAP-ROUTE-5) | 인증?(GAP-X7) |
| (overlay) selGuide | 라우트 아님(전역) | 가이드 카드 클릭 | — | route vs client(GAP-GUIDE-1) |

### A2. 영속/생존 매트릭스 (state × event: refresh / deep-link / back)
| 상태조각 \ 이벤트 | refresh(같은 URL) | deep-link 직접진입 | browser back |
|---|---|---|---|
| screen(현재 라우트) | 라우트로 복원 ✔ | 라우트로 진입 ✔ | 이전 라우트 ✔ |
| saved[] | **GAP-MY-4** (localStorage?) | 동일 | 영향없음 |
| q / dealType / region / ptype / sort | **GAP-ROUTE-1/2** (URL? 휘발?) | **GAP-ROUTE-1** | **GAP-ROUTE-2** |
| selRegion(시세/지도) | **GAP-ROUTE-1/2** | 동일 | 동일 |
| selGuide(오버레이) | **GAP-GUIDE-1** (back로 닫힘?) | **GAP-GUIDE-4** (딥링크?) | **GAP-GUIDE-1** |
| variant(홈 시안) | **GAP-HOME-1** | 동일 | — |
| selId | route param에서 복원 ✔ | **GAP-ROUTE-3**(무효 id) | 이전 ✔ |

### A3. 헤더 요소 (decision)
| 요소 | 동작 | 결정/GAP |
|---|---|---|
| 로고 | → `/` | 결정 ✔ |
| nav 5항목 | 라우트 이동 + 활성 하이라이트 | 결정 ✔ (detail/mypage 활성=GAP-ROUTE-5) |
| 관심목록 버튼 | → `/mypage`, ♡ + savedCount 배지 | savedCount=0 표시?(GAP-ROUTE-8) |
| 로그인 버튼 | onClick 미정의 | **GAP-ROUTE-6** (no-op/placeholder/scope-out) |
| sticky+blur | 스크롤 시 고정 | 결정 ✔ (스크롤 그림자 변화 없음) |
| Footer 링크 12개 | 정적 | **GAP-ROUTE-7** (no-op vs 라우트) |

---

## B. 홈 / 랜딩 (decision)

### B1. variant 선택 (near-blocker)
| 옵션 | 결과 | |
|---|---|---|
| A 고정 | 분할 hero만, 토글 제거 | **GAP-HOME-1 후보(권장)** |
| B 고정 | 중앙 hero만 | 후보 |
| A/B/C 토글 유지 | variant 상태 + 토글 UI 유지 | 후보(디자인 탐색용) |
→ **GAP-HOME-1 (BEHAVIORAL/near-blocker)**: 빈 셀, 사용자 결정.

### B2. hero 검색 제출 (decision table)
| q 상태 | 액션 | 결과 |
|---|---|---|
| q 비어있음 + 검색버튼/Enter | submit | **GAP-HOME-2** (그래도 /listings 이동? 막음?) |
| q 입력됨 + 검색 | submit | /listings 이동 + q 필터 반영(**GAP-HOME-3** 확인) |
| Enter 키 | submit | **GAP-HOME-2** (Enter 핸들링 명시 안 됨) |
| 입력 중(onInput) | q 상태 갱신 | 결정 ✔(실시간) |

### B3. 빠른 지역 칩 (decision)
| 현재 필터 | 칩 클릭(지역 X) | 결과 |
|---|---|---|
| 무필터 | X | {listings, region:X} — q·dealType·ptype·sort 유지(**GAP-HOME-4** 확인: 다른 필터 리셋?) |
| 기존 필터 있음 | X | 동일 — 덮어쓰기만 region |

### B4. 공통 하단 섹션 (decision)
| 섹션 | 데이터 | 동작 | GAP |
|---|---|---|---|
| 추천 매물 4개 | LISTINGS.slice(0,4) | 카드(→상세) + 전체보기(→목록) | 정적 "추천" 유지?(GAP-HOME-6, trivial) |
| 가치 제안 4개 | 정적 | 표시만 | 결정 ✔ |
| 가이드 3개 | GUIDES.slice(0,3) | 카드→오버레이 + 전체보기(→가이드) | 결정 ✔ |
| hero 통계/플로팅 카드 | 하드코딩 값 | 표시 | **GAP-HOME-5** (파생 vs 하드코딩; 3.8%·3,200+ 출처) |

---

## C. 매물 목록 — 검색/필터/정렬 (decision tables, 가장 조밀)

### C1. 검색 매칭 축 (q vs 매물) — equivalence classes
원본: `(title+region+dong+type).includes(q.trim())`. tags **미포함**.
| 클래스 | 예시 q | 원본 동작 | 결정/GAP |
|---|---|---|---|
| 제목에만 일치 | "청담" | 매칭 ✔ | 결정 ✔ |
| 지역에만 일치 | "강남구" | 매칭 ✔ | 결정 ✔ |
| 동에만 일치 | "반포동" | 매칭 ✔ | 결정 ✔ |
| 유형에만 일치 | "오피스텔" | 매칭 ✔ | 결정 ✔ |
| **tags에만** 일치 | "한강뷰" | **미매칭**(tags 비포함) | **GAP-LIST-1** (tags 검색 대상? bug?) |
| 어디에도 불일치 | "zzz" | 빈 배열 → 빈 상태 | 결정 ✔ |
| **필드경계 가로지름** | (title 끝+region 시작 연결) | concat이라 **거짓 매칭 가능** | **GAP-LIST-2** (per-field 매칭으로 교정?) |
| 영문 대소문자 | "Roi"/소문자 | includes 대소문자 구분 | **GAP-LIST-3** (한글無관, 영문 토큰 대소문자) |
| 빈 q | "" | `!q` → 전체 통과 | 결정 ✔ |
| 공백만 | "   " | trim→"" → 전체 통과 | 결정 ✔ |
| 유니코드/이모지 | "🏠" | 미매칭→빈 | 결정 ✔(throw 없음) |
| 매우 긴 q | 1000자 | 미매칭→빈 | 결정 ✔ |

### C2. 필터 조합 (dealType × region × ptype, AND)
| dealType | region | ptype | 동작 |
|---|---|---|---|
| 전체 | 전체 | 전체 | 전체 9건 ✔ |
| 특정 | 전체 | 전체 | deal 일치만 ✔ |
| 전체 | 특정 | 전체 | region 일치만 ✔ |
| 전체 | 전체 | 특정 | type 일치만 ✔ |
| 특정 | 특정 | 특정 | 모두 AND ✔ (0건 가능) |
| 조합 결과 0건 | — | — | 빈 상태 표시 ✔ |
| 조합 결과 정확히 1건 | — | — | 그리드 1카드 ✔ |
> 모든 조합은 "전체=통과, else=equality, AND" 규칙으로 **완전 결정**. 빈 셀 없음.

### C3. 정렬 (filter 결과에 적용)
| sort | 키 | 비고 | GAP |
|---|---|---|---|
| 추천순 | 원본 배열 순서 | 필터만, 재정렬 안 함 | 결정 ✔ |
| 가격높은순 | priceNum desc | | tie 안정성(**GAP-LIST-5**) |
| 가격낮은순 | priceNum asc | | 동일 |
| 수익률순 | roi desc | roi=0(전세 id3) 최하단 | roi=0 배치 확인(**GAP-LIST-5**) |
> priceNum이 거래유형 무관 절대값(전세 11억=110000, 월세 보증금 35000 등) → **이종 거래유형 혼합 정렬 시 의미 왜곡** 가능 → GAP-LIST-5에 포함.

### C4. 결과/카운트/상호작용
| 케이스 | 동작 | GAP |
|---|---|---|
| listCount>0 | "총 N개" + 그리드 | 결정 ✔ |
| listCount===0 | 빈 상태(🔍+문구+유도) | 결정 ✔(문구 원본) |
| q 입력 중 카운트 | 실시간 갱신 | debounce?(GAP-LIST-4, trivial) |
| 나갔다 복귀 | 필터 유지/리셋? | **GAP-ROUTE-1/2** (URL/휘발) |

---

## D. ListingCard + 매물 상세

### D1. 카드 상호작용 (state×event)
| 이벤트 | 동작 | GAP |
|---|---|---|
| 카드 본문 클릭 | → 상세(selId, route) | 결정 ✔ |
| 하트 클릭 | stopPropagation + toggleSave | 결정 ✔ |
| 하트 키보드(Enter/Space) | (원본: span onClick, 키보드 미지원) | **GAP-CARD-1** (nested interactive·키보드·aria) |
| 카드 키보드 활성 | button이면 가능하나 하트 중첩 | **GAP-CARD-1** (마크업 재구성) |
| 하트 연타 | 토글 반복 | 결정 ✔(멱등 토글) |

### D2. 카드 표시 파생 (decision)
| 필드 | 규칙 | 결정 |
|---|---|---|
| roiText | roi>0→"연 N.N%", else "—"(id3) | ✔ |
| dealStyle | 매매#0C2340/전세#1C5DDA/월세#0E9F6E | ✔ |
| heart | saved 포함→♥ else ♡ | ✔ |
| areaText | "{area}㎡ · {floor}" | ✔ |
| cover | 스트라이프 그라데이션 placeholder | ✔(실사진 deferred) |

### D3. 상세 표시 분기 (decision table)
| 필드 | 분기 | 값 |
|---|---|---|
| 방개수 | beds>0 / beds=0(id7) | "{beds}개" / "오피스/원룸" ✔ |
| 예상수익률 | roi>0 / roi=0(id3) | "연 N.N%" / "해당 없음" ✔ |
| detailPoints[2] | roi>0 / roi=0 | 수익률 문구 / 실거주 문구 ✔ |
| detailPoints[1] | tags[1] 존재 / 부재 | tags[1] / "우수한 생활 인프라" ✔(방어적; 현 데이터 전부 2태그) |

### D4. 상세 경계/엣지
| 케이스 | 동작 | GAP |
|---|---|---|
| 유효 id 진입 | 상세 렌더 | ✔ |
| **무효/없는 id 딥링크** | 원본 .find()→undefined→깨짐 | **GAP-ROUTE-3/DET-1** (notFound 404) |
| 유사매물 ≥3 | 3개 | ✔ |
| 유사매물 1~2개 | 그대로 | ✔ |
| **유사매물 0개**(지역 내 단독) | 헤딩+빈 그리드? 섹션 숨김? | **GAP-DET-2** |
| 상담 신청하기 | onClick 미정의 | **GAP-DET-3** (no-op/scope-out) |
| 관심저장 하트 | 전역 saved 토글 | ✔ |
| 뒤로가기 | →/listings, 필터/스크롤 복원? | **GAP-ROUTE-2** |
| sticky 사이드 모바일 | wrap | ✔(유체) |

---

## E. 시세 분석

### E1. 차트/KPI (decision)
| 요소 | 규칙 | GAP |
|---|---|---|
| buildChart 시계열 | `base*(0.94+0.012*i+0.018*sin(i*0.9))`, 12개월 | 합성 유지?(GAP-PRICE-1, 결정성 OK) |
| 라인/area/dots/grid/xlabels | 좌표계 760×300, dots i%2===1, xlabels i%2===0 | ✔ |
| KPI 다크카드 값 | **chart.cur**(12월차 계산값) | **GAP-PRICE-6** (REGIONS.price와 불일치 가능 — 24.0 vs cur) |
| 전월 대비 | REGIONS.change ±%, up/down 색 | ✔ |
| 전국 평균 대비 | price>15→높음 else 보통 | 단순규칙 유지?(GAP-PRICE-3, trivial) |
| 거래 활발도 | change>1.5→활발 else 보통 | 동일 |

### E2. 지역 선택 연동 (state×event)
| 이벤트 | 효과 | GAP |
|---|---|---|
| 지역 칩 클릭 | selRegion=X → 차트·KPI·막대·(지도 핀) 갱신 | ✔ |
| 막대 클릭 | selRegion=X | ✔ |
| selRegion 영속/URL | refresh 시 | **GAP-ROUTE-1/2** |
| 막대 높이 | `24+(price/max)*150`, transition .4s | ✔ |
| 비활성 막대색 | #C5D4E8, 활성 #1C5DDA | ✔ |
| SVG 반응형 | preserveAspectRatio none, width100% | ✔(세로 고정 300) |

---

## F. 투자 가이드 + 리딩 오버레이

| 요소/이벤트 | 동작 | GAP |
|---|---|---|
| 피처드(GUIDES[0]) | 가로 2열, 클릭→오버레이 | ✔(정적 top) |
| 6개 그리드 | 카드 클릭→오버레이 | ✔ |
| 오버레이 열기 | selGuide=id, dim+blur, article 680 | ✔ |
| 배경 클릭 | 닫힘 | ✔ |
| ✕ 클릭 | 닫힘 | ✔ |
| 본문 클릭 | stopPropagation(유지) | ✔ |
| **ESC 키** | (원본 없음) | **GAP-GUIDE-2** (ESC/focus-trap/scroll-lock/dialog role) |
| **back로 닫힘** | route 아님 | **GAP-GUIDE-1** (client modal vs 라우트) |
| 딥링크/공유 | — | **GAP-GUIDE-4** (가이드 URL? trivial-defer 후보) |
| body 문단 렌더 | 4문단 | ✔ |

---

## G. 지도 탐색

| 요소/이벤트 | 동작 | GAP |
|---|---|---|
| 지도 영역 | 패턴 placeholder + "[지도 영역…]" | **GAP-MAP-1** (실 SDK는 deferred, placeholder 구현 확정?) |
| 가격 핀 8개 | 절대 %위치, 활성#1C5DDA+흰테두리 z20 / 비활성#0C2340 z10 | ✔ |
| 핀 클릭 | selRegion=X | ✔ |
| 리스트 행 클릭 | selRegion=X, 활성행 #EAF1FC | ✔ |
| "상세 시세 분석 →" | →/prices (selRegion 유지) | ✔ |
| 핀 리사이즈/겹침 | % 위치 → 작은 화면 겹침 | **GAP-MAP-2** (반응형/겹침 허용?) |
| 좌표 없는 지역 | fallback [50,50] | ✔(방어, 현 8개 전부 존재) |

---

## H. 마이페이지 + 전역 saved

| 요소/이벤트 | 동작 | GAP |
|---|---|---|
| 진입 | 헤더 관심목록 버튼 | ✔ |
| 인증 | 없음 추정 | **GAP-X7** |
| 프로필 헤더 | 정적 "투자자님" | ✔ |
| myStats 관심매물 | saved.length | ✔ |
| myStats 최근 본 지역 | **selRegion**(실제 조회기록 아님) | **GAP-MY-2** (프록시 유지?) |
| myStats 추천매물 | LISTINGS.length | ✔ |
| saved>0 | 그리드(saved 매물) | ✔ |
| saved===0 | 빈 상태(♡+"매물 둘러보기"→목록) | ✔ |
| **saved 시드/영속** | 원본 초기 [4,8] | **GAP-MY-4** (localStorage 영속? 첫 방문 시 [4,8] 시드 vs 빈배열) |

---

## 전역 cross-cutting

| ID | 항목 | GAP |
|---|---|---|
| GAP-X4 | i18n | 한국어 단일, i18n 미적용 확인(trivial) |
| GAP-X5 | **데이터 소스** | 정적 TS 상수(번들) vs API stub → loading/error 상태 존재 여부 결정(**BEHAVIORAL**) |
| GAP-X6 | analytics/logging | out-of-scope 확인(trivial) |
| GAP-X7 | 인증/로그인 | out-of-scope 확인(BEHAVIORAL) |
| GAP-X1 | localStorage SSR 하이드레이션 | saved 클라 전용 읽기, hydration mismatch 방지(설계 항목) |
| GAP-X2 | 반응형 breakpoint | 명시 breakpoint vs 순수 유체 확인(trivial) |
| GAP-X3 | a11y 기준선 | focus/keyboard/dialog/alt — GAP-CARD-1·GUIDE-2로 구체화 |

---

## Branch-complement checklist (모든 "when X" → "not-X")
- [x] q 있음→필터 · q 없음/공백→전체통과 ✔
- [x] dealType/region/ptype 특정→일치 · 전체→통과 ✔
- [x] listCount>0→그리드 · ===0→빈상태 ✔
- [x] saved 포함→♥/그리드 · 미포함→♡ / saved===0→빈상태 ✔
- [x] roi>0→"연%"·점수문구 · roi=0→"—"/"해당없음"/실거주문구 ✔
- [x] beds>0→"N개" · beds=0→"오피스/원룸" ✔
- [x] tags[1] 존재→사용 · 부재→fallback ✔
- [x] 유효 id→상세 · **무효 id→? (GAP-ROUTE-3)**
- [x] 유사매물 ≥1→그리드 · **0개→? (GAP-DET-2)**
- [x] 활성 지역→primary 강조 · 비활성→기본색 ✔
- [x] change≥0→▲up색 · <0→▼down색 ✔
- [x] 오버레이 열림→dim/article · 닫힘→없음 ✔ / 배경클릭→닫힘 · 본문클릭→유지 ✔ / **ESC→? (GAP-GUIDE-2)**
- [x] 검색 제출 q有→필터이동 · **q無→? (GAP-HOME-2)**
- [x] 정렬 추천순→원본 · else→키정렬 ✔
- [x] refresh/back/deep-link 시 상태 생존 · **휘발 → ? (GAP-ROUTE-1/2)**

## Adversarial completeness critic (자가 수행 — 인프라 장애로 fresh agent 대체)
- ran: yes (self) · 발견 및 반영:
  1. **누락 축 발견: "데이터 소스(정적 vs async)"** — 이 축이 loading/error/empty(네트워크) 상태 전체를 좌우. 추가함 → GAP-X5. (가장 중요한 미열거 축)
  2. **누락 셀: prices KPI cur vs REGIONS.price 불일치** — 다크카드는 chart.cur(계산값), 막대/리스트는 REGIONS.price. 같은 지역에 두 값이 다르게 보일 수 있음. 추가 → GAP-PRICE-6.
  3. **누락 셀: priceNum 이종 거래유형 혼합 정렬 의미** — 매매/전세/월세 절대값 혼합 정렬 시 왜곡. GAP-LIST-5에 포함.
  4. **누락 보완: 오버레이 a11y(ESC/focus-trap/scroll-lock/role=dialog)** — 원본 미지원. GAP-GUIDE-2.
  5. **누락 보완: 카드 nested-interactive(button 안 clickable span)** — 유효 HTML/a11y 위반. GAP-CARD-1.
  6. **검증: tags 비검색**이 의도인지 버그인지 — GAP-LIST-1로 사용자 확인 항목화.
- 미해소로 남긴 것: 위 GAP들은 전부 Gate-1 질문(아래)으로 이관. test-shaped 불가 항목 없음(모두 given/when/then 가능).

---

## Open gaps → Gate-1 questions (Phase 3에서 사용자 해소)

**BLOCKER / BEHAVIORAL (반드시 질문):**
- **Q1 (GAP-ROUTE-1/2, nav/persist):** 필터·정렬·검색어·선택지역을 **URL 쿼리로 노출(공유/딥링크/refresh 생존)** vs **컴포넌트 상태(휘발)**? 어느 쪽?
- **Q2 (GAP-X5, states):** 데이터를 **정적 TS 상수로 번들**(→ loading/error 상태 없음) vs **API stub(async)**(→ loading/error 상태 설계 필요)? 
- **Q3 (GAP-HOME-1, flag):** 홈 hero를 **시안 A 고정 / B 고정 / A·B·C 토글 유지** 중?
- **Q4 (GAP-LIST-1+2, input):** 검색을 **원본 그대로(제목+지역+동+유형 연결 includes, tags 제외)** 유지 vs **per-field 매칭 + tags 포함**(경계 거짓매칭 제거)?
- **Q5 (GAP-MY-4, persist):** saved를 **localStorage 영속**? 첫 방문 초기값 **[4,8] 시드 유지 vs 빈 배열**?
- **Q6 (GAP-ROUTE-3/DET-1, error):** 없는 매물 id로 `/listings/[id]` 딥링크 시 → **404 notFound** vs 목록 리다이렉트 vs 안내 메시지?
- **Q7 (GAP-DET-2, empty):** 유사 매물 0개일 때 → **섹션 숨김** vs 헤딩+안내문구?
- **Q8 (GAP-X7 + ROUTE-6 + DET-3 + ROUTE-7, scope):** 인증/로그인, 상담 신청, 푸터 링크 → 이번 범위 **out-of-scope(placeholder/no-op)** 확정? 아니면 일부 포함?
- **Q9 (GAP-GUIDE-1/2, nav/a11y):** 가이드 오버레이 = **클라이언트 모달(ESC·focus-trap·scroll-lock·role=dialog 추가)** vs **라우트(back로 닫힘/딥링크)**?

**낮은 우선순위(기본값 가정·veto 가능) → "Assumed defaults"로 처리:**
- GAP-CARD-1: 카드 마크업을 **중첩 인터랙티브 제거 형태**(카드=링크/clickable, 하트=별도 button, aria-pressed)로 재구성 — a11y 표준.
- GAP-PRICE-6: KPI 다크카드를 **REGIONS.price 기준 통일**(또는 cur 사용 명시) — 일관성 위해 price 기준 가정.
- GAP-HOME-5: hero 통계/플로팅 카드 값은 **하드코딩 유지**(디자인 확정값) — 더미 단계.
- GAP-HOME-2: 빈 q 검색 제출 → **그래도 /listings 이동(전체 표시)**.
- GAP-HOME-3/4: hero q는 listings 필터로 **전달**, 빠른칩은 region만 덮고 나머지 유지.
- GAP-LIST-3: 영문 토큰 검색 **대소문자 무시**(소문자 비교)로 개선.
- GAP-LIST-5: 정렬 tie는 **원본 순서로 안정 정렬**, roi=0은 수익률순 최하단; 거래유형 혼합 정렬 경고 없음(현 동작 유지).
- GAP-LIST-4: 검색 debounce 미적용(데이터 소량) — 실시간.
- GAP-MAP-1: 지도는 **패턴 placeholder 구현**, 실 SDK는 deferred(F).
- GAP-MAP-2: 핀 절대 % 유지, 작은 화면 겹침 허용(개선 deferred).
- GAP-MY-2: 최근 본 지역 = selRegion 프록시 유지.
- GAP-PRICE-1/3: 차트 합성식·KPI 임계 규칙 원본 유지.
- GAP-X4/X6/X2: i18n 미적용·analytics 없음·순수 유체 반응형 가정.
- GAP-ROUTE-5: detail/mypage에서 nav 활성 = **없음(아무 항목도 강조 안 함)** 가정.
- GAP-ROUTE-8: savedCount 배지는 **항상 표시**(0이면 "0").

> 위 BLOCKER/BEHAVIORAL 9개를 Phase 3에서 사용자와 해소하고 `02-resolved-spec.md`에 확정. Assumed defaults는 사용자가 veto하지 않으면 그대로 계약에 편입.

---

## ADDENDUM (Phase 3 후) — Supabase 백엔드 전환으로 활성화된 축

Phase 3 해소에서 데이터 소스 = **Supabase(async API)** + **Supabase Auth** + 서버사이드 쿼리로 결정되며, 그리드에서 조건부(`~`)였던 두 축이 **실제 활성**됨. 전체 분해 유지를 위해 셀 추가:

### X. 데이터 페치 상태 (모든 목록/상세/시세/가이드 데이터)
| 상태 | 트리거 | UI 동작 | 결정 |
|---|---|---|---|
| loading | 서버 컴포넌트 fetch 대기 / 클라 재조회 | 스켈레톤(목록·카드·차트 자리표시) | ✔ (디자인 토큰의 surface/line 색 사용) |
| loaded(≥1) | fetch 성공 | 정상 렌더 | ✔ |
| loaded(0) | fetch 성공 0건 | 빈 상태(목록=🔍, 마이=♡) | ✔ |
| error | fetch 실패/네트워크/Supabase 오류 | 에러 배너 + "다시 시도" | ✔ (전 화면 공통 패턴) |
| stale/재조회 | 필터 변경으로 재쿼리 | 이전 결과 위 로딩 인디케이터(깜빡임 최소) | ✔ |

### Y. 인증 상태 (Supabase Auth: email/password + 소셜(Google·Kakao))
| 상태 \ 이벤트 | 하트 클릭(저장) | /mypage 접근 | 헤더 로그인 버튼 | savedCount |
|---|---|---|---|---|
| 비로그인(anon) | **→ /login 리다이렉트**(returnTo 보존) | **→ /login 리다이렉트** | "로그인" → /login | 0 (또는 anon 미표시) |
| 로그인(authed) | toggleSave → saved_listings DB upsert/delete | 마이페이지 렌더 | "로그아웃"(또는 프로필) | DB의 saved 개수 |
| 세션 만료(중간) | 저장 시도 시 401 → /login | 미들웨어가 /login으로 | — | — |
| 로그인 직후 returnTo | — | 원래 가려던 경로로 복귀 | — | — |

### Z. 인증 폼 (login / signup)
| 케이스 | 동작 | 결정 |
|---|---|---|
| 이메일+비번 로그인 성공 | 세션 생성 → returnTo 복귀 | ✔ |
| 이메일+비번 로그인 실패(잘못된 자격) | 인라인 에러 메시지, 폼 유지 | ✔ |
| 회원가입(이메일 중복) | Supabase 오류 → 인라인 안내 | ✔ |
| 회원가입(약한 비번/형식 오류) | 클라+서버 검증 메시지 | ✔ |
| 소셜 로그인(Google/Kakao) | OAuth 리다이렉트 → 콜백 → 세션 | ✔ (provider는 Supabase 콘솔 설정 의존 → deferred 설정작업) |
| 빈 폼 제출 | 필수값 검증 | ✔ |
| 로그아웃 | 세션 제거 → / 이동, saved UI 비움 | ✔ |

### RLS / 데이터 소유권 축
| 테이블 | 읽기 | 쓰기 | 결정 |
|---|---|---|---|
| listings/regions/guides | public read (anon 포함) | (시드/관리자만) | ✔ |
| saved_listings | 본인 행만(auth.uid()=user_id) | 본인만 insert/delete | ✔ RLS 필수 |

> 적대적 비평(추가 패스): 인증 도입으로 **세션 만료 중간 동작**(저장 중 401), **소셜 provider 미설정 시 graceful 처리**, **RLS 우회 불가 검증**, **로그인 후 returnTo 보존**이 새 위험으로 식별됨 → 위 표에 반영. 모두 test-shaped.
