// 주택 유상취득(매매) 취득세 계산 — 1세대 기준, 2024 룰 간이. 단위: 억.
// 취득세 + 지방교육세 + 농어촌특별세(전용85㎡ 초과). 조정대상지역·보유주택수 중과 반영.

/** 조정대상지역(2024 기준 서울 4개 구). */
export const ADJUSTED_REGIONS = new Set(['강남구', '서초구', '송파구', '용산구']);
export function isAdjustedRegion(region: string): boolean {
  return ADJUSTED_REGIONS.has(region);
}

/** 일반세율(%) — 가격 구간. 6~9억은 1~3% 슬라이딩. */
export function baseRate(priceEok: number): number {
  if (priceEok <= 6) return 1;
  if (priceEok <= 9) return Math.round((priceEok * 2 / 3 - 3) * 100) / 100; // 1~3
  return 3;
}

export interface TaxResult {
  acqRatePct: number;   // 취득세율 %
  eduRatePct: number;   // 지방교육세 %
  farmRatePct: number;  // 농어촌특별세 %
  totalRatePct: number; // 합계 %
  acqTax: number;       // 억
  eduTax: number;
  farmTax: number;
  total: number;        // 총 세액(억)
  heavy: boolean;       // 중과 여부
  label: string;        // 설명(예: "조정 2주택 중과")
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * @param priceEok 매매가(억)
 * @param area 전용면적(㎡) — 85 초과 시 농특세
 * @param housesAfter 취득 후 총 보유 주택 수(이 매물 포함)
 * @param adjusted 조정대상지역 여부
 */
export function acquisitionTax(priceEok: number, area: number, housesAfter: number, adjusted: boolean): TaxResult {
  let acqRatePct: number;
  let label: string;
  if (housesAfter <= 1) { acqRatePct = baseRate(priceEok); label = '1주택 일반세율'; }
  else if (housesAfter === 2) {
    if (adjusted) { acqRatePct = 8; label = '조정 2주택 중과'; }
    else { acqRatePct = baseRate(priceEok); label = '비조정 2주택 일반세율'; }
  } else if (housesAfter === 3) {
    if (adjusted) { acqRatePct = 12; label = '조정 3주택 중과'; }
    else { acqRatePct = 8; label = '비조정 3주택 중과'; }
  } else { acqRatePct = 12; label = `${housesAfter}주택 중과`; }

  const heavy = acqRatePct === 8 || acqRatePct === 12;
  const eduRatePct = heavy ? 0.4 : r2(acqRatePct * 0.1); // 일반: 취득세율×0.1, 중과: 0.4
  let farmRatePct = 0;
  if (area > 85) farmRatePct = acqRatePct === 12 ? 1.0 : acqRatePct === 8 ? 0.6 : 0.2;
  const totalRatePct = r2(acqRatePct + eduRatePct + farmRatePct);

  return {
    acqRatePct, eduRatePct, farmRatePct, totalRatePct,
    acqTax: r4(priceEok * acqRatePct / 100),
    eduTax: r4(priceEok * eduRatePct / 100),
    farmTax: r4(priceEok * farmRatePct / 100),
    total: r4(priceEok * totalRatePct / 100),
    heavy, label,
  };
}
