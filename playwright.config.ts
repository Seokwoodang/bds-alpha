import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // 환경상 Playwright 브라우저 다운로드가 막혀(사내 인증서) 시스템 Chrome 사용.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  // webServer 미사용: 실행 중인 서버(`npm run start` 프로덕션, :3000)를 그대로 사용.
  // (dev 서버는 라우트별 콜드 컴파일이 느려 병렬 e2e에서 불안정 → 프로덕션 빌드로 검증.)
});
