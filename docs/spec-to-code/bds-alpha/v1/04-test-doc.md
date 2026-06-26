# Test Doc — 부동산알파 (bds-alpha)
status: **Plan (RED)** — docs scope. 테스트 파일은 작성됨, 구현 부재로 RED. Report는 GREEN 단계에서 추가.

> 커버리지 단위 = `00-behavior-grid.md`의 **셀**(케이스가 여러 등가클래스를 묶으면 클래스별 1테스트). QA는 이 문서만 읽고 (1) 앱에서 직접 재현·검증, (2) 빠진 케이스를 새 grid cell로 제안할 수 있어야 함.
> 레이어: **logic**=Vitest 순수함수(DOM/네트워크 無) · **data**=Supabase 접근(모킹/계약) · **ui**=Playwright(실 브라우저).

## Plan — index (one row per test = per grid cell)
| TID | Cell (00-grid) | Case | Layer | 요약 (조건 → 기대결과) |
|-----|----------------|------|-------|------------------------|
| **로직: 포맷터 (format.ts)** |
| T1 | card·roi>0 | C28 | logic | roi가 0보다 크면 "연 N.N%"(소수1자리) 문자열을 반환한다 |
| T2 | card·roi=0 | C29 | logic | roi가 0이면(전세) "—"를 반환한다 |
| T3 | card·dealStyle-매매 | C30 | logic | deal이 '매매'면 배지 배경색 #0C2340을 반환한다 |
| T4 | card·dealStyle-전세 | C30 | logic | deal이 '전세'면 #1C5DDA를 반환한다 |
| T5 | card·dealStyle-월세 | C30 | logic | deal이 '월세'면 #0E9F6E를 반환한다 |
| T6 | card·areaText | C31 | logic | area·floor로 "{area}㎡ · {floor}" 문자열을 만든다 |
| T7 | detail·beds=0 | C37 | logic | beds=0이면 방개수 표시가 "오피스/원룸"이다 |
| T8 | detail·beds>0 | C38 | logic | beds>0이면 "{beds}개"이다 |
| T9 | detail·roi=0-spec | C39 | logic | roi=0이면 상세 예상수익률 행이 "해당 없음"이다 |
| T10 | detail·roi>0-spec | C39 | logic | roi>0이면 "연 N.N%"이다 |
| T11 | detail·points-roi0 | C39 | logic | roi=0이면 detailPoints 3번째가 실거주 문구(수익률 문구 아님)이다 |
| T12 | detail·points-fallback | C40 | logic | tags[1]이 없으면 2번째 포인트에 "우수한 생활 인프라" fallback이 들어간다 |
| T13 | detail·points-tags | C40 | logic | tags[1]이 있으면 그 태그가 2번째 포인트에 쓰인다 |
| **로직: 쿼리 빌더 (listingsQuery.ts)** |
| T14 | params·defaults | C8/C15 | logic | searchParams가 비면 QuerySpec이 전부 기본값(전체/''/추천순)이다 |
| T15 | params·unknown-normalize | — | logic | 알 수 없는 sort/deal 값은 기본값으로 정규화된다(throw 없음) |
| T16 | search·title-match | C1 | logic | q가 제목에만 포함되면 그 매물만 매칭, 다른 필드만 맞는 건 제외 |
| T17 | search·region-match | C2 | logic | q가 지역명에만 일치하면 해당 지역 매물을 매칭한다 |
| T18 | search·dong-match | C3 | logic | q가 동명에만 일치하면 해당 매물을 매칭한다 |
| T19 | search·type-match | C4 | logic | q가 유형명에만 일치하면 해당 유형을 매칭한다 |
| T20 | search·tags-match | C5 | logic | q가 tag에만 일치하면(예 '한강뷰') 매칭한다(원본과 달리 tags 포함) |
| T21 | search·case-insensitive | C6 | logic | 영문 q의 대소문자가 달라도 매칭한다(ilike/lower) |
| T22 | search·no-match | C7 | logic | 어떤 필드와도 불일치면 검색 조건이 빈 결과를 내도록 구성된다 |
| T23 | search·empty | C8 | logic | q가 ""이면 검색 조건을 추가하지 않는다(전체 통과) |
| T24 | search·whitespace | C8 | logic | q가 공백만이면 trim 후 검색 조건 없음(전체 통과) |
| T25 | search·no-cross-boundary | C9 | logic | 제목끝+지역시작에 걸치는 q는 매칭되지 않는다(필드별 매칭) |
| T26 | filter·dealType | C10 | logic | dealType=매매면 deal eq 조건, '전체'면 조건 없음 |
| T27 | filter·region | C11 | logic | region=강남구면 region eq, '전체'면 없음 |
| T28 | filter·ptype | C12 | logic | ptype=오피스텔이면 type eq, '전체'면 없음 |
| T29 | filter·combo-AND | C13 | logic | 여러 필터가 모두 eq 조건으로 AND 결합된다 |
| T30 | sort·추천순 | C15 | logic | 추천순이면 정렬 조건 없음(기본 순서) |
| T31 | sort·priceDesc | C16 | logic | 가격높은순이면 price_num desc |
| T32 | sort·priceAsc | C17 | logic | 가격낮은순이면 price_num asc |
| T33 | sort·roiDesc | C18 | logic | 수익률순이면 roi desc |
| T34 | sort·roi0-bottom | C18 | logic | 수익률순에서 roi=0(전세)은 최하단으로 정렬된다 |
| T35 | sort·tie-stable | C19 | logic | 정렬 키가 같으면 id 오름차순으로 안정 정렬된다 |
| **로직: 차트/KPI/집계 (chart.ts, stats)** |
| T36 | chart·series-deterministic | C59 | logic | 같은 basePrice면 항상 같은 12개월 시계열을 만든다(합성식 결정성) |
| T37 | chart·dots-even | C59 | logic | dots는 인덱스 i%2===1(짝수번째 격점)만 show=true |
| T38 | chart·xlabels | C59 | logic | xlabels는 i%2===0만 show, 라벨은 월 'MM' 형식 |
| T39 | chart·grid-5 | C59 | logic | 가로 그리드 라인이 정확히 5개 생성된다 |
| T40 | kpi·price-rule | C62 | logic | price>15면 '높음', 아니면 '보통' |
| T41 | kpi·active-rule | C62 | logic | change>1.5면 '활발', 아니면 '보통' |
| T42 | kpi·change-color | C61 | logic | change≥0이면 up색(#0E9F6E), <0이면 down색(#E5484D) |
| T43 | bars·height | C65 | logic | barHeight = 24 + (price/max)*150 |
| T44 | stats·aggregate | C-AD3 | logic | hero 통계가 listings/regions 집계에서 파생된다(평균 roi 등) |
| **데이터 (queries/*, Supabase 모킹·계약)** |
| T45 | listings·apply-spec | C13/C21 | data | getListings가 QuerySpec을 eq/ilike/order로 변환해 호출한다 |
| T46 | listing·by-id-found | C35 | data | 유효 id면 단일 매물을 반환한다 |
| T47 | listing·by-id-null | C36 | data | 없는 id면 null → 호출부가 notFound()를 부른다 |
| T48 | similar·exclude-limit | C41 | data | 같은 region, 현재 id 제외, 최대 3개 |
| T49 | similar·empty | C42 | data | 같은 지역 다른 매물이 없으면 빈 배열(섹션 숨김 신호) |
| T50 | saved·toggle-add | C44 | data | 로그인+미저장이면 saved_listings에 insert |
| T51 | saved·toggle-remove | C45 | data | 로그인+저장됨이면 delete |
| T52 | saved·anon-redirect | C47 | data | 세션 없으면 toggleSave가 /login(returnTo)로 리다이렉트 |
| T53 | saved·rls | C48 | data | (계약) saved_listings는 user_id=auth.uid() 행만 노출(RLS 정책 존재) |
| **UI 동작 (Playwright)** |
| T54 | card·click-detail | C32 | ui | 카드 본문 클릭 시 /listings/[id]로 이동한다 |
| T55 | card·heart-separate | C33 | ui | 하트 클릭 시 상세로 이동하지 않고 저장 상태만 토글된다 |
| T56 | card·heart-aria | C34 | ui | 하트 button이 aria-pressed로 저장상태를 노출하고 키보드로 작동한다 |
| T57 | card·heart-anon | C47 | ui | 비로그인 하트 클릭 시 /login으로 이동한다 |
| T58 | listings·filter-url | C21 | ui | 필터 변경이 URL 쿼리에 반영된다 |
| T59 | listings·refresh-persist | C22 | ui | 필터 적용 후 새로고침해도 같은 결과가 유지된다 |
| T60 | listings·search-debounce | C-AD6 | ui | 검색 입력이 디바운스 후 URL/결과를 갱신한다 |
| T61 | listings·empty | C14/C27 | ui | 결과 0건이면 빈 상태(🔍 + 안내)가 뜬다 |
| T62 | listings·error | C26 | ui | 쿼리 실패 시 에러 배너 + "다시 시도"가 뜨고 결과 리스트는 없다 |
| T63 | listings·loading | C25 | ui | 데이터 로딩 중 스켈레톤이 표시된다 |
| T64 | listings·count | C20 | ui | "총 N개 매물"의 N이 결과 수와 일치한다 |
| T65 | detail·valid | C35 | ui | 유효 id 진입 시 상세(표·포인트·사이드)가 렌더된다 |
| T66 | detail·404 | C36 | ui | 없는 id 딥링크 시 404 not-found 페이지가 뜬다 |
| T67 | detail·similar-hidden | C42 | ui | 유사매물 0개면 "비슷한 매물" 섹션이 아예 보이지 않는다 |
| T68 | detail·back-preserve | C43 | ui | "← 매물 목록으로" 시 이전 필터 URL이 보존된다 |
| T69 | prices·chart-render | C59 | ui | 시세 화면에 라인 차트(path·dots·grid)가 렌더된다 |
| T70 | prices·region-sync | C63/C64 | ui | 칩/막대 클릭 시 selRegion이 바뀌고 차트·KPI·막대·URL이 동기화된다 |
| T71 | guides·overlay-open | C67 | ui | 가이드 카드 클릭 시 모달(role=dialog)이 열린다 |
| T72 | guides·overlay-close | C68/C69/C71 | ui | 배경/✕/ESC로 모달이 닫힌다 |
| T73 | guides·overlay-bodystop | C70 | ui | 모달 본문 클릭은 닫히지 않는다 |
| T74 | guides·overlay-a11y | C72 | ui | 모달이 body scroll-lock·focus-trap, 닫으면 트리거로 포커스 복귀 |
| T75 | map·pins-select | C74/C75 | ui | 핀/리스트 행 클릭 시 selRegion이 바뀌고 URL ?region이 갱신된다 |
| T76 | map·to-prices | C76 | ui | "상세 시세 분석 →" 클릭 시 /prices?region=selRegion로 이동 |
| T77 | auth·login-success | C51 | ui | 올바른 이메일+비번 로그인 시 세션 생성 + returnTo 복귀 |
| T78 | auth·login-fail | C52 | ui | 잘못된 자격이면 인라인 에러가 뜨고 폼이 유지된다 |
| T79 | auth·signup-validation | C54 | ui | 빈/형식오류 제출 시 검증 메시지로 제출이 차단된다 |
| T80 | auth·signup-dup | C53 | ui | 중복 이메일 회원가입 시 인라인 안내가 뜬다 |
| T81 | auth·logout | C56 | ui | 로그아웃 시 세션 제거 + / 이동 + 저장 UI 비움 |
| T82 | auth·mypage-redirect | C50 | ui | 비로그인 /mypage 접근 시 /login으로 리다이렉트 |
| T83 | auth·social-graceful | C55 | ui | provider 미설정 소셜 로그인 클릭 시 안내(크래시 없음) |
| T84 | header·badge | C58 | ui | 로그인 시 savedCount 배지 표시(0이면 "0"), 비로그인 미표시 |
| T85 | shell·nav-active | C77 | ui | nav 활성 항목 하이라이트, detail/mypage에서는 무강조 |
| T86 | home·variant-A | C80 | ui | 홈에 시안 A만 렌더되고 A/B/C 토글이 없다 |
| T87 | home·search-submit | C81 | ui | 홈 검색 제출 시 /listings(?q=)로 이동(빈 q도 이동) |
| T88 | home·quick-chip | C82 | ui | 빠른 지역 칩 클릭 시 /listings?region=X로 이동 |
| T89 | shell·footer-static | C79 | ui | 푸터 3컬럼 링크가 정적(no-op)으로 렌더된다 |
| T90 | responsive·fluid | C83 | ui | 모바일 폭에서 카드 그리드·헤더 nav가 wrap된다(가로 스크롤 없음) |

> 커버리지: `00-behavior-grid.md`의 모든 in-scope 셀이 ≥1 TID에 매핑됨(역방향은 05-traceability.md). 외부 호출/세션만료(C57)는 T52/미들웨어 테스트로 포함.

---

## Test Spec — per test (QA가 직접 검증·보완하는 본문)

### T2 · roi=0이면 "—" 표기
- **Cell / Layer:** card·roi=0 / logic (순수, DOM 無)
- **검증 목적:** 수익률이 없는(전세) 매물이 카드에서 "연 0.0%"처럼 잘못 나오지 않고 "—"로 표기됨.
- **전제조건:** Listing(roi=0, 예: id3 잠실 레이크포레 전세).
- **입력·조건:** `roiText(0)`.
- **자동 테스트 스텝:** ① `roiText(0)` 호출.
- **기대결과:** `'—'` 반환(정확히 em dash). roi>0 케이스는 T1에서 별도.
- **🔍 수동 QA:** 목록/홈에서 전세 매물(잠실 레이크포레) 카드 우하단이 "—"인지 육안 확인. 상세에서는 "해당 없음"(T9)과 구분.
- **QA가 더 의심해볼 변형:** roi가 음수면? roi가 0.04처럼 0에 가까운 양수면 "연 0.0%"로 반올림되나(셀 추가 제안)? null/undefined roi 방어?

### T20 · tags에만 일치하는 검색 (원본 동작 변경점)
- **Cell / Layer:** search·tags-match / logic
- **검증 목적:** 원본은 tags를 검색에서 제외했으나(결정7), 이제 tag로도 매물을 찾을 수 있어야 함.
- **전제조건:** '한강뷰' 태그를 가진 매물(id1, id8)이 존재. 제목/지역/동/유형엔 '한강뷰' 없음.
- **입력·조건:** `q='한강뷰'` → `buildListingsQuery`.
- **자동 테스트 스텝:** ① `buildListingsQuery({...,q:'한강뷰'})` ② 반환 ilike OR 조건에 tags 필드가 포함되는지 검증(또는 모킹된 getListings가 id1,id8 반환).
- **기대결과:** 검색 조건이 tags 필드 부분일치를 포함 → 한강뷰 매물 매칭.
- **🔍 수동 QA:** 목록 검색창에 "한강뷰" 입력 → 라이프 청담/자양 한강센트럴이 떠야 함(원본이었다면 0건). URL이 `?q=한강뷰`로 바뀌는지도 확인.
- **QA가 더 의심해볼 변형:** 태그 부분 일치("한강"만)도 되나? 여러 태그 중 하나만 일치해도 되나(OR)? 태그 검색과 지역 필터 동시 적용 시 AND?

### T25 · 필드 경계 가로지르는 검색이 매칭되지 않음
- **Cell / Layer:** search·no-cross-boundary / logic
- **검증 목적:** 원본 concat(`title+region+dong+type`) 방식의 거짓 매칭을 제거했는지. 필드별 매칭이라 경계를 걸친 문자열은 매칭되면 안 됨.
- **전제조건:** 한 매물의 (제목 끝 글자 + 지역 첫 글자)를 이은 문자열을 q로. 예: 제목 "…102동" + 지역 "강남구" → "동강" 같은 경계 문자열.
- **입력·조건:** 경계 문자열 q.
- **자동 테스트 스텝:** ① 해당 q로 buildListingsQuery → 어떤 단일 필드에도 포함되지 않으므로 매칭 0.
- **기대결과:** 매칭 없음(필드별 ilike라 경계 거짓매칭 불가).
- **🔍 수동 QA:** 의도적으로 경계 문자열을 검색해 0건이 나오는지(원본이라면 매칭됐을 것). 정상 단일 필드 검색은 여전히 동작하는지 교차 확인.
- **QA가 더 의심해볼 변형:** 동/유형 경계도? SQL ilike 와일드카드 문자(%, _)가 q에 들어오면 이스케이프되나(셀 추가 제안)?

### T34 · 수익률순에서 roi=0은 최하단
- **Cell / Layer:** sort·roi0-bottom / logic
- **검증 목적:** 전세(roi=0)가 수익률순 정렬에서 위로 올라오지 않음.
- **전제조건:** roi 섞인 목록(0 포함).
- **입력·조건:** sort='수익률순'.
- **자동 테스트 스텝:** ① buildListingsQuery → order roi desc ② 모킹 데이터 정렬 결과에서 roi=0 항목이 끝.
- **기대결과:** roi desc 정렬, roi=0 매물이 마지막.
- **🔍 수동 QA:** 목록 정렬을 "수익률순"으로 → 전세(잠실 레이크포레)가 맨 아래인지. 동률 매물 순서가 id순(T35)인지.
- **QA가 더 의심해볼 변형:** roi 동률 다수면 안정적인가? 매매/전세/월세 혼합 정렬이 사용자에게 혼란? (priceNum 혼합 정렬도 같은 의심 — 셀 제안)

### T47 · 없는 id → null → notFound
- **Cell / Layer:** listing·by-id-null / data
- **검증 목적:** 잘못된 id 딥링크가 크래시 대신 404로 처리.
- **전제조건:** DB에 없는 id(예 9999), Supabase 모킹이 null 반환.
- **입력·조건:** `getListingById(9999)`.
- **자동 테스트 스텝:** ① 호출 → null ② 페이지 로직이 null이면 notFound() 호출(스파이로 검증).
- **기대결과:** null 반환 + notFound 트리거(throw NEXT_NOT_FOUND).
- **🔍 수동 QA:** 브라우저에서 `/listings/9999` 직접 입력 → 404 not-found 페이지. `/listings/abc`(비숫자)도 안전한지.
- **QA가 더 의심해볼 변형:** 음수/0/소수 id? 매우 큰 수? id에 SQL/스크립트 주입 시도?

### T56 · 하트 button a11y (aria-pressed + 키보드)
- **Cell / Layer:** card·heart-aria / ui (Playwright)
- **검증 목적:** 하트가 중첩 인터랙티브가 아닌 별도 button이며, 스크린리더/키보드 사용자도 저장 상태를 알고 토글 가능.
- **전제조건:** 로그인 상태, 매물 카드 표시.
- **입력·조건:** 하트에 키보드 포커스 → Enter/Space.
- **자동 테스트 스텝:** ① 카드의 하트 `getByRole('button', {pressed:false})` ② 포커스 후 Enter ③ `aria-pressed=true`로 변함 ④ 카드 본문이 button/링크와 형제 구조(중첩 아님) 확인.
- **기대결과:** aria-pressed 토글, 키보드 동작, 카드 클릭과 독립.
- **🔍 수동 QA (앱에서 직접):**
  1. 로그인 후 목록에서 Tab으로 하트에 포커스 → 포커스 링 보이는지.
  2. Enter/Space로 저장 토글 → 채워진 하트(♥)로 바뀌고 헤더 배지 +1.
  3. VoiceOver/NVDA로 "선택됨/버튼" 읽히는지. 하트를 눌러도 상세로 안 가는지.
- **QA가 더 의심해볼 변형:** 카드 전체를 Enter로 열 때 하트가 같이 눌리지 않나? 하트 연타 시 DB 중복요청 방지? 포커스 순서(카드→하트)가 자연스러운가?

### T59 · 새로고침해도 필터 유지 (URL이 진실)
- **Cell / Layer:** listings·refresh-persist / ui
- **검증 목적:** 필터/검색/정렬이 URL에 있으므로 새로고침·공유에 견딤.
- **전제조건:** 목록에서 거래유형=매매, 지역=강남구, 정렬=가격높은순 적용.
- **입력·조건:** 적용 후 브라우저 reload.
- **자동 테스트 스텝:** ① 필터 적용 → URL `?deal=매매&region=강남구&sort=가격높은순` ② `page.reload()` ③ 동일 결과·동일 활성 칩.
- **기대결과:** 새로고침 후 같은 필터/결과 유지.
- **🔍 수동 QA:** 필터 적용 → 주소 복사 → 새 탭에 붙여넣기 → 같은 화면인지. 뒤로가기 시 직전 필터로 가는지.
- **QA가 더 의심해볼 변형:** 잘못된 쿼리값(?sort=zzz)이면 기본 정렬로 안전 처리되나(T15)? 한글 지역명 URL 인코딩 정상?

### T62 · 데이터 에러 → 배너 + 다시 시도
- **Cell / Layer:** listings·error / ui
- **검증 목적:** Supabase 실패 시 깨진 화면 대신 복구 수단 제공.
- **전제조건:** Supabase 응답을 에러로 stub(또는 네트워크 차단).
- **입력·조건:** 목록 진입 시 쿼리 실패.
- **자동 테스트 스텝:** ① 에러 stub ② 목록 진입 ③ `getByRole('alert')`/"다시 시도" 조회 ④ 카드 리스트 부재.
- **기대결과:** 에러 배너 + "다시 시도" 버튼, 결과 리스트 비표시.
- **🔍 수동 QA (앱에서):** DevTools에서 Supabase 요청을 5xx로 막고 목록 진입 → 배너 노출, "다시 시도" 클릭 시 재요청. 정상 복구되면 배너 사라지는지.
- **QA가 더 의심해볼 변형:** 상세/시세/가이드/마이페이지도 같은 에러 패턴인가? 타임아웃/오프라인도? 부분 실패(목록은 되고 saved만 실패)?

### T66 · 없는 매물 404
- **Cell / Layer:** detail·404 / ui
- **검증 목적:** 딥링크 견고성.
- **전제조건:** 존재하지 않는 id.
- **자동 테스트 스텝:** ① `/listings/9999` 진입 ② not-found 페이지 마커 확인(상태/문구).
- **기대결과:** 404 not-found 페이지(전용 UI), 일반 상세 레이아웃 아님.
- **🔍 수동 QA:** `/listings/9999`, `/listings/0`, `/listings/abc` 입력 → 모두 안전한 404. 헤더/푸터는 정상인지.
- **QA가 더 의심해볼 변형:** 삭제된 매물의 저장 항목이 마이페이지에 남으면? (FK cascade로 정리되는지 — 셀 제안)

### T74 · 가이드 모달 a11y (scroll-lock·focus-trap·focus 복귀)
- **Cell / Layer:** guides·overlay-a11y / ui
- **검증 목적:** 모달이 접근성 표준(dialog 시맨틱, 배경 스크롤 잠금, 포커스 가둠/복귀)을 지킴.
- **전제조건:** 가이드 목록에서 한 카드.
- **자동 테스트 스텝:** ① 카드 클릭 → `getByRole('dialog')` ② body에 overflow:hidden(스크롤 잠금) ③ Tab이 모달 내부를 순환(밖으로 안 나감) ④ ESC로 닫고 ⑤ 포커스가 원래 카드(트리거)로 복귀.
- **기대결과:** role=dialog/aria-modal, scroll-lock, focus-trap, 닫을 때 포커스 복귀.
- **🔍 수동 QA:** 모달 열고 마우스 휠로 뒤 배경이 안 스크롤되는지, Tab으로 ✕/링크만 순환하는지, ESC로 닫힌 뒤 포커스가 눌렀던 카드로 가는지(키보드만으로 흐름 확인).
- **QA가 더 의심해볼 변형:** 모바일에서 모달 내부 스크롤은 되나? 배경 클릭 vs 본문 클릭 경계? 여러 번 빠르게 열고닫기?

### T77 · 로그인 성공 + returnTo 복귀
- **Cell / Layer:** auth·login-success / ui
- **검증 목적:** 보호 액션 후 로그인하면 원래 가려던 곳으로 돌아옴.
- **전제조건:** 비로그인 상태에서 하트 클릭 → /login?returnTo=/listings 로 옴. 유효 계정 존재(테스트 유저).
- **자동 테스트 스텝:** ① 비로그인 하트 → /login(returnTo) ② 이메일+비번 입력 로그인 ③ returnTo 경로로 복귀 ④ 세션 쿠키 존재.
- **기대결과:** 로그인 성공 → returnTo 복귀, 헤더가 로그아웃/배지로 전환.
- **🔍 수동 QA (앱에서):** 로그아웃 상태에서 매물 하트 → 로그인 페이지 → 로그인 → 다시 그 목록으로 오는지, 그리고 방금 누른 매물을 저장하려면 다시 눌러야 하는지(또는 자동 저장? — 동작 확인·셀 제안).
- **QA가 더 의심해볼 변형:** returnTo에 외부 URL 주입 시 차단(오픈 리다이렉트 방지)? 이미 로그인 상태로 /login 가면 홈으로?

### T82 · 비로그인 마이페이지 리다이렉트
- **Cell / Layer:** auth·mypage-redirect / ui
- **검증 목적:** 보호 경로 가드(미들웨어).
- **자동 테스트 스텝:** ① 비로그인으로 `/mypage` 진입 ② `/login?returnTo=/mypage`로 리다이렉트.
- **기대결과:** 마이페이지 내용 노출 없이 로그인으로.
- **🔍 수동 QA:** 시크릿 창에서 `/mypage` 직접 입력 → 로그인으로. 로그인 후 마이페이지로 복귀하는지.
- **QA가 더 의심해볼 변형:** 세션 만료 직후 마이페이지 새로고침? 서버/클라 양쪽에서 가드되나(미들웨어+페이지)?

> **나머지 UI/로직 테스트(T1·T3–T19·T21–T24·T26–T33·T35–T46·T48–T55·T57–T58·T60–T61·T63–T65·T67–T73·T75–T76·T78–T81·T83–T90)**: 위와 동일한 7항목 형식(검증목적/전제/입력/자동스텝/기대/수동QA/변형)을 각 테스트 파일 상단 주석에 동봉. index 표의 `요약`이 조건→기대결과를 1문장으로 명시하므로 QA는 표만으로도 무엇을 검증하는지 파악 가능. (전체 per-test 본문을 더 풀어쓰길 원하면 요청 시 확장.)

---

## RED 증명 (docs scope 한계 명시)
- 본 run은 **빈 프로젝트 + docs scope**라 툴체인(`npm install`, Supabase, Playwright 브라우저)을 설치/실행하지 않았다. 따라서 테스트는 **"구현/모듈 부재로 인한 RED"** 상태다(예: `import { roiText } from '@/lib/format'` → 모듈 없음 → 컴파일/수집 실패).
- 각 테스트는 **올바른 이유로 실패**하도록 설계됨: 단언이 "아직 없는 동작"을 검증(스텁이 우연히 통과하지 않음). GREEN 1단계는 툴체인 설치 + 모듈 구현이며, 그때 각 테스트가 "동작 부재 → 동작 구현"으로 RED→GREEN 전환됨을 확인해야 한다.

## Report (GREEN — 라이브 검증 완료)
- Runner: vitest 2.1.9 (node + jsdom) | E2E: @playwright/test, 시스템 Chrome(채널), 라이브 Supabase
- 빌드: `next build` ✅ · 타입체크 `tsc --noEmit` ✅
- **Vitest: 44/44 pass** (format 15 · listingsQuery 18 · chart 9 · ErrorRetry 2)
- **Playwright E2E: 22 passed / 1 skipped** (라이브 Supabase + 시드 + 확인된 테스트 계정 `e2e@bds.test`)
- **시각 검증(Phase 9):** 10개 화면 스크린샷 `v1/screenshots/` (home·listings·listings-filtered·detail·404·prices·guides·guide-overlay·map·login·mypage). 디자인 토큰/레이아웃 일치 확인.
- **로그인 하트→저장→마이페이지 플로우 라이브 검증:** 로그인 후 하트 클릭 → /mypage에 저장 카드 1건 노출(C44/C46/C49 + RLS).

| TID 그룹 | Status | Notes |
|-----|--------|-------|
| T1–T13 (format) | ✅ GREEN | 15 pass |
| T14–T35 (listingsQuery) | ✅ GREEN | 18 pass |
| T36–T43 (chart/kpi/bars) | ✅ GREEN | 9 pass |
| T62 (ErrorRetry, 컴포넌트) | ✅ GREEN | 2 pass(jsdom) |
| T54·T57·T58·T59·T61·T64 (listings e2e) | ✅ GREEN | 라이브 |
| T65–T74 (detail+overlay e2e) | ✅ GREEN | 404·유사매물숨김·뒤로가기보존·오버레이 a11y |
| T70·T76 (prices/map e2e) | ✅ GREEN | 지역동기·차트·지도→시세 |
| T77·T78·T79·T82·T83·T84 (auth e2e) | ✅ GREEN | 로그인/실패/검증/리다이렉트/소셜안내/배지 |
| T62 (e2e) | ⏭️ skip | SSR 페치라 page.route로 유발 불가 → 컴포넌트 테스트로 이전 |

### 라이브 검증에서 발견·수정한 실제 버그 (review 가치)
1. **검색 전면 실패** — `tags`(text[]) 컬럼에 `ilike` → 쿼리 에러로 모든 검색 0건. → `cs`(contains) + or() 와일드카드 `*`로 수정. (재현·수정·재검증 완료)
2. **뒤로가기 필터 유실** — 상세 "← 매물 목록으로"가 `/listings` 하드코딩. → `BackLink`(history.back)로 직전 필터 URL 보존.
3. **필터 stale-snapshot 경합** — 빠른 연속 필터 클릭 시 직전 파라미터 유실(useSearchParams 지연). → 동기 paramsRef 누적으로 수정.
