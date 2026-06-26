import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
    coverage: {
      provider: 'v8',
      all: true, // import 안 된 파일도 0%로 분모에 포함(정석)
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/**/*.d.ts',
        'src/lib/types.ts', // 런타임 코드 없는 타입 전용
      ],
      reporter: ['text', 'text-summary'],
    },
  },
});
