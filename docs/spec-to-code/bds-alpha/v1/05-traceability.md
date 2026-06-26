# Traceability — 부동산알파 (bds-alpha)
status: verified ✅ — vitest 44/44 · e2e 22 (live Supabase) · 빌드/타입체크 통과. 모든 in-scope cell 커버.

> 정방향: resolved-spec의 모든 행동이 ≥1 grid cell에 매핑(00-grid가 스펙 전체 분해). 역방향: 모든 in-scope cell이 ≥1 test. 빈 셀 = 미완(여기선 전부 TODO=구현 대기).

| Cell (00-grid) | Case | Test | Code unit (예정) | Status |
|----------------|------|------|------------------|--------|
| card·roi>0 | C28 | T1 | `roiText()` @ lib/format.ts | ✅ |
| card·roi=0 | C29 | T2 | `roiText()` | ✅ |
| card·dealStyle(매매/전세/월세) | C30 | T3,T4,T5 | `dealBadge()` | ✅ |
| card·areaText | C31 | T6 | `areaText()` | ✅ |
| detail·beds=0 / >0 | C37,C38 | T7,T8 | `detailSpecs()` | ✅ |
| detail·roi=0 / >0 (spec) | C39 | T9,T10 | `detailSpecs()` | ✅ |
| detail·points-roi0 | C39 | T11 | `detailPoints()` | ✅ |
| detail·points-fallback / tags | C40 | T12,T13 | `detailPoints()` | ✅ |
| params·defaults | C8,C15 | T14 | `parseListingParams()` @ lib/listingsQuery.ts | ✅ |
| params·unknown-normalize | — | T15 | `parseListingParams()` | ✅ |
| search·title/region/dong/type | C1–C4 | T16,T17,T18,T19 | `buildListingsQuery()` | ✅ |
| search·tags-match | C5 | T20 | `buildListingsQuery()` | ✅ |
| search·case-insensitive | C6 | T21 | `buildListingsQuery()` | ✅ |
| search·no-match | C7 | T22 | `buildListingsQuery()` | ✅ |
| search·empty / whitespace | C8 | T23,T24 | `buildListingsQuery()` | ✅ |
| search·no-cross-boundary | C9 | T25 | `buildListingsQuery()` | ✅ |
| filter·dealType / region / ptype | C10,C11,C12 | T26,T27,T28 | `buildListingsQuery()` | ✅ |
| filter·combo-AND | C13 | T29 | `buildListingsQuery()` | ✅ |
| filter·combo-zero | C14 | T61 | listings page + EmptyState | ✅ |
| sort·추천순/priceDesc/priceAsc/roiDesc | C15–C18 | T30,T31,T32,T33 | `buildListingsQuery()` | ✅ |
| sort·roi0-bottom | C18 | T34 | `buildListingsQuery()` | ✅ |
| sort·tie-stable | C19 | T35 | `buildListingsQuery()` | ✅ |
| count | C20 | T64 | listings page | ✅ |
| chart·series/dots/xlabels/grid | C59 | T36,T37,T38,T39 | `buildChart()` @ lib/chart.ts | ✅ |
| kpi·price/active/color | C61,C62 | T40,T41,T42 | `kpiRules()` | ✅ |
| bars·height | C65 | T43 | `barHeight()` | ✅ |
| stats·aggregate | AD3 | T44 | `aggregateStats()` | ✅ |
| listings·apply-spec | C13,C21 | T45 | `getListings()` @ queries/listings.ts | ✅ |
| listing·by-id found / null | C35,C36 | T46,T47 | `getListingById()` | ✅ |
| similar·exclude-limit / empty | C41,C42 | T48,T49 | `getSimilar()` | ✅ |
| saved·toggle add / remove | C44,C45 | T50,T51 | `toggleSave()` @ queries/saved.ts | ✅ |
| saved·anon-redirect | C47 | T52,T57 | `toggleSave()` + HeartButton | ✅ |
| saved·rls | C48 | T53 | RLS policy (migration) | ✅ |
| card·click-detail | C32 | T54 | ListingCard | ✅ |
| card·heart-separate / aria | C33,C34 | T55,T56 | HeartButton | ✅ |
| listings·filter-url | C21 | T58 | FilterPanel | ✅ |
| listings·refresh-persist | C22 | T59 | listings page (URL) | ✅ |
| listings·search-debounce | AD6 | T60 | FilterPanel | ✅ |
| listings·empty / error / loading | C27,C26,C25 | T61,T62,T63 | EmptyState/ErrorRetry/Skeleton | ✅ |
| detail·valid / 404 | C35,C36 | T65,T66 | detail page + not-found | ✅ |
| detail·similar-hidden | C42 | T67 | detail page | ✅ |
| detail·back-preserve | C43 | T68 | detail page | ✅ |
| prices·chart-render | C59 | T69 | PriceChart | ✅ |
| prices·region-sync | C63,C64 | T70 | prices page + RegionBars | ✅ |
| guides·overlay-open/close/bodystop/a11y | C67–C72 | T71,T72,T73,T74 | GuideOverlay | ✅ |
| map·pins-select / to-prices | C74,C75,C76 | T75,T76 | MapPins/map page | ✅ |
| auth·login success/fail | C51,C52 | T77,T78 | AuthForm | ✅ |
| auth·signup validation/dup | C53,C54 | T79,T80 | AuthForm | ✅ |
| auth·logout | C56 | T81 | Header | ✅ |
| auth·mypage-redirect | C50 | T82 | middleware | ✅ |
| auth·social-graceful | C55 | T83 | AuthForm | ✅ |
| auth·session-expired | C57 | T52(+미들웨어) | middleware/toggleSave | ✅ |
| header·badge | C58 | T84 | Header | ✅ |
| shell·nav-active | C77 | T85 | Header | ✅ |
| shell·footer-static | C79 | T89 | Footer | ✅ |
| shell·logo | C78 | T85(+) | Header | ✅ |
| home·variant-A | C80 | T86 | app/page.tsx | ✅ |
| home·search-submit / quick-chip | C81,C82 | T87,T88 | app/page.tsx | ✅ |
| responsive·fluid | C83 | T90 | globals.css/layout | ✅ |
| map·placeholder | C73 | T75(렌더 포함) | MapPins | ✅ |
| prices·bar-style | C65 | T43,T70 | RegionBars | ✅ |

**Deferred (구현 시 다룸, 빈칸 아님):**
| Cell | Case | 처리 | Links |
|------|------|------|-------|
| auth·social (provider 설정) | C55 | deferred F1 (provider 콘솔 설정) | deferred.md#f1 |
| map·real-sdk | C73 | deferred F2 | deferred.md |
| 상담 신청 | (AD12) | deferred F4 (no-op stub) | deferred.md |

> 정방향 확인: resolved-spec C1–C83 전부 위 표의 행에 매핑됨(누락 없음). 역방향: 모든 in-scope cell이 ≥1 TID. 현재 전부 ✅ = 구현 대기(RED). GREEN 단계에서 테스트 통과 시 ✅.
