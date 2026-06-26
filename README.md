# 부동산알파 (bds-alpha)

데이터 기반 부동산 투자 플랫폼. 매물 검색·비교, 지역별 실거래 시세 흐름·예상 수익률 분석, 투자 가이드 열람, 관심 매물 저장을 제공합니다.

> ⚠️ **이 저장소는 `spec-to-code` 플러그인 시험용 프로젝트입니다.**
> 불완전한 기획서(디자인 핸드오프)를 `spec-to-code` 흐름(gap 분석 → 사용자 해소 → 설계 → TDD → 리뷰 → 검증)으로 실제 구현까지 옮긴 실험 결과물입니다. 데이터는 더미이며 운영용이 아닙니다.
>
> 🎨 **디자인: Claude Design으로 제작** — 원본 hifi 프로토타입(7개 화면 + 컴포넌트)을 Claude로 디자인하고, 그 시각/동작을 Next.js로 재구현했습니다.

## 스택
- **Next.js 15** (App Router) + **TypeScript** + React 19
- **Supabase** (Postgres + Auth + RLS) — 데이터/인증
- 테스트: **Vitest**(유닛/컴포넌트) + **Playwright**(E2E)

## 주요 기능
- 7개 화면: 홈 · 매물 목록 · 매물 상세 · 시세 분석 · 투자 가이드 · 지도 탐색 · 마이페이지
- 서버사이드 검색·필터·정렬 (URL 쿼리 구동 → 공유·딥링크·새로고침 생존)
- Supabase Auth(이메일+비밀번호, 소셜은 설정 후 활성) + 관심 매물(사용자별 RLS)
- 접근성 가이드 리딩 모달(ESC·focus-trap·scroll-lock), SVG 시세 차트, 지도 가격 핀

## 실행
```bash
npm install

# .env.local (gitignore — 커밋 금지)
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # publishable 키

# DB: supabase/migrations/0001_init.sql + supabase/seed.sql 적용

npm run dev          # http://localhost:3000
# 또는: npm run build && npm run start
```

## 테스트
```bash
npm test             # Vitest 47개 (로직 line 96% / branch 93%)
npm run e2e          # Playwright 30개 (라이브 Supabase 필요)
```

## 구조
```
src/
  app/            7개 화면 라우트 + layout/login/auth callback
  components/     ListingCard, FilterPanel, PriceChart, GuideOverlay, AuthForm ...
  lib/            순수 로직(format/listingsQuery/chart/stats) + supabase/queries
supabase/         migrations + seed (listings 9 · regions 8 · guides 6)
docs/spec-to-code/bds-alpha/   spec-to-code 산출물(00~08, 추적표, 스크린샷)
```

## 진행 산출물 (spec-to-code)
`docs/spec-to-code/bds-alpha/v1/` — 행동 그리드, 해소된 스펙, 설계, 테스트 문서, 추적표, 리뷰 라운드, 종합검증, 완료 문서.

## 미구현 / 보류 (deferred)
실 소셜 provider 설정 · 실 지도 SDK · 실 매물 이미지 에셋 · 상담 폼 · 실 시세 시계열 · tags 부분일치 검색 · 없는 매물 HTTP 404 상태코드. (상세: `docs/spec-to-code/bds-alpha/deferred.md`)

---
*Generated via the `spec-to-code` flow · 디자인 by Claude Design.*
