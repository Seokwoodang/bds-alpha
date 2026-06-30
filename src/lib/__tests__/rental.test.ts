import { describe, it, expect } from 'vitest';
import { rentalYield, leaseStatus, nextRentDate, rentText } from '@/lib/rental';

describe('rentalYield', () => {
  it('표면/실질 수익률 계산(보증금 차감)', () => {
    // 매입 10억(100,000만), 보증금 1억(10,000만), 월세 300만
    const r = rentalYield(100_000, 10_000, 300)!;
    expect(r.annualRentManwon).toBe(3_600);
    expect(r.grossPct).toBeCloseTo(3.6, 5);       // 3,600 / 100,000
    expect(r.investedManwon).toBe(90_000);
    expect(r.netPct).toBeCloseTo(4.0, 5);          // 3,600 / 90,000
  });

  it('월세 0 또는 매입가 0이면 null', () => {
    expect(rentalYield(0, 0, 100)).toBeNull();
    expect(rentalYield(100_000, 0, 0)).toBeNull();
  });

  it('보증금 ≥ 매입가면 net은 null(표면은 산출)', () => {
    const r = rentalYield(50_000, 50_000, 100)!;
    expect(r.netPct).toBeNull();
    expect(r.grossPct).toBeGreaterThan(0);
  });
});

describe('leaseStatus', () => {
  const now = new Date('2026-06-30T09:00:00');
  it('만기 미래 → D-day · 임박 판정(≤60일)', () => {
    expect(leaseStatus('2026-08-01', now)!.dday).toBe(32);
    expect(leaseStatus('2026-08-01', now)!.soon).toBe(true);
    expect(leaseStatus('2026-12-31', now)!.soon).toBe(false);
  });
  it('만기 지남 → expired + "만기 +N일"', () => {
    const s = leaseStatus('2026-06-25', now)!;
    expect(s.expired).toBe(true);
    expect(s.label).toBe('만기 +5일');
  });
  it('당일 → D-DAY', () => {
    expect(leaseStatus('2026-06-30', now)!.label).toBe('D-DAY');
  });
  it('만기 미입력 → null', () => {
    expect(leaseStatus(null, now)).toBeNull();
  });
});

describe('nextRentDate', () => {
  it('이번 달 수령일이 아직이면 이번 달', () => {
    const now = new Date('2026-06-10T09:00:00');
    const n = nextRentDate(25, now)!;
    expect(n.date).toBe('2026-06-25');
    expect(n.dday).toBe(15);
  });
  it('이번 달 수령일이 지났으면 다음 달', () => {
    const now = new Date('2026-06-28T09:00:00');
    expect(nextRentDate(25, now)!.date).toBe('2026-07-25');
  });
  it('말일 보정(31일 → 2월은 28/29일)', () => {
    const now = new Date('2026-02-01T09:00:00');
    expect(nextRentDate(31, now)!.date).toBe('2026-02-28');
  });
  it('수령일 미설정 → null', () => {
    expect(nextRentDate(null, new Date('2026-06-10'))).toBeNull();
  });
});

describe('rentText', () => {
  it('천단위 콤마 + 만/월', () => {
    expect(rentText(85)).toBe('85만/월');
    expect(rentText(1200)).toBe('1,200만/월');
  });
});
