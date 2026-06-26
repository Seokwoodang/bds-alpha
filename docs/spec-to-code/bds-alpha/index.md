# 부동산알파 (bds-alpha) — spec-to-code

slug: bds-alpha
source: /Users/luke/Downloads/design_handoff_bds_alpha/ (README.md · 부동산알파.dc.html · ListingCard.dc.html)
scope: **docs** (Phase 1–6, 구현 없음 — RED 테스트까지). Phase 3에서 데이터 백엔드 = **Supabase**(Auth+DB)로 확정 → 사실상 풀스택 계약
status: **🚪 Gate 2 대기** — 전 단계 완료. vitest 47/47 · e2e 30 pass(라이브 Supabase) · 리뷰 통과 · 종합검증 통과

## 핸드오프 (다음 개발자)
- 본 run은 **문서 + RED 테스트**까지. 구현(GREEN)·Supabase 적용은 안 함.
- 다음 단계: ① `npm install`로 툴체인 설치(package.json은 미생성 — 게이트가 impl로 차단; 설계 `03-design §2/§6` 의존성 목록 사용) ② `supabase/migrations/0001_init.sql`+`seed.sql` 적용 ③ `03-design.md` 파일 트리대로 구현 ④ `src/lib/__tests__/*`·`e2e/*` 테스트를 RED→GREEN ⑤ 리뷰 루프·시각 검증(Phase 9–12).
- 재개 시 `/spec-to-code-frontend`(또는 fullstack)로 `testsApproved`부터. open deferred: F1~F6 (deferred.md).

## Artifacts (v1)
- [working-spec](v1/01-working-spec.md) · [behavior-grid](v1/00-behavior-grid.md) · [resolved-spec](v1/02-resolved-spec.md)
- [design](v1/03-design.md) · [test-doc](v1/04-test-doc.md) · [traceability](v1/05-traceability.md)
- [deferred](deferred.md) · [CHANGELOG](CHANGELOG.md)

## Run history
- 2026-06-23 — fresh (docs scope): 디자인 핸드오프(7개 화면 + ListingCard + 가이드 오버레이)를 정규화하고 gap 분석 → 설계 → RED 테스트 문서까지 작성. 구현(GREEN)은 후속.
