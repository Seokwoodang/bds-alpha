// 주택 유상취득(매매) 취득세 계산 — 1세대 기준, 2024 룰 간이. 단위: 억.
// 취득세 + 지방교육세 + 농어촌특별세(전용85㎡ 초과). 조정대상지역·보유주택수 중과,
// 생애최초 감면(무주택·12억 이하·최대 200만원), 일시적 2주택(일반세율) 반영.

export const ADJUSTED_REGIONS = new Set(['강남구', '서초구', '송파구', '용산구']);
export function isAdjustedRegion(region: string): boolean {
  return ADJUSTED_REGIONS.has(region);
}

// 조정대상지역 LAWD 코드(강남·서초·송파·용산). 전국 코드 기반 판정용.
export const ADJUSTED_CODES = new Set(['11680', '11650', '11710', '11170']);
export function isAdjustedCode(code: string): boolean {
  return ADJUSTED_CODES.has(code);
}

/** 일반세율(%) — 가격 구간. 6~9억은 1~3% 슬라이딩. */
export function baseRate(priceEok: number): number {
  if (priceEok <= 6) return 1;
  if (priceEok <= 9) return Math.round((priceEok * 2 / 3 - 3) * 100) / 100;
  return 3;
}

export interface TaxOptions {
  firstTime?: boolean;   // 생애최초(무주택) 감면 신청
  temporary2?: boolean;  // 일시적 2주택(종전주택 처분 예정) — 신규주택 일반세율
}

export interface TaxResult {
  acqRatePct: number;
  eduRatePct: number;
  farmRatePct: number;
  totalRatePct: number;  // 실효 합계 %(감면 반영)
  acqTax: number;        // 취득세 본세(감면 후, 억)
  eduTax: number;
  farmTax: number;
  reduction: number;     // 생애최초 감면액(억)
  total: number;         // 총 세액(억)
  heavy: boolean;
  label: string;
}

const FIRST_TIME_CAP = 0.02; // 200만원 = 0.02억
const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

export function acquisitionTax(priceEok: number, area: number, housesAfter: number, adjusted: boolean, opts: TaxOptions = {}): TaxResult {
  // 일시적 2주택: 취득후 2주택이지만 종전 처분 예정 → 1주택 일반세율로 판정
  const effHouses = opts.temporary2 && housesAfter === 2 ? 1 : housesAfter;

  let acqRatePct: number;
  let label: string;
  if (effHouses <= 1) {
    acqRatePct = baseRate(priceEok);
    label = opts.temporary2 && housesAfter === 2 ? '일시적 2주택(일반세율)' : '1주택 일반세율';
  } else if (effHouses === 2) {
    if (adjusted) { acqRatePct = 8; label = '조정 2주택 중과'; }
    else { acqRatePct = baseRate(priceEok); label = '비조정 2주택 일반세율'; }
  } else if (effHouses === 3) {
    if (adjusted) { acqRatePct = 12; label = '조정 3주택 중과'; }
    else { acqRatePct = 8; label = '비조정 3주택 중과'; }
  } else { acqRatePct = 12; label = `${effHouses}주택 중과`; }

  const heavy = acqRatePct === 8 || acqRatePct === 12;
  const eduRatePct = heavy ? 0.4 : r2(acqRatePct * 0.1);
  let farmRatePct = 0;
  if (area > 85) farmRatePct = acqRatePct === 12 ? 1.0 : acqRatePct === 8 ? 0.6 : 0.2;

  let acqTax = priceEok * acqRatePct / 100;
  const eduTax = priceEok * eduRatePct / 100;
  const farmTax = priceEok * farmRatePct / 100;

  // 생애최초 감면: 무주택(취득후 1주택) + 12억 이하 + 일반세율. 취득세 본세 최대 200만원 감면.
  let reduction = 0;
  if (opts.firstTime && housesAfter === 1 && priceEok <= 12 && !heavy) {
    reduction = Math.min(acqTax, FIRST_TIME_CAP);
    acqTax -= reduction;
    label = '생애최초 감면';
  }

  const total = acqTax + eduTax + farmTax;
  return {
    acqRatePct, eduRatePct, farmRatePct,
    totalRatePct: r2(priceEok > 0 ? (total / priceEok) * 100 : 0),
    acqTax: r4(acqTax), eduTax: r4(eduTax), farmTax: r4(farmTax),
    reduction: r4(reduction), total: r4(total), heavy, label,
  };
}
