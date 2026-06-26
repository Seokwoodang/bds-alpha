import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'docs/spec-to-code/bds-alpha/v1/screenshots';
mkdirSync(OUT, { recursive: true });
const base = 'http://localhost:3000';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function shot(path, name) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('shot:', name);
}

await shot('/', 'home');
await shot('/listings', 'listings');
await shot('/listings?region=강남구&sort=가격높은순', 'listings-filtered');
await shot('/listings/1', 'detail');
await shot('/listings/9999', '404');
await shot('/prices?region=성동구', 'prices');
await shot('/guides', 'guides');
await shot('/map?region=마포구', 'map');
await shot('/login', 'login');

// 가이드 오버레이
await page.goto(base + '/guides', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /부동산 투자 처음이라면/ }).click();
await page.getByRole('dialog').waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/guide-overlay.png`, fullPage: false });
console.log('shot: guide-overlay');

// 로그인 → 하트 저장 → 마이페이지 검증
await page.goto(base + '/login?returnTo=%2Flistings', { waitUntil: 'networkidle' });
await page.getByLabel('이메일').fill('e2e@bds.test');
await page.getByLabel('비밀번호').fill('Test1234!');
await page.locator('form').getByRole('button', { name: '로그인' }).click();
await page.waitForURL('**/listings**');
console.log('logged in:', page.url());

// 첫 카드 하트 클릭(저장)
const firstHeart = page.getByRole('article').first().getByRole('button', { name: /관심/ });
await firstHeart.click();
await page.waitForTimeout(1200); // 서버 액션 + revalidate
await page.goto(base + '/mypage', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/mypage.png`, fullPage: true });
const savedCount = await page.getByRole('article').count();
console.log('mypage saved cards:', savedCount);

// 정리: 저장 토글 해제(테스트 반복 멱등)
await page.goto(base + '/listings', { waitUntil: 'networkidle' });

await browser.close();
console.log('DONE');
