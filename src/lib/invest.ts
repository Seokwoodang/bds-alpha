// 투자 시뮬레이터 순수 로직 (단위: 억). 취득세는 tax.ts에서 계산해 taxEok로 주입.

export type InvestMode = 'gap' | 'live';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** 갭투자 필요 자기자본(억) = (매매−전세) + 취득세. */
export function gapNeed(saleEok: number, jeonseEok: number, taxEok: number): number {
  return r2(saleEok - jeonseEok + taxEok);
}

/** 실거주 매수 필요 자기자본(억) = 매매 + 취득세 − 대출. */
export function liveNeed(saleEok: number, loanEok: number, taxEok: number): number {
  return r2(saleEok + taxEok - loanEok);
}

export interface AffordResult { afford: boolean; need: number; margin: number }

/**
 * 예산 매칭. gap: 예산=자본+대출. live: 예산=자본(대출은 need에서 차감).
 * taxEok: 취득세 등 부대비용(tax.ts의 acquisitionTax().total).
 */
export function canAfford(mode: InvestMode, saleEok: number, jeonseEok: number, capitalEok: number, loanEok: number, taxEok: number): AffordResult {
  if (mode === 'gap') {
    const need = gapNeed(saleEok, jeonseEok, taxEok);
    const budget = capitalEok + loanEok;
    return { afford: need <= budget, need, margin: r2(budget - need) };
  }
  const need = liveNeed(saleEok, loanEok, taxEok);
  return { afford: need <= capitalEok, need, margin: r2(capitalEok - need) };
}
