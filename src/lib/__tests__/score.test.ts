import { describe, it, expect } from 'vitest';
import { investScore, rankRegions, scoreBadge, type RegionStat } from '@/lib/score';

const base: RegionStat = { code: '11680', sale: 10, ratio: 50, chg3: 0, volRecent: 100, volPrev: 100, txCount: 500 };

describe('investScore', () => {
  it('상승 + 거래증가 + 높은 전세가율 → 고득점', () => {
    const s = investScore({ ...base, chg3: 5, volRecent: 150, volPrev: 100, ratio: 70 });
    // momentum 1.0*40 + volume 1.0*30 + entry 1.0*30 = 100
    expect(s.score).toBe(100);
    expect(s.reasons.join()).toContain('3개월 +5%');
    expect(s.reasons.join()).toContain('거래량 +50%');
    expect(s.reasons.join()).toContain('전세가율 70%');
  });

  it('하락 + 거래급감 + 낮은 전세가율 → 저득점', () => {
    const s = investScore({ ...base, chg3: -5, volRecent: 40, volPrev: 100, ratio: 30 });
    expect(s.score).toBe(0);
  });

  it('중립(변화 없음, 전세가율 50%) → 중간 점수', () => {
    const s = investScore(base);
    // momentum 0.5*40=20 + volume 0.5*30=15 + entry 0.5*30=15 = 50
    expect(s.score).toBe(50);
  });

  it('모멘텀 데이터 없으면 중립 처리 + 근거 표기', () => {
    const s = investScore({ ...base, chg3: null });
    expect(s.reasons).toContain('추세 데이터 부족');
    expect(s.score).toBe(50);
  });

  it('표본 30건 미만은 저신뢰 플래그', () => {
    expect(investScore({ ...base, txCount: 10 }).lowSample).toBe(true);
    expect(investScore(base).lowSample).toBe(false);
  });
});

describe('rankRegions', () => {
  it('점수순 정렬 + 저신뢰는 뒤로', () => {
    const ranked = rankRegions([
      { ...base, code: 'A', chg3: 5, ratio: 70, volRecent: 150 },   // 고득점
      { ...base, code: 'B', chg3: -5, ratio: 30, volRecent: 40 },   // 저득점
      { ...base, code: 'C', chg3: 5, ratio: 70, volRecent: 150, txCount: 5 }, // 고득점이지만 저신뢰
    ]);
    expect(ranked.map((r) => r.code)).toEqual(['A', 'B', 'C']);
  });
});

describe('scoreBadge', () => {
  it('70+ 유망 / 50+ 보통 / 미만 주의', () => {
    expect(scoreBadge(75).label).toBe('유망');
    expect(scoreBadge(55).label).toBe('보통');
    expect(scoreBadge(40).label).toBe('주의');
  });
});
