/**
 * 지역 투자 스코어(0~100) — 단일 지표(전세가율)가 아닌 종합 판단.
 *  - 모멘텀 40점: 최근3개월 vs 이전3개월 중위가 변화율(-5%→0점, +5%→만점)
 *  - 거래량 30점: 최근3개월/이전3개월 거래 건수 비율(0.5배→0점, 1.5배→만점) — 거래가 붙으며 오르는 곳이 진짜 수요
 *  - 진입성 30점: 전세가율(30%→0점, 70%→만점) — 갭이 작아 적은 자본으로 진입
 * 데이터가 부족한 축은 중립(절반) 처리하고 근거에 표기. 표본 30건 미만은 저신뢰.
 */

export interface RegionStat {
  code: string;
  sale: number;               // 매매 중위가(억)
  ratio: number | null;       // 전세가율(%)
  chg3: number | null;        // 3개월 모멘텀(%)
  volRecent: number;          // 최근 3개월 거래 건수
  volPrev: number;            // 이전 3개월 거래 건수
  txCount: number;            // 전체 표본
}

export interface RegionScore {
  code: string;
  score: number;              // 0~100
  reasons: string[];          // 판단 근거(사용자 노출)
  lowSample: boolean;         // 표본 부족(신뢰 낮음)
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function investScore(s: RegionStat): RegionScore {
  const reasons: string[] = [];

  // 모멘텀 40
  let momentum = 0.5; // 데이터 부족 시 중립
  if (s.chg3 != null) {
    momentum = clamp01((s.chg3 + 5) / 10);
    reasons.push(`3개월 ${s.chg3 >= 0 ? '+' : ''}${s.chg3}%`);
  } else {
    reasons.push('추세 데이터 부족');
  }

  // 거래량 30
  let volume = 0.5;
  if (s.volPrev > 0) {
    const r = s.volRecent / s.volPrev;
    volume = clamp01((r - 0.5) / 1.0);
    const pct = Math.round((r - 1) * 100);
    reasons.push(`거래량 ${pct >= 0 ? '+' : ''}${pct}%`);
  }

  // 진입성 30
  let entry = 0;
  if (s.ratio != null) {
    entry = clamp01((s.ratio - 30) / 40);
    reasons.push(`전세가율 ${s.ratio}%`);
  }

  const score = Math.round(momentum * 40 + volume * 30 + entry * 30);
  return { code: s.code, score, reasons, lowSample: s.txCount < 30 };
}

/** 스코어 내림차순 정렬(저신뢰는 뒤로). */
export function rankRegions(stats: RegionStat[]): RegionScore[] {
  return stats.map(investScore).sort((a, b) => (Number(a.lowSample) - Number(b.lowSample)) || (b.score - a.score));
}

/** 점수 → 표시 등급/색. */
export function scoreBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: '유망', color: 'var(--up)' };
  if (score >= 50) return { label: '보통', color: 'var(--primary)' };
  return { label: '주의', color: '#D97706' };
}
