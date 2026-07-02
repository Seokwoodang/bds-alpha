/**
 * 주택담보대출 한도 간이 계산 — LTV(담보) ∧ DSR(소득) 중 작은 값 + 수도권·규제지역 총액 상한.
 * 2025 6.27 대책 + 2026 스트레스 DSR 3단계 기준(간이·참고용). 정책·은행·신용에 따라 실제와 다를 수 있음.
 * 금액 단위: 억(원). 소득은 만원 입력 → 내부 억 환산.
 */

export type RegionKind = '규제' | '수도권' | '기타';
// 규제지역(투기과열·조정): 강남·서초·송파·용산 / 수도권: 서울·경기·인천 / 그 외: 기타
export function regionKindOf(code: string): RegionKind {
  if (['11680', '11650', '11710', '11170'].includes(code)) return '규제';
  const sido = code.slice(0, 2);
  if (['11', '41', '28'].includes(sido)) return '수도권';
  return '기타';
}

export interface LoanInput {
  priceEok: number;        // 집값(억)
  region: RegionKind;
  owned: number;           // 현재 보유 주택 수(0=무주택, 1=처분조건부 1주택, 2+=다주택)
  firstTime: boolean;      // 생애최초
  incomeManwon: number;    // 연소득(만원)
  existingAnnualManwon?: number; // 기존 대출 연 원리금(만원)
  ratePct: number;         // 대출 금리(%)
  years: number;           // 만기(년)
  variable?: boolean;      // 변동금리(스트레스 DSR 가산 대상)
}

export interface LoanResult {
  ltvPct: number;          // 적용 LTV(%)
  ltvByRatio: number;      // 집값×LTV (억)
  cap: number | null;      // 수도권·규제 총액 상한(억), 없으면 null
  ltvLimit: number;        // LTV 기준 한도(억) = min(집값×LTV, cap)
  dsrLimit: number;        // DSR 기준 한도(억)
  stressPct: number;       // 적용 스트레스 가산(%)
  finalLimit: number;      // 최종 한도(억) = min(LTV, DSR)
  blocked: boolean;        // 다주택 등으로 대출 불가
  binding: 'LTV' | 'DSR' | '금지';
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** LTV 비율(%). 무주택/1주택(처분조건)=owned<=1, 다주택=owned>=2. */
export function ltvPercent(region: RegionKind, owned: number, firstTime: boolean): number {
  if (owned >= 2) return region === '기타' ? 60 : 0;      // 다주택: 수도권·규제 금지, 비수도권 60%
  if (firstTime && owned === 0) return region === '기타' ? 80 : 70; // 생애최초(수도권·규제 80→70)
  return region === '규제' ? 50 : 70;                      // 무주택/1주택(처분조건)
}

/** 수도권·규제지역 총액 상한(억). 비수도권은 상한 없음(null). */
export function loanCap(region: RegionKind, priceEok: number): number | null {
  if (region === '기타') return null;
  if (priceEok <= 15) return 6;
  if (priceEok <= 25) return 4;
  return 2;
}

/** 스트레스 가산금리(%p). 변동금리 & 수도권·규제 시 1.5, 그 외 변동 0.75, 고정 0. */
export function stressAddon(region: RegionKind, variable: boolean): number {
  if (!variable) return 0;
  return region === '기타' ? 0.75 : 1.5;
}

/** DSR(연 원리금 ≤ 연소득×40%) 역산 → 대출 원금 한도(억). */
export function dsrLimitEok(incomeManwon: number, existingAnnualManwon: number, ratePct: number, years: number): number {
  const capAnnualEok = (incomeManwon * 0.4 - existingAnnualManwon) / 10000;
  if (capAnnualEok <= 0 || years <= 0) return 0;
  const i = ratePct / 100 / 12;
  const n = years * 12;
  const annualPerEok = i <= 0 ? 12 / n : (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) * 12; // 원금 1억당 연 상환액(억)
  return r2(capAnnualEok / annualPerEok);
}

export function loanLimit(input: LoanInput): LoanResult {
  const ltvPct = ltvPercent(input.region, input.owned, input.firstTime);
  const cap = loanCap(input.region, input.priceEok);
  const ltvByRatio = r2(input.priceEok * ltvPct / 100);
  const ltvLimit = cap != null ? Math.min(ltvByRatio, cap) : ltvByRatio;

  const stressPct = stressAddon(input.region, input.variable ?? true);
  const dsrLimit = dsrLimitEok(input.incomeManwon, input.existingAnnualManwon ?? 0, input.ratePct + stressPct, input.years);

  const blocked = ltvPct === 0;
  const finalLimit = blocked ? 0 : r2(Math.min(ltvLimit, dsrLimit));
  const binding: LoanResult['binding'] = blocked ? '금지' : dsrLimit < ltvLimit ? 'DSR' : 'LTV';
  return { ltvPct, ltvByRatio, cap, ltvLimit: r2(ltvLimit), dsrLimit, stressPct, finalLimit, blocked, binding };
}
