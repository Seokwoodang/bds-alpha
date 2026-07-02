'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Geo { W: number; H: number; regions: Record<string, { n: string; s: string; d: string }> }
interface Datum { sale: number; ratio: number | null }
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

export function KoreaChoropleth() {
  const router = useRouter();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [data, setData] = useState<Record<string, Datum>>({});
  const [metric, setMetric] = useState<Metric>('ratio');
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/korea-geo.json').then((r) => r.json()).then(setGeo).catch(() => {});
    const supabase = createClient();
    supabase.rpc('region_gap_all').then(({ data: rows }) => {
      const m: Record<string, Datum> = {};
      ((rows as { lawd_cd: string; sale_eok: number; jeonse_ratio: number | null }[]) ?? []).forEach((d) => {
        m[d.lawd_cd] = { sale: Number(d.sale_eok), ratio: d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null };
      });
      setData(m);
    });
  }, []);

  const coloredCount = useMemo(() => Object.keys(data).length, [data]);
  const hoveredInfo = hover && geo ? geo.regions[hover.code] : null;
  const hoveredDatum = hover ? data[hover.code] : null;

  if (!geo) return <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }}>지도 불러오는 중…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 10 }}>
          {([['ratio', '전세가율(갭투자 유리)'], ['sale', '매매 중위가']] as const).map(([m, label]) => (
            <button key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}
              style={{ border: 'none', borderRadius: 7, padding: '7px 13px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: metric === m ? '#fff' : 'transparent', color: metric === m ? 'var(--primary)' : '#7286A0', boxShadow: metric === m ? '0 2px 6px rgba(12,35,64,0.12)' : 'none' }}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>색칠된 {coloredCount}개 지역 · 회색은 미수집(클릭 시 수집)</div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${geo.W} ${geo.H}`} style={{ width: '100%', height: 'auto', maxHeight: 560 }} role="img" aria-label="전국 시군구 시세 지도">
          {Object.entries(geo.regions).map(([code, r]) => {
            const d = data[code];
            const v = d ? (metric === 'ratio' ? d.ratio : d.sale) : null;
            return (
              <path key={code} d={r.d} fill={colorFor(metric, v)} stroke="#fff" strokeWidth={0.5}
                style={{ cursor: 'pointer', outline: 'none' }}
                onMouseEnter={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                onClick={() => router.push(`/prices?code=${code}`)} />
            );
          })}
        </svg>

        {hoveredInfo && (
          <div style={{ position: 'fixed', left: hover!.x + 14, top: hover!.y + 14, background: 'var(--navy)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, pointerEvents: 'none', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 800 }}>{hoveredInfo.s} {hoveredInfo.n}</div>
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
      </div>
    </div>
  );
}
