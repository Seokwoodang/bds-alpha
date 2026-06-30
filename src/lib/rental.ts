/**
 * 임대(월세) 수익률·계약 만기·월세 수령일 계산 — 순수 로직.
 * 금액 단위는 만원, 수익률은 %.
 */

/**
 * 임대수익률(연, %).
 * - 표면수익률(gross) = (월세 × 12) / 매입가 × 100
 * - 실질수익률(net)   = (월세 × 12) / (매입가 − 보증금) × 100  ← 보증금은 회수되는 자금이므로 실투자금에서 차감
 * 보증금이 매입가 이상이거나 매입가가 0이면 net은 null(분모 비정상).
 */
export interface RentalYield {
  grossPct: number;
  netPct: number | null;
  annualRentManwon: number;
  investedManwon: number; // 실투자금(매입가 − 보증금)
}

export function rentalYield(purchaseManwon: number, depositManwon: number, monthlyRentManwon: number): RentalYield | null {
  if (!(purchaseManwon > 0) || !(monthlyRentManwon > 0)) return null;
  const annual = monthlyRentManwon * 12;
  const invested = purchaseManwon - depositManwon;
  const grossPct = Math.round((annual / purchaseManwon) * 1000) / 10;
  const netPct = invested > 0 ? Math.round((annual / invested) * 1000) / 10 : null;
  return { grossPct, netPct, annualRentManwon: annual, investedManwon: invested };
}

/** 두 날짜 사이의 일수(b - a), 자정 기준. */
function daysBetween(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const a0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((b0 - a0) / MS);
}

export interface LeaseStatus {
  dday: number;        // 만기까지 남은 일수(음수면 이미 지남)
  expired: boolean;
  soon: boolean;       // 60일 이내 임박
  label: string;       // "D-42" / "D-DAY" / "만기 +5일"
}

/** 계약 만기 D-day 계산. leaseEnd 없으면 null. */
export function leaseStatus(leaseEnd: string | null, now: Date): LeaseStatus | null {
  if (!leaseEnd) return null;
  const end = new Date(leaseEnd + 'T00:00:00');
  if (Number.isNaN(end.getTime())) return null;
  const dday = daysBetween(now, end);
  const expired = dday < 0;
  const label = dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `만기 +${-dday}일`;
  return { dday, expired, soon: dday >= 0 && dday <= 60, label };
}

export interface NextRent {
  date: string;  // YYYY-MM-DD
  dday: number;  // 다음 수령일까지 남은 일수(오늘이면 0)
  label: string; // "매월 25일 · D-7"
}

/**
 * 다음 월세 수령일. rentDay(1~31) 기준, 이번 달 수령일이 아직 안 지났으면 이번 달, 지났으면 다음 달.
 * 해당 월에 그 일자가 없으면(예: 31일 → 2월) 말일로 보정.
 */
export function nextRentDate(rentDay: number | null, now: Date): NextRent | null {
  if (rentDay == null || !(rentDay >= 1 && rentDay <= 31)) return null;
  const y = now.getFullYear();
  const m = now.getMonth();
  const clamp = (yy: number, mm: number) => Math.min(rentDay, new Date(yy, mm + 1, 0).getDate());
  let target = new Date(y, m, clamp(y, m));
  if (daysBetween(now, target) < 0) {
    const ny = m === 11 ? y + 1 : y;
    const nm = m === 11 ? 0 : m + 1;
    target = new Date(ny, nm, clamp(ny, nm));
  }
  const dday = daysBetween(now, target);
  const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  return { date: iso, dday, label: `매월 ${rentDay}일 · ${dday === 0 ? '오늘' : `D-${dday}`}` };
}

/** 월세(만원) 표시: "85만/월" / "1,200만/월"(상가·지산 고액 대비). */
export function rentText(monthlyRentManwon: number): string {
  return `${monthlyRentManwon.toLocaleString('ko-KR')}만/월`;
}
