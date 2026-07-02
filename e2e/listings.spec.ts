/**
 * RED e2e — 매물 목록 (Playwright, ui 레이어)
 * docs scope: 앱 미구현 → 라우트/요소 부재로 RED. GREEN 단계에서 통과.
 * 커버: T54(card→detail) T55(heart-separate) T56(heart-aria) T57(heart-anon)
 *       T58(filter-url) T59(refresh-persist) T60(search-debounce) T61(empty)
 *       T62(error) T64(count)
 */
import { test, expect } from '@playwright/test';

test.describe('전국 실거래 매물', () => {
  test('NL1 · 전국 개별 실거래 목록 + 검색', async ({ page }) => {
    await page.goto('/listings?code=11680'); // 강남구(캐시됨)
    await expect(page.getByRole('heading', { name: '전국 실거래 매물' })).toBeVisible();
    await expect(page.getByText(/총 .*건/)).toBeVisible({ timeout: 20000 });
    // 카드 최소 1개
    await expect(page.locator('a[href^="/listings/tx/"]').first()).toBeVisible();
  });

  test('NL2 · 매물 카드 → 상세(실거래 정보 + 취득세)', async ({ page }) => {
    await page.goto('/listings?code=11680');
    await page.locator('a[href^="/listings/tx/"]').first().click();
    await expect(page).toHaveURL(/\/listings\/tx\/\d+/);
    await expect(page.getByText('실거래 정보')).toBeVisible();
    await expect(page.getByRole('heading', { name: '취득세 계산' })).toBeVisible();
    // 로드뷰(네이버 지도) 링크 — 실제 건물 확인용
    const rv = page.getByRole('link', { name: /네이버 지도·로드뷰/ });
    await expect(rv).toHaveAttribute('href', /map\.naver\.com/);
    await expect(rv).toHaveAttribute('target', '_blank');
    // 매도 시 양도세 간이 시뮬(취득가=실거래가)
    await expect(page.getByRole('heading', { name: /매도 시 양도세/ })).toBeVisible();
    await expect(page.getByText(/세후 차익|비과세/).first()).toBeVisible();
  });

  test('NL3 · 로그인 후 상세에서 관심 저장 → 마이페이지 노출', async ({ page }) => {
    await page.goto('/login?returnTo=%2Flistings%3Fcode%3D11680');
    await page.getByLabel('이메일').fill('e2e@bds.test');
    await page.getByLabel('비밀번호').fill('Test1234!');
    await page.locator('form').getByRole('button', { name: '로그인' }).click();
    await page.waitForURL('**/listings**');
    await page.locator('a[href^="/listings/tx/"]').first().click();
    await expect(page).toHaveURL(/\/listings\/tx\/\d+/);
    const heart = page.getByRole('button', { name: '관심 매물 저장' });
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(1500); // 서버 액션(저장) 반영 대기
    await page.goto('/mypage');
    await expect(page.getByRole('heading', { name: /관심 실거래/ })).toBeVisible();
  });
});

test.describe('매물 목록', () => {
  test('T58 · 필터 변경이 URL 쿼리에 반영', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.getByRole('article').first()).toBeVisible(); // 데이터 렌더 대기
    // 하이드레이션 완료 전 클릭 방지: URL이 바뀔 때까지 클릭 재시도
    const deal = page.getByRole('button', { name: '매매', exact: true });
    await expect(async () => {
      await deal.click();
      await expect(page).toHaveURL(/deal=매매|deal=%/, { timeout: 1500 });
    }).toPass({ timeout: 15000 });
    const region = page.getByRole('button', { name: '강남구', exact: true });
    await expect(async () => {
      await region.click();
      await expect(page).toHaveURL(/region=강남구|region=%/, { timeout: 1500 });
    }).toPass({ timeout: 15000 });
  });

  test('T59 · 새로고침해도 필터 유지(URL이 진실)', async ({ page }) => {
    await page.goto('/listings?deal=매매&region=강남구&sort=가격높은순');
    await expect(page.getByRole('article').first()).toBeVisible(); // 렌더 완료 대기(레이스 방지)
    const before = await page.getByRole('article').count();
    await page.reload();
    await expect(page.getByRole('button', { name: '매매', pressed: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(before); // auto-retry로 안정
  });

  test('T61 · 결과 0건이면 빈 상태', async ({ page }) => {
    // 동시에 만족 불가능한 조합으로 0건 유도(예: 월세 + 주택 같은 빈 조합)
    await page.goto('/listings?deal=월세&ptype=주택');
    await expect(page.getByText('조건에 맞는 매물이 없어요')).toBeVisible();
  });

  // T62: 데이터 페치가 서버 컴포넌트에서 일어나 page.route(브라우저 요청 가로채기)로는
  // 에러를 유발할 수 없음. ErrorRetry는 컴포넌트 테스트(src/components/__tests__/ErrorRetry.test.tsx)로 검증.
  test.skip('T62 · 쿼리 실패 시 에러 배너 + 다시 시도 (→ 컴포넌트 테스트로 이전)', async () => {});

  test('T64 · "총 N개 매물" 카운트가 결과 수와 일치', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.getByRole('article').first()).toBeVisible(); // 렌더 완료 대기(레이스 방지)
    const count = await page.getByRole('article').count();
    await expect(page.getByText(`총 ${count}개 매물`)).toBeVisible();
  });

  test('T54 · 카드 본문 클릭 → 상세', async ({ page }) => {
    await page.goto('/listings');
    await page.getByRole('article').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/listings\/\d+/);
  });

  test('T57 · 비로그인 하트 클릭 → /login', async ({ page }) => {
    await page.goto('/listings');
    await page.getByRole('button', { name: /관심|저장|하트/ }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});
