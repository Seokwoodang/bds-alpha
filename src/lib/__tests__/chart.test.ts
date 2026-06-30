/**
 * RED tests — 차트/KPI/막대/집계 (src/lib/chart.ts) · logic 레이어 (순수·결정적)
 * docs scope: 모듈 미구현 → RED.
 *
 * 계약(03-design §4):
 *   buildChart(basePrice): { line, area, dots[], xlabels[], grid[], viewBox, cur }
 *     - months 12개, data[i]=base*(0.94+0.012*i+0.018*sin(i*0.9))
 *     - dots: i%2===1 만 show=true / xlabels: i%2===0 만 show=true / grid: 5개
 *   kpiRules(region): [{label,value,color}, ...3]
 *   barHeight(price, max): number = 24 + (price/max)*150
 */
import { describe, it, expect } from 'vitest';
import { buildChart, buildSeriesChart, kpiRules, barHeight } from '@/lib/chart';
import type { Region } from '@/lib/types';

describe('buildChart', () => {
  it('T36 · 같은 basePrice면 항상 동일 결과(결정적)', () => {
    const a = buildChart(24.0);
    const b = buildChart(24.0);
    expect(a).toEqual(b);
  });
  it('T36 · 12개월 데이터 / viewBox 760×300', () => {
    const c = buildChart(24.0);
    expect(c.dots).toHaveLength(12);
    expect(c.xlabels).toHaveLength(12);
    expect(c.viewBox).toBe('0 0 760 300');
  });
  it('T37 · dots는 i%2===1(짝수번째 격점)만 show', () => {
    const c = buildChart(24.0);
    c.dots.forEach((d, i) => expect(d.show).toBe(i % 2 === 1));
  });
  it('T38 · xlabels는 i%2===0만 show', () => {
    const c = buildChart(24.0);
    c.xlabels.forEach((x, i) => expect(x.show).toBe(i % 2 === 0));
  });
  it('T39 · 가로 그리드 라인 5개', () => {
    expect(buildChart(24.0).grid).toHaveLength(5);
  });
});

describe('buildSeriesChart (실데이터 시계열)', () => {
  it('값 개수만큼 dots/xlabels, viewBox 760×300, cur=마지막값', () => {
    const vals = [26.6, 28.9, 25.0, 19.0, 21.3, 23.0, 24.0, 20.1, 23.0, 23.5, 21.5, 26.7, 27.0];
    const lbls = ['05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05'];
    const c = buildSeriesChart(vals, lbls);
    expect(c.dots).toHaveLength(13);
    expect(c.xlabels).toHaveLength(13);
    expect(c.viewBox).toBe('0 0 760 300');
    expect(c.cur).toBe('27.0');
    expect(c.grid).toHaveLength(5);
  });
  it('빈 시계열도 안전(throw 없음)', () => {
    expect(() => buildSeriesChart([], [])).not.toThrow();
  });
});

describe('kpiRules', () => {
  const mk = (price: number, change: number): Region => ({ name: 'X', price, change });
  it('T40 · 전국 평균 대비: price>15 → 높음, else 보통', () => {
    expect(kpiRules(mk(24, 1)).find((k) => k.label === '전국 평균 대비')?.value).toBe('높음');
    expect(kpiRules(mk(12, 1)).find((k) => k.label === '전국 평균 대비')?.value).toBe('보통');
  });
  it('T41 · 거래 활발도: change>1.5 → 활발, else 보통', () => {
    expect(kpiRules(mk(24, 3.2)).find((k) => k.label === '거래 활발도')?.value).toBe('활발');
    expect(kpiRules(mk(24, 0.9)).find((k) => k.label === '거래 활발도')?.value).toBe('보통');
  });
  it('T42 · 전월 대비 색: change≥0 → up(#0E9F6E), <0 → down(#E5484D)', () => {
    expect(kpiRules(mk(15, 2.3)).find((k) => k.label === '전월 대비')?.color).toBe('#0E9F6E');
    expect(kpiRules(mk(15, -0.6)).find((k) => k.label === '전월 대비')?.color).toBe('#E5484D');
  });
});

describe('barHeight', () => {
  it('T43 · 24 + (price/max)*150', () => {
    expect(barHeight(24, 24)).toBeCloseTo(174); // max일 때 24+150
    expect(barHeight(12, 24)).toBeCloseTo(99);  // 절반
  });
});
