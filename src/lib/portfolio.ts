/**
 * 보유 자산 포트폴리오 집계 — 임대 현금흐름 + 계약 만기 알림. 순수 로직.
 * 금액 단위 만원.
 */
import type { Property } from '@/lib/types';
import { leaseStatus } from '@/lib/rental';

/** 임대 물건의 월 임대수입 합(만원). */
export function monthlyRentTotal(properties: Property[]): number {
  return properties.reduce((s, p) => s + (p.is_rental ? p.monthly_rent || 0 : 0), 0);
}

export interface Cashflow {
  monthlyRent: number;  // 월 임대수입(만원)
  monthlyTax: number;   // 월 보유세(연 보유세 / 12, 만원)
  netMonthly: number;   // 월 순현금흐름(만원)
}

/** 월 순현금흐름 = 월 임대수입 − (연 보유세 / 12). */
export function cashflow(monthlyRentManwon: number, annualHoldingTaxManwon: number): Cashflow {
  const monthlyTax = Math.round((annualHoldingTaxManwon / 12) * 10) / 10;
  return {
    monthlyRent: monthlyRentManwon,
    monthlyTax,
    netMonthly: Math.round((monthlyRentManwon - monthlyTax) * 10) / 10,
  };
}

export interface LeaseAlerts {
  soon: Property[];     // 60일 이내 만기(경과 제외)
  expired: Property[];  // 만기 경과
  count: number;        // 주의 대상 총 건수
}

/** 계약 만기 임박/경과 자산 추출(임대 물건 + lease_end 있는 것). */
export function leaseAlerts(properties: Property[], now: Date): LeaseAlerts {
  const soon: Property[] = [];
  const expired: Property[] = [];
  for (const p of properties) {
    if (!p.is_rental || !p.lease_end) continue;
    const ls = leaseStatus(p.lease_end, now);
    if (!ls) continue;
    if (ls.expired) expired.push(p);
    else if (ls.soon) soon.push(p);
  }
  return { soon, expired, count: soon.length + expired.length };
}
