# Working Spec (정규화 스냅샷) — 부동산알파 (bds-alpha)

> Phase 1 정규화 결과. 원본(`source/`의 README + 2개 HTML 디자인 레퍼런스)을 기계가 읽기 쉬운 형태로 옮긴 것. 사용자 승인 계약은 `02-resolved-spec.md`이며, 본 문서는 다음 버전 diff의 기준선이다.
>
> **원본 성격:** `부동산알파.dc.html`/`ListingCard.dc.html`은 "Design Component" 커스텀 런타임(`<sc-for>`, `<sc-if>`, `<dc-import>`, `renderVals()`)으로 작성된 **hifi 디자인 프로토타입**. 문법/런타임은 재현 대상이 아니며, **시각 결과 + 동작 로직만** 표준 프레임워크 방식으로 옮긴다. 색/타이포/간격/인터랙션 값은 확정(픽셀 단위) — 그대로 사용. 매물 사진·지도는 플레이스홀더.

## 0. 제품 요약
데이터 기반 부동산 투자 플랫폼. 사용자는 매물 검색·비교, 지역별 실거래 시세 흐름·예상 수익률 분석, 투자 가이드 열람, 관심 매물 저장을 한다. 핀테크 톤(차분한 블루/네이비). **7개 화면 + 가이드 리딩 오버레이 + 재사용 ListingCard**.

화면: 홈(랜딩), 매물 목록, 매물 상세, 시세 분석, 투자 가이드, 지도 탐색, 마이페이지.

## 1. 디자인 토큰 (확정값)

### Colors
| 토큰 | Hex | 용도 |
|---|---|---|
| `--bg` | `#F5F8FC` | 페이지 배경 |
| `--surface` | `#FFFFFF` | 카드/패널 |
| `--navy` | `#0C2340` | 헤딩/강조/다크 섹션·푸터 배경 |
| `--ink` | `#16273D` | 기본 본문 |
| `--ink-soft` | `#3A4D66` | 본문 보조 |
| `--muted` | `#5B6E88` / `#7286A0` | 설명 텍스트 |
| `--muted-2` | `#8499B3` / `#9AACC2` | 캡션/라벨 |
| `--line` | `#E6ECF4` | 보더/구분선 |
| `--line-soft` | `#F0F3F8` / `#EEF2F8` | 내부 구분선/그리드 |
| `--primary` | `#1C5DDA` | 주요 액션/링크/활성 |
| `--primary-dark` | `#0A357F` | 버튼 hover |
| `--primary-soft` | `#EAF1FC` | 칩/배지 연한 배경, 활성 nav |
| `--up` | `#0E9F6E` | 상승/긍정(수익률·변동 +) |
| `--down` | `#E5484D` | 하락/관심 하트(변동 −) |

- 다크 섹션 텍스트: 제목 `#FFFFFF`, 본문 `#B7C7DE`, 캡션 `#8FA6C4`/`#9FB6D6`, 보더 `rgba(255,255,255,0.08~0.2)`. 다크 위 변동률 +는 `#3FD99A`, −는 `#FF8A8A`(미니 리스트).
- 가이드 커버 그라데이션: `linear-gradient(135deg, oklch(0.7 0.12 H), oklch(0.55 0.15 H+24))`, 아티클별 hue H = 218/155/28/262/198/340.

### Typography
- Font: **Pretendard**(CDN), fallback `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`.
- Hero H1 800 / `clamp(34px,5vw,52px)`(시안 B `clamp(36px,6vw,60px)`), lh 1.1~1.12, ls −0.03em · 페이지 H1 800/28px/−0.02em · 섹션 H2 800/22~26px · 카드 제목 700/17px · 가격(카드) 800/21px · 가격(상세) 800/32px · KPI 800/26~34px · 본문 400~600/14~16px · 캡션 600~700/11~13px. 숫자/금액 강조는 800 + 음수 ls.

### Spacing / Radius / Shadow
- 컨테이너 max-width: 홈/목록 **1200px**, 상세/시세/가이드/마이페이지 1100px, 지도 1280px, 좌우 padding 24px. 헤더 height 68px.
- 섹션 세로 padding 32~48px, 카드 내부 16~24px, gap: 카드 그리드 22px, 칩 8px.
- Radius: 버튼/인풋 9~12px, 카드 16px, 큰 패널/오버레이 18~24px, 칩/배지 pill(30px), 로고 마크 8~9px.
- Shadow: 카드 hover `0 16px 36px rgba(12,35,64,0.1)`, 떠있는 패널 `0 12px 32px rgba(12,35,64,0.07)`, 검색바 `0 10px 30px rgba(12,35,64,0.07)`, 로고 `0 4px 12px rgba(28,93,218,0.32)`.
- 카드 그리드 `repeat(auto-fill, minmax(270~280px, 1fr))`. 반응형은 auto-fill/auto-fit + flex-wrap + `clamp()`(미디어쿼리 거의 없음).
- 애니메이션: 화면 진입 `bdsFade`/`bdsFadeUp`(~0.4s ease), 카드 hover `translateY(-3px)`+shadow, 막대 height transition 0.4s.

## 2. 상태 모델 (원본 로직 기준)

전역(상위) 상태 — 원본 `state`:
```
screen   : 'home'|'listings'|'detail'|'prices'|'guides'|'map'|'mypage'   (초기 'home')
variant  : 'A'|'B'|'C'   홈 hero 시안 (초기 'A')
dealType : '전체'|'매매'|'전세'|'월세'   (초기 '전체')
region   : '전체'|<지역명>   목록 지역 필터 (초기 '전체')
ptype    : '전체'|'아파트'|'오피스텔'|'주택'|'오피스'   (초기 '전체')
sort     : '추천순'|'가격높은순'|'가격낮은순'|'수익률순'   (초기 '추천순')
q        : string   검색어 (초기 '')
saved    : number[]   관심 매물 id 배열 (초기 [4, 8])
selId    : number|null   선택 매물 id (초기 null)
selRegion: string   시세/지도 선택 지역 (초기 '강남구')
selGuide : number|null   열린 가이드 id (초기 null)
```
파생값(상태에서 계산): 필터링된 목록, 선택/유사 매물, 차트 데이터(선택 지역 12개월 시계열), 지역별 막대 높이, 지도 핀, KPI 등.

## 3. 데이터 (현실적 더미 — 운영 시 실거래 API/DB로 교체)

### LISTINGS (매물 9건) — 스키마
`{ id:number, title, type:'아파트'|'오피스텔'|'주택'|'오피스', deal:'매매'|'전세'|'월세', region, dong, priceText, priceNum:number, area:number(㎡), floor, built:number, roi:number, tags:string[], beds:number }`

| id | title | type | deal | region | dong | priceText | priceNum | area | floor | built | roi | tags | beds |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 1 | 라이프 청담 102동 | 아파트 | 매매 | 강남구 | 청담동 | 24억 5,000 | 245000 | 84 | 24/30층 | 2019 | 3.1 | 한강뷰,역세권 | 3 |
| 2 | 반포 스카이팰리스 | 아파트 | 매매 | 서초구 | 반포동 | 32억 | 320000 | 59 | 15/35층 | 2021 | 2.7 | 신축,학군 | 2 |
| 3 | 잠실 레이크포레 | 아파트 | 전세 | 송파구 | 잠실동 | 전세 11억 | 110000 | 84 | 9/24층 | 2017 | 0 | 호수뷰,대단지 | 3 |
| 4 | 합정 더원 오피스텔 | 오피스텔 | 매매 | 마포구 | 합정동 | 4억 9,000 | 49000 | 33 | 12/18층 | 2022 | 4.8 | 역세권,신축 | 1 |
| 5 | 성수 리버티 | 아파트 | 매매 | 성동구 | 성수동 | 18억 2,000 | 182000 | 76 | 7/15층 | 2016 | 3.4 | 카페거리,리버뷰 | 3 |
| 6 | 한남 테라스하우스 | 주택 | 매매 | 용산구 | 한남동 | 41억 | 410000 | 132 | 3/3층 | 2015 | 2.2 | 프라이빗,정원 | 4 |
| 7 | 여의도 파이낸스타워 #1204 | 오피스 | 월세 | 영등포구 | 여의도동 | 2,000 / 350 | 35000 | 56 | 24/40층 | 2020 | 5.6 | 오피스,금융가 | 0 |
| 8 | 자양 한강센트럴 | 아파트 | 매매 | 광진구 | 자양동 | 14억 8,000 | 148000 | 59 | 18/25층 | 2018 | 3.6 | 한강뷰,역세권 | 2 |
| 9 | 역삼 비즈하임 | 오피스텔 | 월세 | 강남구 | 역삼동 | 1,000 / 120 | 12000 | 29 | 8/14층 | 2021 | 5.2 | 역세권,풀옵션 | 1 |

### REGIONS (지역 시세 8개) — `{ name, price:number(억), change:number(%) }`
강남구 24.0/+2.3 · 서초구 22.0/+1.8 · 용산구 20.0/+1.1 · 송파구 15.0/−0.6 · 성동구 14.0/+3.2 · 광진구 11.0/+1.5 · 마포구 12.0/+2.0 · 영등포구 10.0/+0.9.
- 홈 시안 C 미니 리스트 = 상위 5개(배열 순서 0~4: 강남·서초·용산·송파·성동).
- 지도 핀 좌표(left%, top%): 강남[62,66] 서초[49,68] 송파[77,60] 용산[44,50] 성동[60,44] 광진[75,45] 마포[29,47] 영등포[33,64].

### GUIDES (가이드 6건) — `{ id, category, title, excerpt, meta, hue, body:string[] }`
1 초보 가이드 hue218 · 2 수익률 분석 hue155 · 3 세금 절약 hue28 · 4 시장 동향 hue262 · 5 오피스텔 hue198 · 6 입지 분석 hue340. (각 body 4문단, 본문은 source HTML 참조.)

## 4. 핵심 로직 (원본 함수 — 시각/동작 레퍼런스)

- **cover(hue)** → 가이드 커버 그라데이션 문자열.
- **filtered()** — 목록 필터+정렬 파생:
  - 필터: `(dealType==='전체'||it.deal===dealType) && (region==='전체'||it.region===region) && (ptype==='전체'||it.type===ptype) && (!q || (it.title+it.region+it.dong+it.type).includes(q))`. q는 `trim()` 후 사용.
  - 정렬: 추천순=원본 순서, 가격높은순=`priceNum desc`, 가격낮은순=`priceNum asc`, 수익률순=`roi desc`. (정렬은 사본 `[...r]`에 적용.)
- **decorate(it)** — 카드 표시용 파생: cover(스트라이프 placeholder), dealStyle(매매 `#0C2340`/전세 `#1C5DDA`/월세 `#0E9F6E`), roiText(`roi>0 ? '연 N.N%' : '—'`), areaText(`{area}㎡ · {floor}`), isSaved/heart(`saved.includes(id)`), open(상세 이동), toggle(stopPropagation 후 toggleSave).
- **toggleSave(id)** — `saved`에 id 추가/제거 토글.
- **buildChart(name)** — 선택 지역 12개월 시계열 생성:
  - 기준 base = 해당 지역 `price`(없으면 첫 지역). 월 라벨 `['25.07'…'26.06']`(12개).
  - 데이터: `data[i] = round2(base*(0.94 + 0.012*i + 0.018*sin(i*0.9)))`.
  - 좌표계 W760 H300, padding L52 R20 T24 B44. min=`min(data)*0.985`, max=`max(data)*1.015`. line/area path, dots(짝수 인덱스 i%2===1만 show), xlabels(i%2===0만 show, `label=m.slice(3)`), grid 5선([0,.25,.5,.75,1]). cur=`data[11]`(현재값), reg=지역객체.
- **유사 매물**: 같은 region & 다른 id, 최대 3개.
- **detailSpecs**(8행): 매물유형/거래유형/전용면적/해당층/방개수(`beds>0 ? '{beds}개' : '오피스/원룸'`)/준공연도/소재지/예상수익률(`roi>0 ? '연 N.N%' : '해당 없음'`).
- **detailPoints**(3개): tags·built·roi 기반 동적 생성 문구(원본 템플릿 참조).
- **priceKpis**(3개): 전월 대비(`change`, ± 색상 up/down) · 전국 평균 대비(`price>15 ? '높음' : '보통'`) · 거래 활발도(`change>1.5 ? '활발' : '보통'`).
- **mapPins**: regions에 좌표/활성색/버블·행 스타일 부여. 활성(=selRegion) 핀 `#1C5DDA`+흰테두리 z20, 비활성 `#0C2340` z10.
- **myStats**(3개): 관심 매물(`saved.length`개) · 최근 본 지역(`selRegion`) · 추천 매물(`LISTINGS.length`개).

## 5. 화면별 명세

### 5.1 공통 셸 (Header / Footer)
- **Header** sticky, `rgba(255,255,255,0.86)`+blur(12px), 하단 보더 `#E6ECF4`, h68, max 1200.
  - 좌: 로고(34px 그라데이션 마크 "α" + "부동산**알파**"(알파 `#1C5DDA`) 800/19px) → 클릭 시 홈.
  - 중앙 nav: 홈/매물/시세/가이드/지도. 활성 배경 `#EAF1FC` 텍스트 `#1C5DDA` 700. hover 동일 배경. (※ nav에 마이페이지 항목 없음 — 마이페이지는 관심목록 버튼으로 진입.)
  - 우: 관심목록 버튼(♡ + `savedCount` 배지 pill `#1C5DDA`) → 클릭 시 마이페이지 + "로그인" 버튼(`#0C2340`, hover `#1C5DDA`). (로그인 버튼은 onClick 미정의 — 정적.)
- **Footer** 배경 `#0C2340` 텍스트 `#B7C7DE`. 좌 브랜드 + 투자 유의 문구, 우 3컬럼(서비스/회사/고객지원, 각 4링크 — 정적). 하단 카피라이트 바.

### 5.2 홈 / 랜딩
- 상단 **시안 A/B/C 토글**(세그먼티드, 트랙 `#EAEFF6`) — 디자인 탐색용. 구현 시 하나 선택(README 권장: A 또는 B), 토글 제거 가능.
- 시안 A(분할형): 좌 배지+H1"감이 아니라/숫자로 투자하세요"+설명+검색바+빠른 지역 칩(강남·서초·마포·성동·용산) / 우 이미지 placeholder(380px) + 떠있는 통계 카드 2개(강남구 평균 매매가 24.0억 ▲2.3% / 평균 예상 수익률 3.8%). 검색 버튼 → 목록.
- 시안 B(중앙): 880px, H1"부동산 투자의/모든 데이터, 한 곳에"+와이드 검색바+하단 3통계(3,200+ 실거래 / 8개구 / 연 3.8%).
- 시안 C(다크): `#0C2340` 라운드 박스 + radial glow. 좌 CTA 2개(시세 분석 보기→prices / 매물 둘러보기→listings), 우 "주요 지역 시세 추이·최근 6개월" 미니 바 리스트(상위 5개, 막대+변동률).
- 빠른 지역 칩 클릭: `{screen:'listings', region:<지역>}` (검색어 q는 변경 안 함).
- 시안 A·B 검색바: q 입력은 `onSearch`(실시간 상태 반영), 검색 버튼/Enter → 목록 이동.
- **공통 하단 섹션**(시안 무관): ① 추천 투자 매물 4개(LISTINGS.slice(0,4), ListingCard 그리드) + "전체보기 →"(목록) ② 가치 제안 4개(아이콘+제목+설명) ③ 투자 꿀팁 가이드 3개(GUIDES.slice(0,3) 카드, 클릭 시 가이드 오버레이 열림) + "전체보기 →"(가이드).

### 5.3 매물 목록 (Listings)
- H1 "매물 찾기" + 설명.
- 필터 패널(흰 카드): 검색 인풋(q) / 거래유형 세그먼티드(전체·매매·전세·월세) / 지역 칩(전체+8개) / 매물유형 칩(전체·아파트·오피스텔·주택·오피스). 활성 칩 `#1C5DDA` 배경 흰 텍스트.
- 결과 카운트("총 {listCount}개 매물", 숫자 `#1C5DDA`) + 정렬 `<select>`(추천순·가격높은순·가격낮은순·수익률순).
- `listCount>0`이면 ListingCard 그리드, `===0`이면 빈 상태(🔍 + "조건에 맞는 매물이 없어요" + 필터 변경 유도).

### 5.4 ListingCard (재사용 컴포넌트)
- 흰 카드 radius16 보더 `#E6ECF4`. hover: 보더 `#1C5DDA`, `translateY(-3px)`, shadow. 전체가 `<button>`.
- 상단 이미지(168px 스트라이프 "[ 매물 사진 ]") + 좌상단 거래유형 배지(deal별 색) + 우상단 하트 토글(♡/♥ `#E5484D`, `stopPropagation`).
- 본문: 유형 배지 + "지역 동" / 제목(700·17px) / 가격(800·21px) / areaText(13px) / 하단 태그 칩들 + roiText(`#0E9F6E`).
- 카드 클릭 → 매물 상세(selId 설정, screen='detail').

### 5.5 매물 상세 (Detail) — `selId != null && screen==='detail'`
- "← 매물 목록으로"(목록 복귀, selId=null).
- 2열(좌 콘텐츠 / 우 sticky 사이드 top88). 좁아지면 wrap.
- 좌: 대표 사진(360px)+거래 배지 / 썸네일 3개(거실·주방·전망) / 상세 정보 표(8행) / 투자 포인트 체크리스트(✓ `#0E9F6E`, 3개).
- 우 사이드 카드: 유형·지역 / 제목 / "{deal}가" + 가격(800·32px) / 수익률·전용면적 2분할 박스 / "상담 신청하기"(primary, onClick 미정의) / "관심 매물 저장"(하트 토글, hover `#E5484D`).
- 하단: "{region} 비슷한 매물" 3개(같은 지역, 현재 제외).

### 5.6 시세 분석 (Prices)
- H1 "시세 분석" + 기준 설명(84㎡ 아파트 평균 매매가).
- 지역 선택 칩 8개(활성=primary).
- KPI 행: 다크 카드(선택 지역 평균 매매가 `{chart.cur}억`, `#0C2340`) + priceKpis 3개(전월 대비 ±% up/down 색 · 전국 평균 대비 · 거래 활발도).
- 라인 차트(흰 패널, SVG viewBox `0 0 760 300`, `preserveAspectRatio="none"`, h300): area 그라데이션 `#1C5DDA`(0.22→0), line stroke `#1C5DDA` 2.5px, 데이터 포인트(짝수 인덱스 흰 원+파란 테두리), 가로 그리드 5선+Y라벨, X축 월 라벨(2개마다).
- 막대 비교 차트: 8개 지역 막대(선택 `#1C5DDA`, 나머지 `#C5D4E8`), 높이 `24 + (price/max)*150`px, transition 0.4s. 막대 클릭 → 해당 지역 선택.

### 5.7 투자 가이드 (Guides)
- H1 + 설명. 상단 추천 피처드 아티클(GUIDES[0], 가로 2열 커버/텍스트, "{category} · 추천"). 하단 6개 그리드(커버 140px + 카테고리 배지 + 제목 + 요약 + meta).
- 카드 클릭 → 리딩 오버레이(selGuide 설정).

### 5.8 지도 탐색 (Map)
- H1 + 설명. 2열(좌 지도 / 우 리스트).
- 지도 영역(560px, 플레이스홀더): 그리드+도로 패턴, "[ 지도 영역 · 실제 지도 연동 위치 ]", "한 강" 라벨. → 운영 시 지도 SDK(Kakao/Naver)로 교체.
- 가격 핀 8개: 지역명+가격 버블(활성 `#1C5DDA`+흰 테두리, 비활성 `#0C2340`) + 삼각 포인터, 절대 위치(좌표 §3). 클릭 → 지역 선택.
- 우: 지역별 평균 시세 리스트(행 클릭 → 선택, 활성 행 `#EAF1FC`) + "{selRegion} 상세 시세 분석 →" 버튼(시세 화면으로).

### 5.9 마이페이지 (Mypage) — 관심목록 버튼으로 진입
- 프로필 헤더(아바타 "투" + 인사). KPI 3개(myStats: 관심 매물 수 / 최근 본 지역 / 추천 매물 수).
- "관심 매물 {savedCount}" + 저장 매물 ListingCard 그리드(`saved` 기준). `saved.length>0`이면 그리드, `===0`이면 빈 상태(♡ + "매물 둘러보기" CTA → 목록).

### 5.10 가이드 리딩 오버레이 — `selGuide != null` (전 화면 공통)
- 고정 풀스크린 dim `rgba(12,35,64,0.55)`+blur(4px), 중앙 article(680px), 상단 커버(200px)+카테고리 배지+닫기(✕ 우상단 원형). 본문 문단들(body).
- 배경 클릭/✕ → 닫힘. 본문(article) 클릭은 `stopPropagation`(닫히지 않음).

## 6. 인터랙션 & 동작 요약
- **네비게이션**: 원본은 단일 페이지 내 screen 상태 전환(SPA). README 권장: Next.js 실제 라우트(`/`, `/listings`, `/listings/[id]`, `/prices`, `/guides`, `/map`, `/mypage`)로 분리.
- **검색**: q로 제목+지역+동+유형 부분일치 실시간 필터.
- **필터**: 거래유형/지역/매물유형 — "전체" 통과, 아니면 일치. 조합 AND.
- **정렬**: 추천순(원본)·가격높은순·가격낮은순(priceNum)·수익률순(roi).
- **관심 저장**: 하트 토글 → saved 추가/제거. 헤더 배지·마이페이지·카드·상세 하트 전부 연동(전역). 하트 클릭은 카드 클릭과 분리(stopPropagation). README: localStorage 영속 권장.
- **가이드 오버레이**: 열기/닫기, 배경 클릭 닫힘.
- **차트/지도 연동**: 지역 선택 시 라인차트·KPI·막대 강조·지도 핀 동시 갱신(selRegion 공유).
- **반응형**: 데스크탑/모바일 대응. auto-fill/auto-fit, flex-wrap, clamp(). 헤더 nav flex-wrap.

## 7. 에셋 / 외부 의존
- Pretendard 웹폰트(CDN). 매물 사진=스트라이프 placeholder, 가이드 커버=oklch 그라데이션, 지도=패턴 배경(→ 실제 지도 SDK 연동 필요). 아이콘=텍스트 글리프(♡ ♥ ⌕ ✓ ✕ →) + 이모지(📊 📈 🗺️ 📚) → 운영 시 아이콘 라이브러리 교체 권장.
- 데이터는 더미 → 운영 시 실거래가 API(국토부 등)·매물/콘텐츠 DB로 교체.

## 8. 대상 스택 (설계 기준, README 기반)
- Next.js(App Router) + TypeScript + 클라이언트 컴포넌트. 빈 프로젝트에서 신규 구성.
- 상태: 전역 공유 필요(saved 등) → React Context 또는 경량 스토어. saved는 localStorage 영속.
- 테스트: Vitest(순수 로직 단위) + Playwright(UI 동작/스크린샷). *docs scope에서는 RED 테스트 작성까지만.*

---
*정규화 시 발견된 미결정/모호 지점은 Phase 2(`00-behavior-grid.md`)에서 그리드로 열거하고 Phase 3에서 사용자와 해소한다.*
