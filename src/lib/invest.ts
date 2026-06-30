// 투자 시뮬레이터 순수 로직 (단위: 억). 취득세는 대략 반영(간이 구간).

export type InvestMode = 'gap' | 'live';

/** 취득세 대략(억). 간이 구간: <6억 1.1% · 6~9억 2.2% · ≥9억 3.3%. (전용85 초과·다주택 등은 단순화) */
export function acquisitionTax(saleEok: number): number {
  const rate = saleEok < 6 ? 0.011 : saleEok < 9 ? 0.022 : 0.033;
  return Math.round(saleEok * rate * 100) / 100;
}

/** 갭투자 필요 자기자본(억) = (매매−전세) + 취득세. 전세금이 매매대금 레버리지. */
export function gapNeed(saleEok: number, jeonseEok: number): number {
  return Math.round((saleEok - jeonseEok + acquisitionTax(saleEok)) * 100) / 100;
}

/** 실거주 매수 필요 자기자본(억) = 매매 + 취득세 − 대출. */
export function liveNeed(saleEok: number, loanEok: number): number {
  return Math.round((saleEok + acquisitionTax(saleEok) - loanEok) * 100) / 100;
}

export interface AffordResult { afford: boolean; need: number; margin: number }

/**
 * 예산 매칭. gap: 예산=자본+대출(전세 레버리지 외 추가 현금). live: 예산=자본(대출은 need에서 차감).
 * margin = 예산 − 필요자본(양수면 여유).
 */
export function canAfford(mode: InvestMode, saleEok: number, jeonseEok: number, capitalEok: number, loanEok: number): AffordResult {
  if (mode === 'gap') {
    const need = gapNeed(saleEok, jeonseEok);
    const budget = capitalEok + loanEok;
    return { afford: need <= budget, need, margin: Math.round((budget - need) * 100) / 100 };
  }
  const need = liveNeed(saleEok, loanEok);
  return { afford: need <= capitalEok, need, margin: Math.round((capitalEok - need) * 100) / 100 };
}
