import type { ChartData } from '@/lib/chart';

/** 시세 라인 차트(SVG). chart.ts 결과를 그대로 렌더. */
export function PriceChart({ data }: { data: ChartData }) {
  return (
    <svg viewBox={data.viewBox} preserveAspectRatio="none" style={{ width: '100%', height: 300, display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="bdsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C5DDA" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1C5DDA" stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.grid.map((gl, i) => (
        <g key={i}>
          <line x1="52" y1={gl.y} x2="740" y2={gl.y} stroke="#EEF2F8" strokeWidth="1" />
          <text x="44" y={gl.ty} textAnchor="end" fontSize="11" fill="#9AACC2" fontFamily="Pretendard">{gl.val}</text>
        </g>
      ))}
      <path d={data.area} fill="url(#bdsGrad)" />
      <path d={data.line} fill="none" stroke="#1C5DDA" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.dots.filter((d) => d.show).map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="4" fill="#fff" stroke="#1C5DDA" strokeWidth="2.5" />
      ))}
      {data.xlabels.filter((x) => x.show).map((x, i) => (
        <text key={i} x={x.x} y="290" textAnchor="middle" fontSize="11" fill="#9AACC2" fontFamily="Pretendard">{x.label}</text>
      ))}
    </svg>
  );
}
