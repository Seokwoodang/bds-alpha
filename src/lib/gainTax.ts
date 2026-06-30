// 양도소득세 계산 — 주택, 1세대 기준 간이. 단위: 억(과세표준 누진은 만원으로 계산).
// 양도차익 → 장기보유특별공제 → 기본공제(250만) → 누진세율 → 지방소득세(10%).
// 1세대1주택 비과세(2년보유·12억), 단기세율(1년70%·2년60%), 다주택 중과(+20/30%p, 유예 토글).

export interface GainInput {
  buyEok: number;        // 취득가(억)
  sellEok: number;       // 양도가(억)
  holdYears: number;     // 보유 연수
  liveYears: number;     // 거주 연수
  oneHouse: boolean;     // 1세대 1주택
  expensesEok?: number;  // 필요경비(취득세 등, 억)
  houses?: number;       // 양도 시점 보유 주택 수(다주택 중과 판정용)
  heavyMulti?: boolean;  // 다주택 중과 적용(기본 false = 한시 배제 유예)
}

export interface GainResult {
  gain: number;          // 양도차익(억)
  taxableGain: number;   // 과세대상 양도차익(1세대1주택 12억 초과 안분 반영)
  ltdRatePct: number;    // 장기보유특별공제율(%)
  ltd: number;           // 장특공(억)
  base: number;          // 과세표준(억)
  rateLabel: string;     // 세율 설명
  incomeTax: number;     // 산출세액(억)
  localTax: number;      // 지방소득세(억)
  total: number;         // 총 세액(억)
  netGain: number;       // 세후 차익(억)
  effectivePct: number;  // 양도차익 대비 실효세율(%)
  exempt: boolean;       // 비과세 여부
}

const BASIC_DEDUCT = 0.025; // 기본공제 250만원 = 0.025억
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const r2 = (n: number) => Math.round(n * 100) / 100;

// 누진세율(과세표준 만원 단위) → 산출세액(만원)
function progressive(baseManwon: number): number {
  const b = Math.max(0, baseManwon);
  const T: [number, number, number][] = [
    [1400, 0.06, 0], [5000, 0.15, 126], [8800, 0.24, 576], [15000, 0.35, 1544],
    [30000, 0.38, 1994], [50000, 0.40, 2594], [100000, 0.42, 3594], [Infinity, 0.45, 6594],
  ];
  for (const [cap, rate, ded] of T) if (b <= cap) return b * rate - ded;
  return 0;
}

/** 장기보유특별공제율(%). 1세대1주택: 보유4%+거주4%(각 최대40%, 합80%). 일반: 보유 연2%(최대30%). 3년 미만 0. */
export function ltdRate(holdYears: number, liveYears: number, oneHouse: boolean): number {
  if (holdYears < 3) return 0;
  if (oneHouse) {
    const hold = Math.min(40, holdYears * 4);
    const live = liveYears >= 2 ? Math.min(40, liveYears * 4) : 0;
    return Math.min(80, hold + live);
  }
  return Math.min(30, holdYears * 2);
}

export function gainTax(input: GainInput): GainResult {
  const gain = r4(input.sellEok - input.buyEok - (input.expensesEok ?? 0));
  const empty = (over: Partial<GainResult> = {}): GainResult => ({
    gain, taxableGain: 0, ltdRatePct: 0, ltd: 0, base: 0, rateLabel: '비과세', incomeTax: 0, localTax: 0, total: 0,
    netGain: r4(gain), effectivePct: 0, exempt: true, ...over,
  });

  if (gain <= 0) return empty({ rateLabel: '차익 없음', exempt: false });

  // 1세대1주택 비과세: 2년 이상 보유 + 12억 이하 → 전액 비과세
  if (input.oneHouse && input.holdYears >= 2 && input.sellEok <= 12) return empty();

  // 과세대상 양도차익: 1세대1주택 12억 초과분만 안분 과세
  const taxableGain = input.oneHouse && input.sellEok > 12
    ? r4(gain * (input.sellEok - 12) / input.sellEok)
    : gain;

  // 단기세율(주택): 1년 미만 70%, 2년 미만 60% — 장특공 없음
  let incomeTax: number; let ltdRatePct = 0; let ltd = 0; let base: number; let rateLabel: string;
  const shortRate = input.holdYears < 1 ? 70 : input.holdYears < 2 ? 60 : 0;
  if (shortRate) {
    base = r4(Math.max(0, taxableGain - BASIC_DEDUCT));
    incomeTax = r4(base * shortRate / 100);
    rateLabel = `단기 ${shortRate}% (${input.holdYears < 1 ? '1년 미만' : '2년 미만'})`;
  } else {
    ltdRatePct = input.heavyMulti ? 0 : ltdRate(input.holdYears, input.liveYears, input.oneHouse);
    ltd = r4(taxableGain * ltdRatePct / 100);
    base = r4(Math.max(0, taxableGain - ltd - BASIC_DEDUCT));
    incomeTax = r4(progressive(base * 10000) / 10000);
    rateLabel = '기본 누진세율(6~45%)';
    if (input.heavyMulti && (input.houses ?? 0) >= 2) {
      const surcharge = (input.houses ?? 0) >= 3 ? 30 : 20;
      incomeTax = r4(incomeTax + base * surcharge / 100);
      rateLabel = `다주택 중과(+${surchargeLabel(input.houses ?? 0)}%p)`;
    }
  }
  const localTax = r4(incomeTax * 0.1);
  const total = r4(incomeTax + localTax);
  return {
    gain, taxableGain, ltdRatePct, ltd, base, rateLabel, incomeTax, localTax, total,
    netGain: r4(gain - total), effectivePct: r2(gain > 0 ? (total / gain) * 100 : 0), exempt: false,
  };
}

function surchargeLabel(houses: number): number { return houses >= 3 ? 30 : 20; }
