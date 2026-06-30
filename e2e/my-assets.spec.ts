/**
 * v2 e2e — 내 자산(보유 집) 등록·수정·삭제 (Playwright, ui, 라이브 Supabase)
 * 커버: 등록→표시, 검증 오류, 수정, 삭제, 비로그인 가드.
 * 전제: 확인된 e2e 계정(e2e@bds.test) + properties 테이블. clean-saved.mjs로 사전 정리.
 */
import { test, expect, type Page } from '@playwright/test';

const NAME = '테스트보유집';

async function login(page: Page) {
  await page.goto('/login?returnTo=%2Fmypage');
  await page.getByLabel('이메일').fill('e2e@bds.test');
  await page.getByLabel('비밀번호').fill('Test1234!');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/mypage**');
}

test('PA1 · 비로그인 시 /mypage(내 자산 포함) → /login', async ({ page }) => {
  await page.goto('/mypage');
  await expect(page).toHaveURL(/\/login/);
});

test('PA2 · 자산 등록 → 목록 표시 → 수정 → 삭제', async ({ page }) => {
  await login(page);

  // 등록
  await page.getByRole('button', { name: '+ 자산 추가' }).click();
  await page.getByLabel('단지명/별칭').fill(NAME);
  await page.getByLabel('지역').selectOption('강남구');
  await page.getByLabel('매물 유형').selectOption('아파트');
  await page.getByLabel('전용면적 (㎡)').fill('84');
  await page.getByLabel('매입가 (만원)').fill('245000');
  await page.getByLabel('매입일').fill('2023-04-25');
  await page.getByRole('button', { name: '추가' }).click();

  // 표시 확인
  const card = page.locator('section', { hasText: '내 보유 자산' }).locator('div', { hasText: NAME }).first();
  await expect(page.getByText(NAME).first()).toBeVisible();
  await expect(page.getByText('24억 5,000').first()).toBeVisible();

  // 수정 (카드의 '수정' 버튼 → 폼 열림 → 폼 내부 '수정' 제출)
  await page.getByRole('button', { name: '수정' }).first().click();
  await expect(page.getByLabel('단지명/별칭')).toHaveValue(NAME);
  await page.getByLabel('전용면적 (㎡)').fill('99');
  await page.locator('form').getByRole('button', { name: '수정' }).click();
  await expect(page.getByText('99㎡', { exact: false }).first()).toBeVisible();

  // 삭제(confirm 수락)
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '삭제' }).first().click();
  await expect(page.getByText(NAME)).toHaveCount(0);
});

test('PA4 · 양도세 계산기 — 1세대1주택 비과세 / 해제 시 과세', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: '양도세 계산기' })).toBeVisible();
  // 기본(1세대1주택, 8억, 5년) → 비과세
  await expect(page.getByText('비과세 — 양도세 0원')).toBeVisible();
  // 1세대1주택 해제 → 과세(총 양도세 표시)
  await page.getByRole('checkbox', { name: '1세대 1주택' }).uncheck();
  await expect(page.getByText('총 양도세')).toBeVisible();
});

test('PA3 · 빈 폼 제출 시 검증 오류 표시', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: '+ 자산 추가' }).click();
  await page.getByRole('button', { name: '추가' }).click();
  await expect(page.getByText('단지명/별칭을 입력하세요.')).toBeVisible();
  await expect(page.getByText('지역을 선택하세요.')).toBeVisible();
});
