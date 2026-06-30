/**
 * v5 — 취득세 계산(tax.ts): 가격구간·보유주택수·조정지역·85㎡ 중과.
 */
import { describe, it, expect } from 'vitest';
import { acquisitionTax, baseRate, isAdjustedRegion } from '@/lib/tax';

describe('isAdjustedRegion', () => {
  it('강남·서초·송파·용산만 조정', () => {
    expect(isAdjustedRegion('강남구')).toBe(true);
    expect(isAdjustedRegion('용산구')).toBe(true);
    expect(isAdjustedRegion('마포구')).toBe(false);
    expect(isAdjustedRegion('영등포구')).toBe(false);
  });
});

describe('baseRate', () => {
  it('구간', () => {
    expect(baseRate(5)).toBe(1);
    expect(baseRate(7.5)).toBe(2);   // 7.5*2/3-3 = 2
    expect(baseRate(12)).toBe(3);
  });
});

describe('acquisitionTax', () => {
  it('무주택→1주택 5억 84㎡: 1% + 0.1% = 1.1%', () => {
    const t = acquisitionTax(5, 84, 1, false);
    expect(t.acqRatePct).toBe(1);
    expect(t.totalRatePct).toBe(1.1);
    expect(t.total).toBeCloseTo(0.055, 3);
    expect(t.farmRatePct).toBe(0); // 85 이하 농특세 없음
  });

  it('1주택→2주택 조정(강남) 15억 84㎡: 8% 중과 + 0.4% = 8.4%', () => {
    const t = acquisitionTax(15, 84, 2, true);
    expect(t.acqRatePct).toBe(8);
    expect(t.heavy).toBe(true);
    expect(t.totalRatePct).toBe(8.4);
    expect(t.total).toBeCloseTo(1.26, 2);
  });

  it('2주택→3주택 조정 15억 90㎡(85초과): 12% + 0.4% + 1.0% = 13.4%', () => {
    const t = acquisitionTax(15, 90, 3, true);
    expect(t.acqRatePct).toBe(12);
    expect(t.farmRatePct).toBe(1.0);
    expect(t.totalRatePct).toBe(13.4);
  });

  it('비조정(마포) 2주택 12억 84㎡: 일반세율(9억초과 3%) = 3.3%', () => {
    const t = acquisitionTax(12, 84, 2, false);
    expect(t.acqRatePct).toBe(3);
    expect(t.totalRatePct).toBe(3.3);
  });

  it('비조정 3주택 7억 84㎡: 8% 중과', () => {
    expect(acquisitionTax(7, 84, 3, false).acqRatePct).toBe(8);
  });

  it('85㎡ 초과 일반세율: 농특세 0.2% 추가', () => {
    const t = acquisitionTax(5, 100, 1, false);
    expect(t.farmRatePct).toBe(0.2);
    expect(t.totalRatePct).toBe(1.3);
  });

  it('생애최초 감면: 무주택 5억 → 취득세 0.05에서 200만원(0.02) 감면', () => {
    const t = acquisitionTax(5, 84, 1, false, { firstTime: true });
    expect(t.reduction).toBeCloseTo(0.02, 4);
    expect(t.acqTax).toBeCloseTo(0.03, 4); // 0.05 - 0.02
    expect(t.total).toBeCloseTo(0.035, 4); // 0.03 + 지방교육세 0.005
    expect(t.label).toContain('생애최초');
  });

  it('생애최초: 12억 초과면 감면 없음', () => {
    expect(acquisitionTax(13, 84, 1, false, { firstTime: true }).reduction).toBe(0);
  });

  it('일시적 2주택: 조정 15억이라도 8% 중과 대신 일반세율(3%)', () => {
    const t = acquisitionTax(15, 84, 2, true, { temporary2: true });
    expect(t.acqRatePct).toBe(3);
    expect(t.heavy).toBe(false);
    expect(t.totalRatePct).toBe(3.3);
    expect(t.label).toContain('일시적');
  });

  it('일시적 2주택 옵션은 3주택엔 영향 없음', () => {
    expect(acquisitionTax(15, 84, 3, true, { temporary2: true }).acqRatePct).toBe(12);
  });
});
