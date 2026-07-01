/**
 * RED e2e — 인증/관심매물 + 시세 (Playwright, ui)
 * docs scope: 앱 미구현 → RED.
 * 커버: T77(login-success+returnTo) T78(login-fail) T79(signup-validation)
 *       T81(logout) T82(mypage-redirect) T83(social-graceful) T84(header-badge)
 *       T70(prices region-sync) T76(map→prices)
 * 주의: 인증 테스트는 테스트 전용 Supabase 계정/시드 필요(GREEN 단계 환경 설정).
 */
import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL ?? 'e2e@bds.test';
const TEST_PW = process.env.E2E_PW ?? 'Test1234!';
// 폼 안의 '로그인' 제출 버튼(모드 탭과 이름이 같아 form으로 스코프).
const submitBtn = (page: Page) => page.locator('form').getByRole('button', { name: '로그인' });

test.describe('인증', () => {
  test('T82 · 비로그인 /mypage 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/mypage');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fmypage|\/login/);
  });

  test('T78 · 잘못된 자격 로그인 → 인라인 에러, 폼 유지', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill('nobody@example.com');
    await page.getByLabel('비밀번호').fill('wrongpw');
    await submitBtn(page).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('T79 · 빈/형식오류 제출 → 검증 메시지로 차단', async ({ page }) => {
    await page.goto('/login');
    await submitBtn(page).click();
    await expect(page.getByText(/이메일.*입력|필수/)).toBeVisible();
  });

  test('T83 · 소셜 provider 미설정 시 안내(크래시 없음)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Google|구글/ }).click();
    // provider 미설정이면 에러 페이지가 아니라 안내(준비 중 등)
    await expect(page.getByText(/준비 중|설정/)).toBeVisible();
  });

  test('T77 · 로그인 성공 → returnTo 복귀 + 헤더 전환', async ({ page }) => {
    await page.goto('/login?returnTo=%2Flistings');
    await page.getByLabel('이메일').fill(TEST_EMAIL);
    await page.getByLabel('비밀번호').fill(TEST_PW);
    await submitBtn(page).click();
    await expect(page).toHaveURL(/\/listings/);
    await expect(page.getByRole('button', { name: /로그아웃/ })).toBeVisible();
  });

  test('T84 · 로그인 시 savedCount 배지 표시', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill(TEST_EMAIL);
    await page.getByLabel('비밀번호').fill(TEST_PW);
    await submitBtn(page).click();
    await expect(page.getByLabel(/관심목록/)).toContainText(/\d+/);
  });
});

test.describe('시세 / 지도', () => {
  test('T70 · 칩/막대 클릭 시 지역·차트·URL 동기화', async ({ page }) => {
    await page.goto('/prices');
    await expect(page.getByText('지역별 시세 비교')).toBeVisible();
    // 하이드레이션 완료 전 클릭 방지: URL 바뀔 때까지 재시도
    const chip = page.getByRole('button', { name: '성동구', exact: true });
    await expect(async () => {
      await chip.click();
      await expect(page).toHaveURL(/region=성동구|region=%/, { timeout: 1500 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByText(/성동구 평균 매매가/)).toBeVisible();
    // 차트 SVG로 스코프(dev 인디케이터 SVG 노이즈 제외). area + line = 2 path.
    await expect(page.locator('svg[viewBox="0 0 760 300"] path')).toHaveCount(2, { timeout: 5000 });
  });

  test('WK1 · 시세 추이 월간/주간 토글 → 주간 차트 렌더', async ({ page }) => {
    await page.goto('/prices?region=강남구');
    await expect(page.getByText(/강남구 시세 추이/)).toBeVisible();
    const weekBtn = page.getByRole('button', { name: '주간', exact: true });
    await expect(async () => {
      await weekBtn.click();
      await expect(page.getByRole('button', { name: '주간', pressed: true })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByText(/최근 26주/)).toBeVisible();
    // 차트 path 2개(area+line) 렌더
    await expect(page.locator('svg[viewBox="0 0 760 300"] path')).toHaveCount(2, { timeout: 8000 });
  });

  test('GAP1 · 시세 화면에 갭 투자 분석(전세가율) 표시', async ({ page }) => {
    await page.goto('/prices?region=강남구');
    await expect(page.getByText('갭 투자 분석')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('전세가율 높은 순', { exact: false })).toBeVisible();
  });

  test('CMP1 · 지역비교 — 지역 선택 시 비교표(전세가율·갭) 렌더', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: '지역 비교' })).toBeVisible();
    // 기본 2개 지역 선택 상태로 비교표가 렌더됨
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: '전세가율' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '갭(매매−전세)' })).toBeVisible();
    // 3번째 지역 추가 → 컬럼 증가
    const third = page.getByRole('button', { name: '마포구', exact: true });
    await third.click();
    await expect(third).toHaveAttribute('aria-pressed', 'true');
  });

  test('T76 · 지도 "상세 시세 분석 →" → /prices?region', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('link', { name: /상세 시세 분석/ }).click();
    await expect(page).toHaveURL(/\/prices\?region=/);
  });
});
