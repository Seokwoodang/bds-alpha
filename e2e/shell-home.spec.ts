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

  test('HW1 · 홈 투자 위젯 — 예산에 따라 결과 변화 + 시도 필터 + 지도 하이라이트', async ({ page }) => {
    await page.goto('/');
    // 스코어 랭킹: 등급 배지 + 근거(전세가율/거래량) 노출
    await expect(page.getByText(/유망|보통|주의/).first()).toBeVisible();
    await expect(page.getByText(/전세가율 \d/).first()).toBeVisible();
    // 작은 예산 → 진입 가능 수 기록
    await page.getByLabel('홈 보유 자본').fill('1');
    await expect(page.getByText(/진입 가능 \d+곳 중/)).toBeVisible();
    const small = await page.getByText(/진입 가능 \d+곳 중/).textContent();
    // 큰 예산 → 진입 가능 수가 늘어나야 함(입력이 결과에 반영)
    await page.getByLabel('홈 보유 자본').fill('20');
    await page.getByLabel('홈 대출 가능액').fill('10');
    await expect(page.getByText(/필요자본 .*억/).first()).toBeVisible();
    const big = await page.getByText(/진입 가능 \d+곳 중/).textContent();
    expect(Number(big!.match(/\d+/)![0])).toBeGreaterThan(Number(small!.match(/\d+/)![0]));
    // 지도 하이라이트 범례
    await expect(page.getByText(/굵은 테두리 = 내 예산 진입 가능/)).toBeVisible();
    // 시도 필터 → 추천이 해당 시도만
    await page.getByLabel('홈 시도 필터').selectOption('서울특별시');
    await expect(page.getByText(/진입 가능 \d+곳 중/)).toBeVisible();
    const firstRec = page.locator('a[href^="/prices?code="]').filter({ hasText: '필요자본' }).first();
    await expect(firstRec).toContainText('서울');
  });

  test('MAP3 · 지도 오버레이 중복 선택 — 규제지역·유망 빗금 동시 표시', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('img', { name: '전국 시군구 시세 지도' })).toBeVisible();
    // 규제지역 토글 → 빨간 빗금 4개(강남·서초·송파·용산)
    await page.getByRole('button', { name: /규제지역/ }).click();
    await expect(page.locator('path[data-overlay="reg"]')).toHaveCount(4);
    // 유망 토글 추가(중복 선택) → 규제 빗금 유지 + 유망 빗금 표시
    await page.getByRole('button', { name: /유망 70점\+/ }).click();
    await expect(page.locator('path[data-overlay="reg"]')).toHaveCount(4);
    await expect(page.locator('path[data-overlay="prom"]').first()).toBeVisible();
    // 범례 동시 표기
    await expect(page.getByText(/빨간 빗금 = 규제지역/)).toBeVisible();
    await expect(page.getByText(/주황 빗금 = 유망/)).toBeVisible();
  });

  test('T87 · 홈 지역 검색 자동완성 → 선택 시 /prices?code=', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('지역 검색').fill('해운대');
    await page.getByRole('option', { name: /해운대구/ }).click();
    await expect(page).toHaveURL(/\/prices\?code=26350/);
  });

  test('T88 · 지역 검색 Enter → 첫 제안으로 이동, 미일치 안내', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('지역 검색');
    await input.fill('없는지역명');
    await expect(page.getByText('일치하는 지역이 없어요')).toBeVisible();
    await input.fill('분당');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/prices\?code=41135/);
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
