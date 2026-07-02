'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import { ADJUSTED_CODES } from '@/lib/tax';

interface Geo { W: number; H: number; regions: Record<string, { n: string; s: string; d: string }> }
export interface MapDatum { sale: number; jeonse: number | null; ratio: number | null }
type Metric = 'ratio' | 'sale';

// 색상 스케일(낮음→높음). ratio: 갭투자 유리(높을수록 진한 초록). sale: 비쌀수록 진한 남색.
const RAMP: Record<Metric, string[]> = {
  ratio: ['#E7F5EC', '#B7E4C7', '#74C69D', '#40916C', '#1B6B4A'],
  sale: ['#E7EEF8', '#B9CDEC', '#7FA3DB', '#3E6FC4', '#1C3F7C'],
};
const STOPS: Record<Metric, number[]> = { ratio: [35, 45, 50, 55], sale: [5, 8, 12, 20] };

function colorFor(metric: Metric, v: number | null): string {
  if (v == null) return '#EEF2F7';
  const stops = STOPS[metric]; const ramp = RAMP[metric];
  let i = 0; while (i < stops.length && v >= stops[i]) i++;
  return ramp[i];
}

export function KoreaChoropleth({ externalData, highlight, promising, sidoFilter }: {
  externalData?: Record<string, MapDatum>;   // 부모가 데이터 주입 시 자체 로드 생략
  highlight?: Set<string> | null;            // 예산 진입 가능 지역(굵은 테두리, 나머지 흐림)
  promising?: Set<string> | null;            // 투자 스코어 유망(70+) 지역
  sidoFilter?: string | null;                // 시/도 필터(그 외 흐림)
} = {}) {
  const router = useRouter();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [own, setOwn] = useState<Record<string, MapDatum>>({});
  const [metric, setMetric] = useState<Metric>('ratio');
  // 오버레이(중복 선택): 예산 진입(입력 시 기본 on) · 규제지역 · 유망 지역
  const [showBudget, setShowBudget] = useState(true);
  const [showReg, setShowReg] = useState(false);
  const [showProm, setShowProm] = useState(false);
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const data = externalData ?? own;
  const budgetSet = showBudget ? highlight : null;

  useEffect(() => {
    fetch('/korea-geo.json').then((r) => r.json()).then(setGeo).catch(() => {});
    if (externalData) return; // 부모 주입 시 자체 로드 생략
    const supabase = createClient();
    supabase.rpc('region_gap_all').then(({ data: rows }) => {
      const m: Record<string, MapDatum> = {};
      ((rows as { lawd_cd: string; sale_eok: number; jeonse_eok: number | null; jeonse_ratio: number | null }[]) ?? []).forEach((d) => {
        m[d.lawd_cd] = { sale: Number(d.sale_eok), jeonse: d.jeonse_eok != null ? Number(d.jeonse_eok) : null, ratio: d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null };
      });
      setOwn(m);
    });
  }, [externalData]);

  const coloredCount = useMemo(() => Object.keys(data).length, [data]);
  const hoveredInfo = hover && geo ? geo.regions[hover.code] : null;
  const hoveredDatum = hover ? data[hover.code] : null;

  if (!geo) return <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }}>지도 불러오는 중…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 10 }}>
            {([['ratio', '전세가율'], ['sale', '매매 중위가']] as const).map(([m, label]) => (
              <button key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}
                style={{ border: 'none', borderRadius: 7, padding: '7px 13px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: metric === m ? '#fff' : 'transparent', color: metric === m ? 'var(--primary)' : '#7286A0', boxShadow: metric === m ? '0 2px 6px rgba(12,35,64,0.12)' : 'none' }}>{label}</button>
            ))}
          </div>
          {/* 오버레이(중복 선택) */}
          {([
            ['reg', '🚫 규제지역', showReg, setShowReg, '#E5484D'],
            ['prom', '⭐ 유망 70점+', showProm, setShowProm, '#F5A524'],
            ...(highlight && highlight.size > 0 ? [['budget', '💰 예산 진입', showBudget, setShowBudget, '#0C2340'] as const] : []),
          ] as [string, string, boolean, (v: boolean) => void, string][]).map(([key, label, on, set, color]) => (
            <button key={key} aria-pressed={on} onClick={() => set(!on)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${on ? color : 'var(--line)'}`, background: on ? `${color}14` : '#fff', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: on ? color : '#7286A0' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, opacity: on ? 1 : 0.3 }} />{label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>색칠 {coloredCount}개 · 회색은 미수집(클릭 시 수집)</div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${geo.W} ${geo.H}`} style={{ width: '100%', height: 'auto', maxHeight: 560 }} role="img" aria-label="전국 시군구 시세 지도">
          <defs>
            <pattern id="regHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#E5484D" strokeWidth="2" />
            </pattern>
            <pattern id="promHatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="#F5A524" strokeWidth="2" />
            </pattern>
          </defs>
          {Object.entries(geo.regions).map(([code, r]) => {
            const d = data[code];
            const v = d ? (metric === 'ratio' ? d.ratio : d.sale) : null;
            const outSido = !!sidoFilter && CODE_TO_SIGUNGU[code]?.sido !== sidoFilter;
            const hi = budgetSet?.has(code) ?? false;
            const dimmed = outSido || (!!budgetSet && budgetSet.size > 0 && !hi && d != null);
            return (
              <path key={code} d={r.d} fill={colorFor(metric, v)} fillOpacity={dimmed ? 0.18 : 1}
                stroke={hi ? '#0C2340' : '#fff'} strokeWidth={hi ? 1.6 : 0.5}
                style={{ cursor: 'pointer', outline: 'none' }}
                onMouseEnter={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                onClick={() => router.push(`/prices?code=${code}`)} />
            );
          })}
          {/* 오버레이: 규제지역(빨간 빗금) · 유망 지역(주황 빗금) — 클릭은 아래 지역 path가 받도록 통과 */}
          {showReg && [...ADJUSTED_CODES].map((code) => geo.regions[code] && (
            <path key={`reg-${code}`} d={geo.regions[code].d} fill="url(#regHatch)" stroke="#E5484D" strokeWidth={0.8} pointerEvents="none" data-overlay="reg" />
          ))}
          {showProm && promising && [...promising].map((code) => geo.regions[code] && (
            <path key={`prom-${code}`} d={geo.regions[code].d} fill="url(#promHatch)" stroke="#F5A524" strokeWidth={0.8} pointerEvents="none" data-overlay="prom" />
          ))}
        </svg>

        {hoveredInfo && (
          <div style={{ position: 'fixed', left: hover!.x + 14, top: hover!.y + 14, background: 'var(--navy)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, pointerEvents: 'none', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 800 }}>
              {hoveredInfo.s} {hoveredInfo.n}
              {ADJUSTED_CODES.has(hover!.code) && <span style={{ color: '#FCA5A5', fontSize: 11, marginLeft: 6 }}>🚫 규제지역</span>}
              {promising?.has(hover!.code) && <span style={{ color: '#FBBF77', fontSize: 11, marginLeft: 6 }}>⭐ 유망</span>}
            </div>
            {hoveredDatum ? (
              <div style={{ opacity: 0.9, marginTop: 2 }}>매매 {hoveredDatum.sale}억 · 전세가율 {hoveredDatum.ratio ?? '—'}%</div>
            ) : (
              <div style={{ opacity: 0.75, marginTop: 2 }}>클릭해 시세 불러오기</div>
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{metric === 'ratio' ? '전세가율 낮음' : '매매가 낮음'}</span>
        {RAMP[metric].map((c) => <span key={c} style={{ width: 26, height: 12, background: c, borderRadius: 2 }} />)}
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{metric === 'ratio' ? '높음(갭 작음·유리)' : '높음'}</span>
        <span style={{ width: 26, height: 12, background: '#EEF2F7', borderRadius: 2, marginLeft: 10, border: '1px solid var(--line)' }} />
        <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>미수집</span>
        {budgetSet && budgetSet.size > 0 && (
          <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 700, marginLeft: 10 }}>■ 굵은 테두리 = 내 예산 진입 가능 {budgetSet.size}곳</span>
        )}
        {showReg && <span style={{ fontSize: 12, color: '#E5484D', fontWeight: 700, marginLeft: 10 }}>⧅ 빨간 빗금 = 규제지역(조정·투기과열)</span>}
        {showProm && <span style={{ fontSize: 12, color: '#F5A524', fontWeight: 700, marginLeft: 10 }}>⧅ 주황 빗금 = 유망(스코어 70+)</span>}
      </div>
    </div>
  );
}
