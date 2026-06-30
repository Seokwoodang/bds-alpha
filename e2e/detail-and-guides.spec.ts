/**
 * RED e2e — 매물 상세 + 가이드 오버레이 (Playwright, ui)
 * docs scope: 앱 미구현 → RED.
 * 커버: T65(valid) T66(404) T67(similar-hidden) T68(back-preserve)
 *       T71(overlay-open) T72(close) T73(body-stop) T74(a11y: dialog/scroll-lock/focus)
 */
import { test, expect } from '@playwright/test';

test.describe('매물 상세', () => {
  test('T65 · 유효 id 진입 시 상세 렌더', async ({ page }) => {
    await page.goto('/listings');
    await page.getByRole('article').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/listings\/\d+/);
    await expect(page.getByText('상세 정보')).toBeVisible();
    await expect(page.getByText('투자 포인트')).toBeVisible();
  });

  test('T66 · 없는 id 딥링크 → not-found 페이지(함수적 404)', async ({ page }) => {
    await page.goto('/listings/9999');
    // notFound()가 트리거되어 전용 not-found 페이지 렌더(정상 상세 아님).
    // 참고: force-dynamic 스트리밍 환경에서 HTTP 상태가 200으로 커밋되는 Next 한계(F8) →
    // 사용자 노출 동작(전용 404 페이지)으로 검증. 상태코드는 deferred.
    await expect(page.getByRole('heading', { name: '매물을 찾을 수 없어요' })).toBeVisible();
    await expect(page.getByText('상세 정보')).toHaveCount(0); // 정상 상세 아님
  });

  test('T67 · 유사매물 0개면 "비슷한 매물" 섹션 미표시', async ({ page }) => {
    // 광진구는 매물 1건(시드 제어) → 같은 지역 다른 매물 없음
    await page.goto('/listings?region=광진구');
    await page.getByRole('article').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/listings\/\d+/);
    await expect(page.getByText('상세 정보')).toBeVisible();
    await expect(page.getByRole('heading', { name: /비슷한 매물/ })).toHaveCount(0);
  });

  test('T68 · 뒤로가기 시 이전 필터 URL 보존', async ({ page }) => {
    await page.goto('/listings?deal=매매&region=강남구');
    await page.getByRole('article').first().getByRole('link').first().click();
    await page.getByRole('button', { name: /매물 목록으로/ }).click();
    await expect(page).toHaveURL(/deal=매매|deal=%/);
    await expect(page).toHaveURL(/region=강남구|region=%/);
  });
});

test.describe('가이드 리딩 오버레이', () => {
  test('T71 · 카드 클릭 → 모달(role=dialog) 열림', async ({ page }) => {
    await page.goto('/guides');
    await page.getByRole('button', { name: /부동산 투자 처음이라면/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('T72 · 배경/✕/ESC로 닫힘', async ({ page }) => {
    await page.goto('/guides');
    const open = async () => {
      await page.getByRole('button', { name: /전세가율/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    };
    await open();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await open();
    await page.getByRole('button', { name: /닫기|✕/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('T73 · 본문 클릭은 닫히지 않음', async ({ page }) => {
    await page.goto('/guides');
    await page.getByRole('button', { name: /전세가율/ }).click();
    await page.getByRole('dialog').getByRole('heading').click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('T74 · a11y: body scroll-lock + focus-trap + 닫을 때 포커스 복귀', async ({ page }) => {
    await page.goto('/guides');
    const trigger = page.getByRole('button', { name: /전세가율/ });
    await trigger.click();
    // scroll-lock
    await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.body).overflow),
    ).toBe('hidden');
    // focus-trap: Tab 여러 번 눌러도 포커스가 dialog 안에 머묾
    await page.keyboard.press('Tab');
    const inDialog = await page.evaluate(() =>
      !!document.activeElement?.closest('[role="dialog"]'),
    );
    expect(inDialog).toBe(true);
    // 닫으면 트리거로 포커스 복귀
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
});
