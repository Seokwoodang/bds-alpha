/**
 * v6 — 양도소득세(gainTax.ts): 비과세·장특공·단기세율·누진·다주택중과.
 */
import { describe, it, expect } from 'vitest';
import { gainTax, ltdRate } from '@/lib/gainTax';

describe('ltdRate', () => {
  it('1세대1주택 10년 보유+10년 거주 = 80%', () => { expect(ltdRate(10, 10, true)).toBe(80); });
  it('1세대1주택 3년 보유+0 거주 = 12%', () => { expect(ltdRate(3, 0, true)).toBe(12); });
  it('일반 15년 = 30%(상한)', () => { expect(ltdRate(15, 0, false)).toBe(30); });
  it('3년 미만 = 0', () => { expect(ltdRate(2, 2, true)).toBe(0); });
});

describe('gainTax', () => {
  it('1세대1주택 12억 이하·2년↑ → 비과세', () => {
    const r = gainTax({ buyEok: 5, sellEok: 10, holdYears: 5, liveYears: 5, oneHouse: true });
    expect(r.exempt).toBe(true);
    expect(r.total).toBe(0);
  });

  it('1세대1주택 20억(12억 초과 안분) 10년+10년: 장특공 80%', () => {
    const r = gainTax({ buyEok: 10, sellEok: 20, holdYears: 10, liveYears: 10, oneHouse: true });
    expect(r.taxableGain).toBeCloseTo(4, 2);   // 10 × 8/20
    expect(r.ltdRatePct).toBe(80);
    expect(r.incomeTax).toBeCloseTo(0.1284, 3);
    expect(r.total).toBeCloseTo(0.1412, 3);
  });

  it('다주택 일반(중과 유예) 5억 차익 4년 보유: 누진 40% 구간', () => {
    const r = gainTax({ buyEok: 5, sellEok: 10, holdYears: 4, liveYears: 0, oneHouse: false });
    expect(r.ltdRatePct).toBe(8);
    expect(r.incomeTax).toBeCloseTo(1.5706, 3);
    expect(r.total).toBeCloseTo(1.7277, 3);
  });

  it('단기(1년 미만) 70% + 장특공 없음', () => {
    const r = gainTax({ buyEok: 5, sellEok: 6, holdYears: 0.5, liveYears: 0, oneHouse: false });
    expect(r.ltd).toBe(0);
    expect(r.incomeTax).toBeCloseTo(0.6825, 3); // (1-0.025)*70%
    expect(r.total).toBeCloseTo(0.7508, 3);
  });

  it('다주택 중과 적용 시 장특공 배제 + 가산', () => {
    const base = gainTax({ buyEok: 5, sellEok: 12, holdYears: 5, liveYears: 0, oneHouse: false });
    const heavy = gainTax({ buyEok: 5, sellEok: 12, holdYears: 5, liveYears: 0, oneHouse: false, houses: 3, heavyMulti: true });
    expect(heavy.ltdRatePct).toBe(0);          // 중과 시 장특공 배제
    expect(heavy.total).toBeGreaterThan(base.total);
  });

  it('차익 없으면 세금 0', () => {
    const r = gainTax({ buyEok: 10, sellEok: 9, holdYears: 3, liveYears: 0, oneHouse: false });
    expect(r.total).toBe(0);
    expect(r.exempt).toBe(false);
  });
});
