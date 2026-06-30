/**
 * 보유세 간이 계산 — 재산세(주택분) + 종합부동산세.
 * 모든 금액 단위는 만원. 1억 = 10,000만.
 *
 * 한계(간이): 공시가격은 시세 기반 추정(현실화율 근사), 세부담상한·재산세 중복공제·
 * 고령자/장기보유 세액공제·지역자원시설세는 미반영. 실제 고지액과 차이가 있을 수 있음.
 */

/** 공동주택 현실화율 근사 — 시세(억) → 공시가격(억). */
export const ASSESSED_RATIO = 0.69;
export function assessedFromMarket(marketEok: number): number {
  return Math.round(marketEok * ASSESSED_RATIO * 100) / 100;
}

/** 재산세 주택 공정시장가액비율: 1세대1주택은 공시가 구간별 특례(43~45%), 그 외 60%. */
export function propertyFairRatio(assessedEok: number, singleHome: boolean): number {
  if (!singleHome) return 0.6;
  if (assessedEok <= 3) return 0.43;
  if (assessedEok <= 6) return 0.44;
  return 0.45;
}

interface Bracket { upTo: number; rate: number; acc: number } // upTo·acc = 만원, rate = 비율

// 재산세 본세 누진(과세표준 만원). 표준세율.
const RP_STD: Bracket[] = [
  { upTo: 6000, rate: 0.001, acc: 0 },
  { upTo: 15000, rate: 0.0015, acc: 6 },
  { upTo: 30000, rate: 0.0025, acc: 19.5 },
  { upTo: Infinity, rate: 0.004, acc: 57 },
];
// 1세대1주택 특례세율(공시 9억 이하). 각 구간 -0.05%p.
const RP_SPECIAL: Bracket[] = [
  { upTo: 6000, rate: 0.0005, acc: 0 },
  { upTo: 15000, rate: 0.001, acc: 3 },
  { upTo: 30000, rate: 0.002, acc: 12 },
  { upTo: Infinity, rate: 0.0035, acc: 42 },
];

function progressiveAcc(baseManwon: number, table: Bracket[]): number {
  let prev = 0;
  for (const b of table) {
    if (baseManwon <= b.upTo) return b.acc + (baseManwon - prev) * b.rate;
    prev = b.upTo;
  }
  return 0;
}

export interface PropertyTax {
  assessedEok: number;   // 적용 공시가격(억)
  taxBaseManwon: number; // 과세표준(만원)
  base: number;          // 재산세 본세(만원)
  urban: number;         // 재산세 도시지역분(만원)
  eduTax: number;        // 지방교육세(만원)
  total: number;         // 합계(만원)
}

/**
 * 주택분 재산세(연) 추정. assessedEok=공시가격(억), singleHome=1세대1주택 특례 적용 여부.
 * 특례세율은 공시 9억 이하에서만 적용.
 */
export function propertyTax(assessedEok: number, singleHome: boolean): PropertyTax | null {
  if (!(assessedEok > 0)) return null;
  const ratio = propertyFairRatio(assessedEok, singleHome);
  const taxBase = assessedEok * 10000 * ratio; // 만원
  const useSpecial = singleHome && assessedEok <= 9;
  const base = progressiveAcc(taxBase, useSpecial ? RP_SPECIAL : RP_STD);
  const urban = taxBase * 0.0014;   // 도시지역분 0.14%
  const eduTax = base * 0.2;        // 지방교육세 = 본세 × 20%
  const r = (n: number) => Math.round(n * 10) / 10;
  return { assessedEok, taxBaseManwon: Math.round(taxBase), base: r(base), urban: r(urban), eduTax: r(eduTax), total: r(base + urban + eduTax) };
}

// 종합부동산세 주택 누진(과세표준 만원).
const CRET_GENERAL: Bracket[] = [ // 2주택 이하
  { upTo: 30000, rate: 0.005, acc: 0 },
  { upTo: 60000, rate: 0.007, acc: 150 },
  { upTo: 120000, rate: 0.01, acc: 360 },
  { upTo: 250000, rate: 0.013, acc: 960 },
  { upTo: 500000, rate: 0.015, acc: 2650 },
  { upTo: 940000, rate: 0.02, acc: 6400 },
  { upTo: Infinity, rate: 0.027, acc: 15200 },
];
const CRET_HEAVY: Bracket[] = [ // 3주택 이상 중과
  { upTo: 30000, rate: 0.005, acc: 0 },
  { upTo: 60000, rate: 0.007, acc: 150 },
  { upTo: 120000, rate: 0.01, acc: 360 },
  { upTo: 250000, rate: 0.02, acc: 960 },
  { upTo: 500000, rate: 0.03, acc: 3460 },
  { upTo: 940000, rate: 0.04, acc: 10960 },
  { upTo: Infinity, rate: 0.05, acc: 28560 },
];

export interface ComprehensiveTax {
  totalAssessedEok: number; // 보유 주택 공시가 합(억)
  deductionEok: number;     // 공제(1주택 12억 / 그 외 9억)
  taxBaseManwon: number;    // 과세표준(만원)
  tax: number;              // 종부세(농특세 제외, 만원)
  taxable: boolean;
}

/**
 * 종합부동산세(연, 인별 합산) 간이 추정.
 * totalAssessedEok=보유 주택 공시가 합(억), houseCount=주택 수, singleHousehold1=1세대1주택 해당 여부.
 * 공제: 1세대1주택 12억, 그 외 9억. 공정시장가액비율 60%. 3주택 이상은 중과 세율.
 */
export function comprehensiveRealEstateTax(totalAssessedEok: number, houseCount: number, singleHousehold1: boolean): ComprehensiveTax {
  const deductionEok = singleHousehold1 && houseCount === 1 ? 12 : 9;
  const excessEok = Math.max(0, totalAssessedEok - deductionEok);
  const taxBase = excessEok * 10000 * 0.6; // 만원
  const table = houseCount >= 3 ? CRET_HEAVY : CRET_GENERAL;
  const tax = progressiveAcc(taxBase, table);
  return {
    totalAssessedEok: Math.round(totalAssessedEok * 100) / 100,
    deductionEok,
    taxBaseManwon: Math.round(taxBase),
    tax: Math.round(tax * 10) / 10,
    taxable: taxBase > 0,
  };
}
