/**
 * v4 e2e — 투자 추천 시뮬레이터 (Playwright, 라이브 Supabase)
 */
import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login?returnTo=%2Finvest');
  await page.getByLabel('이메일').fill('e2e@bds.test');
  await page.getByLabel('비밀번호').fill('Test1234!');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/invest**');
}

test('INV1 · 자본/대출 입력 → 진입 가능 지역·매물 추천', async ({ page }) => {
  await page.goto('/invest');
  // 충분한 예산이면 다수 지역 추천
  await page.getByLabel('보유 자본').fill('20');
  await page.getByLabel('대출 가능액').fill('10');
  await expect(page.getByRole('heading', { name: /진입 가능한 지역/ })).toBeVisible();
  await expect(page.getByText('강남구', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /예산 내 추천 매물/ })).toBeVisible();
});

test('INV2 · 갭/실거주 토글 + 예산 작으면 추천 줄어듦', async ({ page }) => {
  await page.goto('/invest');
  await page.getByRole('button', { name: '실거주 매수' }).click();
  await expect(page.getByRole('button', { name: '실거주 매수', pressed: true })).toBeVisible();
  // 자본 0 대출 0 → 진입 가능 지역 없음(빈 안내)
  await page.getByLabel('보유 자본').fill('0');
  await page.getByLabel('대출 가능액').fill('0');
  await expect(page.getByText(/진입 가능한 지역이 없|예산으로 진입/)).toBeVisible();
});

test('INV3 · 로그인 시 조건 저장 → 재방문 자동 채움', async ({ page }) => {
  await login(page);
  await page.getByLabel('보유 자본').fill('9');
  await page.getByRole('button', { name: '내 조건 저장' }).click();
  await expect(page.getByText(/저장됨/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('보유 자본')).toHaveValue('9');
});
