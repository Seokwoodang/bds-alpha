import { describe, it, expect } from 'vitest';
import { monthlyRentTotal, cashflow, leaseAlerts } from '@/lib/portfolio';
import type { Property } from '@/lib/types';

function prop(over: Partial<Property>): Property {
  return {
    id: over.id ?? 'x', user_id: 'u', name: over.name ?? 'p', region: '강남구', dong: null,
    type: '아파트', area: 84, purchase_price: 100000, purchase_date: '2024-01-01', memo: null,
    is_rental: false, deposit: 0, monthly_rent: 0, rent_day: null, lease_start: null, lease_end: null,
    created_at: '2024-01-01', ...over,
  };
}

describe('monthlyRentTotal', () => {
  it('임대 물건 월세만 합산', () => {
    const ps = [
      prop({ is_rental: true, monthly_rent: 300 }),
      prop({ is_rental: true, monthly_rent: 150 }),
      prop({ is_rental: false, monthly_rent: 999 }), // 비임대 제외
    ];
    expect(monthlyRentTotal(ps)).toBe(450);
  });
});

describe('cashflow', () => {
  it('월 순현금흐름 = 월세 − 연보유세/12', () => {
    const c = cashflow(450, 240); // 연 240만 → 월 20만
    expect(c.monthlyTax).toBeCloseTo(20, 1);
    expect(c.netMonthly).toBeCloseTo(430, 1);
  });
  it('보유세가 월세보다 크면 음수', () => {
    expect(cashflow(10, 600).netMonthly).toBeCloseTo(-40, 1);
  });
});

describe('leaseAlerts', () => {
  const now = new Date('2026-06-30T09:00:00');
  it('임박(≤60일)·경과 분류, 비임대/만기없음 제외', () => {
    const ps = [
      prop({ id: 'a', is_rental: true, lease_end: '2026-07-20' }), // D-20 임박
      prop({ id: 'b', is_rental: true, lease_end: '2026-06-01' }), // 경과
      prop({ id: 'c', is_rental: true, lease_end: '2026-12-31' }), // 여유
      prop({ id: 'd', is_rental: false, lease_end: '2026-07-01' }),// 비임대 제외
      prop({ id: 'e', is_rental: true, lease_end: null }),         // 만기없음 제외
    ];
    const a = leaseAlerts(ps, now);
    expect(a.soon.map((p) => p.id)).toEqual(['a']);
    expect(a.expired.map((p) => p.id)).toEqual(['b']);
    expect(a.count).toBe(2);
  });
});
