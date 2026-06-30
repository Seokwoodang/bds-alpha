import { describe, it, expect } from 'vitest';
import { assessedFromMarket, propertyFairRatio, propertyTax, comprehensiveRealEstateTax } from '@/lib/holdingTax';

describe('assessedFromMarket', () => {
  it('시세 → 공시가 근사(현실화율 0.69)', () => {
    expect(assessedFromMarket(10)).toBeCloseTo(6.9, 5);
  });
});

describe('propertyFairRatio', () => {
  it('다주택은 60%', () => {
    expect(propertyFairRatio(10, false)).toBe(0.6);
  });
  it('1세대1주택 구간별 특례', () => {
    expect(propertyFairRatio(3, true)).toBe(0.43);
    expect(propertyFairRatio(6, true)).toBe(0.44);
    expect(propertyFairRatio(8, true)).toBe(0.45);
  });
});

describe('propertyTax (재산세)', () => {
  it('공시 10억 다주택 — 표준세율', () => {
    const t = propertyTax(10, false)!;
    // 과표 60,000만 → 본세 57 + 30000*0.004=177, 도시 84, 교육 35.4
    expect(t.taxBaseManwon).toBe(60000);
    expect(t.base).toBeCloseTo(177, 1);
    expect(t.urban).toBeCloseTo(84, 1);
    expect(t.eduTax).toBeCloseTo(35.4, 1);
    expect(t.total).toBeCloseTo(296.4, 1);
  });
  it('공시 5억 1세대1주택 — 특례세율(44%·감면구간)', () => {
    const t = propertyTax(5, true)!;
    expect(t.taxBaseManwon).toBe(22000);
    expect(t.base).toBeCloseTo(26, 1);
    expect(t.total).toBeCloseTo(62, 1);
  });
  it('공시가 0 → null', () => {
    expect(propertyTax(0, false)).toBeNull();
  });
});

describe('comprehensiveRealEstateTax (종부세)', () => {
  it('1주택 공시 12억 이하 → 비과세', () => {
    const c = comprehensiveRealEstateTax(10, 1, true);
    expect(c.taxable).toBe(false);
    expect(c.tax).toBe(0);
    expect(c.deductionEok).toBe(12);
  });
  it('1주택 공시 20억 → 과표 4.8억, 종부세 276만', () => {
    const c = comprehensiveRealEstateTax(20, 1, true);
    expect(c.taxBaseManwon).toBe(48000);
    expect(c.tax).toBeCloseTo(276, 1);
  });
  it('3주택 합산 20억 → 9억 공제 + 중과세율', () => {
    const c = comprehensiveRealEstateTax(20, 3, false);
    expect(c.deductionEok).toBe(9);
    expect(c.taxBaseManwon).toBe(66000);
    expect(c.tax).toBeCloseTo(420, 1);
  });
});
