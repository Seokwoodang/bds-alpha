import { describe, it, expect } from 'vitest';
import { regionKindOf, ltvPercent, loanCap, dsrLimitEok, loanLimit } from '@/lib/loan';

describe('regionKindOf', () => {
  it('강남4구=규제, 서울/경기/인천=수도권, 그외=기타', () => {
    expect(regionKindOf('11680')).toBe('규제'); // 강남
    expect(regionKindOf('11110')).toBe('수도권'); // 종로(서울 비규제)
    expect(regionKindOf('41135')).toBe('수도권'); // 분당(경기)
    expect(regionKindOf('26350')).toBe('기타');   // 부산 해운대
  });
});

describe('ltvPercent', () => {
  it('무주택/1주택: 규제 50 / 그외 70', () => {
    expect(ltvPercent('규제', 0, false)).toBe(50);
    expect(ltvPercent('수도권', 1, false)).toBe(70);
    expect(ltvPercent('기타', 0, false)).toBe(70);
  });
  it('생애최초: 수도권·규제 70 / 비수도권 80', () => {
    expect(ltvPercent('규제', 0, true)).toBe(70);
    expect(ltvPercent('수도권', 0, true)).toBe(70);
    expect(ltvPercent('기타', 0, true)).toBe(80);
  });
  it('다주택: 수도권·규제 0(금지) / 비수도권 60', () => {
    expect(ltvPercent('규제', 2, false)).toBe(0);
    expect(ltvPercent('수도권', 3, false)).toBe(0);
    expect(ltvPercent('기타', 2, false)).toBe(60);
  });
});

describe('loanCap', () => {
  it('수도권·규제 총액 상한(6/4/2억), 비수도권 없음', () => {
    expect(loanCap('수도권', 10)).toBe(6);
    expect(loanCap('규제', 20)).toBe(4);
    expect(loanCap('수도권', 30)).toBe(2);
    expect(loanCap('기타', 30)).toBeNull();
  });
});

describe('dsrLimitEok', () => {
  it('연소득 6천·금리4%·30년 → 약 4.1~4.3억', () => {
    const v = dsrLimitEok(6000, 0, 4, 30);
    expect(v).toBeGreaterThan(4.0);
    expect(v).toBeLessThan(4.4);
  });
  it('기존 대출 상환액이 크면 한도 감소', () => {
    expect(dsrLimitEok(6000, 1200, 4, 30)).toBeLessThan(dsrLimitEok(6000, 0, 4, 30));
  });
  it('소득 대비 기존상환이 40% 이상이면 0', () => {
    expect(dsrLimitEok(5000, 2000, 4, 30)).toBe(0);
  });
});

describe('loanLimit', () => {
  it('비수도권 무주택 5억·고소득 → LTV(3.5억)가 상한', () => {
    const r = loanLimit({ priceEok: 5, region: '기타', owned: 0, firstTime: false, incomeManwon: 12000, ratePct: 4, years: 30, variable: false });
    expect(r.ltvPct).toBe(70);
    expect(r.ltvLimit).toBe(3.5);
    expect(r.finalLimit).toBe(3.5);
    expect(r.binding).toBe('LTV');
  });
  it('규제지역 20억 → LTV 50%=10억이나 총액상한 4억으로 제한', () => {
    const r = loanLimit({ priceEok: 20, region: '규제', owned: 0, firstTime: false, incomeManwon: 30000, ratePct: 4, years: 30, variable: false });
    expect(r.cap).toBe(4);
    expect(r.ltvLimit).toBe(4);
  });
  it('규제·수도권 다주택 → 대출 금지(0)', () => {
    const r = loanLimit({ priceEok: 10, region: '수도권', owned: 2, firstTime: false, incomeManwon: 20000, ratePct: 4, years: 30 });
    expect(r.blocked).toBe(true);
    expect(r.finalLimit).toBe(0);
    expect(r.binding).toBe('금지');
  });
  it('저소득이면 DSR이 상한', () => {
    const r = loanLimit({ priceEok: 8, region: '기타', owned: 0, firstTime: false, incomeManwon: 3000, ratePct: 4, years: 30, variable: false });
    expect(r.binding).toBe('DSR');
    expect(r.finalLimit).toBeLessThan(r.ltvLimit);
  });
  it('변동금리+수도권이면 스트레스 1.5%p 가산', () => {
    const r = loanLimit({ priceEok: 10, region: '수도권', owned: 0, firstTime: false, incomeManwon: 8000, ratePct: 4, years: 30, variable: true });
    expect(r.stressPct).toBe(1.5);
  });
});
