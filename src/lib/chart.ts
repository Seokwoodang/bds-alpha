import type { Region } from '@/lib/types';

export interface ChartDot { cx: string; cy: string; val: string; show: boolean }
export interface ChartXLabel { x: string; label: string; show: boolean }
export interface ChartGrid { y: string; ty: string; val: string }
export interface ChartData {
  line: string;
  area: string;
  dots: ChartDot[];
  xlabels: ChartXLabel[];
  grid: ChartGrid[];
  viewBox: string;
  cur: string;
}

const MONTHS = ['25.07', '25.08', '25.09', '25.10', '25.11', '25.12', '26.01', '26.02', '26.03', '26.04', '26.05', '26.06'];

/** 선택 지역 평균가(억)로 12개월 합성 시계열 생성(원본 공식, 결정적). */
export function buildChart(basePrice: number): ChartData {
  const data = MONTHS.map((_, i) => +(basePrice * (0.94 + 0.012 * i + 0.018 * Math.sin(i * 0.9))).toFixed(2));
  const W = 760, H = 300, pL = 52, pR = 20, pT = 24, pB = 44;
  const iW = W - pL - pR, iH = H - pT - pB;
  const min = Math.min(...data) * 0.985, max = Math.max(...data) * 1.015;
  const xF = (i: number) => pL + i * (iW / (data.length - 1));
  const yF = (v: number) => pT + (1 - (v - min) / (max - min)) * iH;

  let line = '';
  data.forEach((v, i) => { line += (i ? ' L ' : 'M ') + xF(i).toFixed(1) + ' ' + yF(v).toFixed(1); });
  const area = line + ' L ' + xF(data.length - 1).toFixed(1) + ' ' + (pT + iH) + ' L ' + xF(0).toFixed(1) + ' ' + (pT + iH) + ' Z';

  const dots: ChartDot[] = data.map((v, i) => ({ cx: xF(i).toFixed(1), cy: yF(v).toFixed(1), val: v.toFixed(1), show: i % 2 === 1 }));
  const xlabels: ChartXLabel[] = MONTHS.map((m, i) => ({ x: xF(i).toFixed(1), label: m.slice(3), show: i % 2 === 0 }));
  const grid: ChartGrid[] = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: (pT + t * iH).toFixed(1),
    ty: (pT + t * iH + 4).toFixed(1),
    val: (max - (max - min) * t).toFixed(1),
  }));

  return { line, area, dots, xlabels, grid, viewBox: `0 0 ${W} ${H}`, cur: data[data.length - 1].toFixed(1) };
}

/** 실거래 시계열(억 값 + 월 라벨)로 차트 생성. buildChart와 동일 좌표계, 데이터만 실제. */
export function buildSeriesChart(values: number[], labels: string[]): ChartData {
  const data = values.length ? values : [0, 0];
  const lbls = labels.length === data.length ? labels : data.map((_, i) => String(i));
  const W = 760, H = 300, pL = 52, pR = 20, pT = 24, pB = 44;
  const iW = W - pL - pR, iH = H - pT - pB;
  const lo = Math.min(...data), hi = Math.max(...data);
  const min = lo === hi ? lo * 0.985 : lo - (hi - lo) * 0.15;
  const max = lo === hi ? hi * 1.015 + 0.01 : hi + (hi - lo) * 0.15;
  const xF = (i: number) => pL + (data.length === 1 ? iW / 2 : i * (iW / (data.length - 1)));
  const yF = (v: number) => pT + (1 - (v - min) / (max - min)) * iH;

  let line = '';
  data.forEach((v, i) => { line += (i ? ' L ' : 'M ') + xF(i).toFixed(1) + ' ' + yF(v).toFixed(1); });
  const area = line + ' L ' + xF(data.length - 1).toFixed(1) + ' ' + (pT + iH) + ' L ' + xF(0).toFixed(1) + ' ' + (pT + iH) + ' Z';
  const dots: ChartDot[] = data.map((v, i) => ({ cx: xF(i).toFixed(1), cy: yF(v).toFixed(1), val: v.toFixed(1), show: i % 2 === 1 }));
  const xlabels: ChartXLabel[] = lbls.map((m, i) => ({ x: xF(i).toFixed(1), label: m, show: i % 2 === 0 }));
  const grid: ChartGrid[] = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: (pT + t * iH).toFixed(1), ty: (pT + t * iH + 4).toFixed(1), val: (max - (max - min) * t).toFixed(1),
  }));
  return { line, area, dots, xlabels, grid, viewBox: `0 0 ${W} ${H}`, cur: data[data.length - 1].toFixed(1) };
}

export interface Kpi { label: string; value: string; color: string }

/** 시세 KPI 3종(전월 대비 / 전국 평균 대비 / 거래 활발도). */
export function kpiRules(region: Region): Kpi[] {
  return [
    {
      label: '전월 대비',
      value: (region.change >= 0 ? '+' : '') + region.change.toFixed(1) + '%',
      color: region.change >= 0 ? '#0E9F6E' : '#E5484D',
    },
    { label: '전국 평균 대비', value: region.price > 15 ? '높음' : '보통', color: '#0C2340' },
    { label: '거래 활발도', value: region.change > 1.5 ? '활발' : '보통', color: '#1C5DDA' },
  ];
}

/** 막대 높이(px) = 24 + (price/max)*150. */
export function barHeight(price: number, max: number): number {
  return 24 + (price / max) * 150;
}
