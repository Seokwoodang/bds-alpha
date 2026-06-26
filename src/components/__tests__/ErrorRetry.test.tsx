// @vitest-environment jsdom
/**
 * T62 (컴포넌트) — 에러 상태 UI. 서버 페치 실패 시 error.tsx가 렌더하는 ErrorRetry 검증.
 * role=alert + "다시 시도" 버튼 + reset 콜백.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorRetry } from '@/components/ErrorRetry';

afterEach(cleanup);

describe('ErrorRetry', () => {
  it('role=alert 배너와 "다시 시도" 버튼을 렌더한다', () => {
    render(<ErrorRetry reset={() => {}} message="매물을 불러오지 못했어요." />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('매물을 불러오지 못했어요.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('"다시 시도" 클릭 시 reset 콜백을 호출한다', () => {
    const reset = vi.fn();
    render(<ErrorRetry reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
