/**
 * RED→GREEN e2e — 공통 셸 · 홈 · 반응형 · 하트 a11y · 로그아웃
 * 커버: T85(nav-active) T86(variant-A) T87(home search) T88(quick chip)
 *       T89(footer) T90(responsive) T55/T56(heart aria+keyboard) T81(logout)
 */
import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login?returnTo=%2Flistings');
  await page.getByLabel('이메일').fill('e2e@bds.test');
  await page.getByLabel('비밀번호').fill('Test1234!');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/listings**');
}

test.describe('공통 셸 / 홈', () => {
  test('T85 · nav 활성 항목 하이라이트(aria-current), detail은 무강조', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.getByRole('link', { name: '매물', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.goto('/listings/1');
    await expect(page.getByRole('link', { name: '매물', exact: true })).not.toHaveAttribute('aria-current', 'page');
  });

  test('T86 · 홈은 기능형(전국 지도) — 마케팅 히어로 없음', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '전국 부동산 투자 지도' })).toBeVisible();
    await expect(page.getByText(/감이 아니라|데이터로 검증하는/)).toHaveCount(0);
    await expect(page.getByRole('img', { name: '전국 시군구 시세 지도' })).toBeVisible();
  });

  test('HW1 · 홈 투자 위젯 — 자본 입력 → 즉시 지역 추천 + 스코어 랭킹 근거', async ({ page }) => {
    await page.goto('/');
    // 스코어 랭킹: 등급 배지 + 근거(전세가율/거래량) 노출
    await expect(page.getByText(/유망|보통|주의/).first()).toBeVisible();
    await expect(page.getByText(/전세가율 \d/).first()).toBeVisible();
    // 미니 위젯: 입력 즉시 추천
    await page.getByLabel('홈 보유 자본').fill('20');
    await page.getByLabel('홈 대출 가능액').fill('10');
    await expect(page.getByText(/필요자본 .*억/).first()).toBeVisible();
  });

  test('T87 · 홈 검색 제출 → /listings?q=', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('매물 검색').fill('청담');
    await page.getByRole('button', { name: '검색' }).click();
    await expect(page).toHaveURL(/\/listings\?q=/);
  });

  test('T88 · 빠른 지역 칩 → /listings?region=', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '마포구' }).click();
    await expect(page).toHaveURL(/\/listings\?region=/);
  });

  test('T89 · 푸터 3컬럼 정적 링크', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.getByText('서비스', { exact: true })).toBeVisible();
    await expect(footer.getByText('회사', { exact: true })).toBeVisible();
    await expect(footer.getByText('고객지원', { exact: true })).toBeVisible();
  });

  test('T90 · 모바일 폭에서 가로 스크롤 없음(유체 반응형)', async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await page.goto('/listings');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});

test.describe('하트 a11y / 로그아웃', () => {
  test('T55·T56 · 하트 aria-pressed 토글 + 키보드 동작, 카드 이동과 분리', async ({ page }) => {
    await login(page);
    const heart = page.getByRole('article').first().getByRole('button', { name: /관심/ });
    const before = await heart.getAttribute('aria-pressed');
    await heart.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/listings/); // 상세로 이동하지 않음(분리)
    await expect(heart).not.toHaveAttribute('aria-pressed', before ?? 'false');
    // 원복(멱등)
    await heart.click();
  });

  test('T81 · 로그아웃 → 세션 제거 + 로그인 링크 노출', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });
});
