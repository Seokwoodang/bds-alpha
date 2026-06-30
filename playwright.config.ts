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
  // Playwright 번들 chromium 사용(VPN 끄고 정식 브라우저 설치 완료).
  // VPN on 환경(사내 인증서)에서 다운로드가 막히면 channel: 'chrome'로 시스템 Chrome을 쓸 수 있음.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: undefined } }],
  // webServer 미사용: 실행 중인 서버(`npm run start` 프로덕션, :3000)를 그대로 사용.
  // (dev 서버는 라우트별 콜드 컴파일이 느려 병렬 e2e에서 불안정 → 프로덕션 빌드로 검증.)
});
