/**
 * v4 — 투자 시뮬레이터 순수 로직(invest.ts): 필요자본·예산 매칭. (취득세는 taxEok 주입)
 */
import { describe, it, expect } from 'vitest';
import { gapNeed, liveNeed, canAfford } from '@/lib/invest';

describe('gapNeed', () => {
  it('갭 + 취득세(주입)', () => {
    // 매매 24, 전세 8 → 갭 16 + 취득세 0.79 = 16.79
    expect(gapNeed(24, 8, 0.79)).toBeCloseTo(16.79, 2);
  });
});

describe('liveNeed', () => {
  it('매매 + 취득세 − 대출', () => {
    // 매매 10 + 취득세 0.33 − 대출 6 = 4.33
    expect(liveNeed(10, 6, 0.33)).toBeCloseTo(4.33, 2);
  });
});

describe('canAfford', () => {
  it('갭투자: 예산=자본+대출', () => {
    // 매매 16, 전세 8 → 갭 8 + 취득세 0.53 = 8.53. 자본5+대출4=9 → 가능
    const r = canAfford('gap', 16, 8, 5, 4, 0.53);
    expect(r.afford).toBe(true);
    expect(r.need).toBeCloseTo(8.53, 2);
    expect(r.margin).toBeCloseTo(0.47, 2);
  });
  it('갭투자: 예산 부족이면 불가', () => {
    expect(canAfford('gap', 30, 8, 5, 4, 0.99).afford).toBe(false);
  });
  it('실거주: 예산=자본(대출 차감)', () => {
    // 매매 12 + 취득세 0.4 − 대출 7 = 5.4. 자본 6 → 가능
    const r = canAfford('live', 12, 7, 6, 7, 0.4);
    expect(r.afford).toBe(true);
    expect(r.need).toBeCloseTo(5.4, 2);
  });
  it('실거주: 자본 부족이면 불가', () => {
    expect(canAfford('live', 30, 10, 5, 10, 0.99).afford).toBe(false);
  });
});
