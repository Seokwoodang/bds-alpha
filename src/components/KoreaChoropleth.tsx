'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import { ADJUSTED_CODES } from '@/lib/tax';

interface Geo { W: number; H: number; regions: Record<string, { n: string; s: string; d: string }> }
export interface MapDatum { sale: number; jeonse: number | null; ratio: number | null; chg?: number | null; vol?: number | null; score?: number | null }
type Metric = 'ratio' | 'sale' | 'chg' | 'vol' | 'score';
interface View { x: number; y: number; w: number; h: number }

// 색칠 기준별: 라벨 · 색 램프(낮음→높음) · 구간 경계 · 범례 양끝 · 값 포맷
const METRICS: Record<Metric, { label: string; ramp: string[]; stops: number[]; lo: string; hi: string; fmt: (v: number) => string; pick: (d: MapDatum) => number | null }> = {
  ratio: { label: '전세가율', ramp: ['#E7F5EC', '#B7E4C7', '#74C69D', '#40916C', '#1B6B4A'], stops: [35, 45, 50, 55], lo: '낮음', hi: '높음(갭 작음·유리)', fmt: (v) => `${v}%`, pick: (d) => d.ratio },
  sale: { label: '매매 중위가', ramp: ['#E7EEF8', '#B9CDEC', '#7FA3DB', '#3E6FC4', '#1C3F7C'], stops: [5, 8, 12, 20], lo: '낮음', hi: '높음', fmt: (v) => `${v}억`, pick: (d) => d.sale },
  chg: { label: '3개월 변동', ramp: ['#C0392B', '#E8A29A', '#E9EDF2', '#9BD8B4', '#2E9E5B'], stops: [-3, -0.5, 0.5, 3], lo: '하락', hi: '상승', fmt: (v) => `${v >= 0 ? '+' : ''}${v}%`, pick: (d) => d.chg ?? null },
  vol: { label: '거래량(3개월)', ramp: ['#EAE6F7', '#C9BCEC', '#A38FDD', '#7A5FCB', '#573BA6'], stops: [50, 150, 400, 900], lo: '적음', hi: '많음', fmt: (v) => `${v.toLocaleString('ko-KR')}건`, pick: (d) => d.vol ?? null },
  score: { label: '투자 스코어', ramp: ['#EAF4F1', '#BFE3D6', '#84C9B0', '#3FA588', '#1B6B4A'], stops: [40, 55, 70, 85], lo: '낮음', hi: '유망', fmt: (v) => `${v}점`, pick: (d) => d.score ?? null },
};

function colorFor(metric: Metric, v: number | null): string {
  if (v == null) return '#EEF2F7';
  const { stops, ramp } = METRICS[metric];
  let i = 0; while (i < stops.length && v >= stops[i]) i++;
  return ramp[i];
}

/** viewBox 좌표계에서 화면 좌표 → SVG 좌표(preserveAspectRatio=meet 레터박스 보정). */
function clientToSvg(cx: number, cy: number, v: View, rect: DOMRect) {
  const scale = Math.min(rect.width / v.w, rect.height / v.h);
  const ox = (rect.width - v.w * scale) / 2;
  const oy = (rect.height - v.h * scale) / 2;
  return { x: v.x + (cx - rect.left - ox) / scale, y: v.y + (cy - rect.top - oy) / scale, scale };
}

export function KoreaChoropleth({ externalData, highlight, promising, sidoFilter }: {
  externalData?: Record<string, MapDatum>;   // 부모가 데이터 주입 시 자체 로드 생략
  highlight?: Set<string> | null;            // 예산 진입 가능 지역(굵은 테두리, 나머지 흐림)
  promising?: Set<string> | null;            // 투자 스코어 유망(70+) 지역
  sidoFilter?: string | null;                // 시/도 필터(그 외 흐림 + 자동 줌)
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
  // 줌/팬: null = 전체 보기
  const [view, setView] = useState<View | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<View | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; v: View; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
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

  const full: View | null = geo ? { x: 0, y: 0, w: geo.W, h: geo.H } : null;
  const vb = view ?? full;
  viewRef.current = vb;

  // 시/도별 경계 bbox(경로 좌표 파싱) — 시/도 필터 자동 줌용
  const sidoBBox = useMemo(() => {
    if (!geo) return {} as Record<string, { minX: number; minY: number; maxX: number; maxY: number }>;
    const bb: Record<string, { minX: number; minY: number; maxX: number; maxY: number }> = {};
    for (const r of Object.values(geo.regions)) {
      const nums = r.d.match(/-?\d+\.?\d*/g);
      if (!nums) continue;
      const b = (bb[r.s] ??= { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = Number(nums[i]), y = Number(nums[i + 1]);
        if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x;
        if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y;
      }
    }
    return bb;
  }, [geo]);

  // 시/도 필터 → 해당 지역으로 자동 줌(해제 시 전체)
  useEffect(() => {
    if (!geo) return;
    if (!sidoFilter) { setView(null); return; }
    const b = sidoBBox[sidoFilter];
    if (!b) return;
    const aspect = geo.W / geo.H;
    let w = (b.maxX - b.minX) * 1.16;
    let h = (b.maxY - b.minY) * 1.16;
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    setView({ x: cx - w / 2, y: cy - h / 2, w, h });
  }, [sidoFilter, geo, sidoBBox]);

  // 커서(또는 지정점) 기준 줌. factor <1 확대, >1 축소.
  function zoomAt(clientX: number, clientY: number, factor: number) {
    const el = svgRef.current;
    if (!el || !geo) return;
    const rect = el.getBoundingClientRect();
    setView((prev) => {
      const v = prev ?? { x: 0, y: 0, w: geo.W, h: geo.H };
      const p = clientToSvg(clientX, clientY, v, rect);
      const w = Math.min(geo.W, Math.max(geo.W / 16, v.w * factor));
      if (w === geo.W) return null; // 전체로 복귀
      const h = w * (geo.H / geo.W);
      return { x: p.x - (p.x - v.x) * (w / v.w), y: p.y - (p.y - v.y) * (h / v.h), w, h };
    });
  }
  function zoomCenter(factor: number) {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  }

  // 휠 줌(passive:false로 스크롤 방지)
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !geo) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.25 : 0.8);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  const coloredCount = useMemo(() => Object.keys(data).length, [data]);
  const hoveredInfo = hover && geo ? geo.regions[hover.code] : null;
  const hoveredDatum = hover ? data[hover.code] : null;

  if (!geo || !vb) return <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }}>지도 불러오는 중…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#7286A0' }}>
            색칠 기준
            <select value={metric} onChange={(e) => setMetric(e.target.value as Metric)} aria-label="지도 색칠 기준"
              style={{ border: '1px solid var(--line)', borderRadius: 9, padding: '7px 10px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--navy)', background: '#fff' }}>
              {(Object.keys(METRICS) as Metric[]).map((m) => <option key={m} value={m}>{METRICS[m].label}</option>)}
            </select>
          </label>
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
        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>색칠 {coloredCount}개 · 휠/버튼 확대 · 드래그 이동</div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          style={{ width: '100%', height: 'auto', maxHeight: 560, cursor: dragRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          role="img" aria-label="전국 시군구 시세 지도"
          onPointerDown={(e) => {
            dragRef.current = { sx: e.clientX, sy: e.clientY, v: viewRef.current!, moved: false };
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = dragRef.current;
            if (!d || !svgRef.current) return;
            if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 5) d.moved = true;
            if (!d.moved) return;
            const rect = svgRef.current.getBoundingClientRect();
            const scale = Math.min(rect.width / d.v.w, rect.height / d.v.h);
            setView({ x: d.v.x - (e.clientX - d.sx) / scale, y: d.v.y - (e.clientY - d.sy) / scale, w: d.v.w, h: d.v.h });
          }}
          onPointerUp={() => {
            if (dragRef.current?.moved) { suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 80); }
            dragRef.current = null;
          }}
          onPointerLeave={() => { dragRef.current = null; }}>
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
            const v = d ? METRICS[metric].pick(d) : null;
            const outSido = !!sidoFilter && CODE_TO_SIGUNGU[code]?.sido !== sidoFilter;
            const hi = budgetSet?.has(code) ?? false;
            // 시/도 필터 시: 다른 시도는 아예 무채색(색칠 제거)으로 격리. 예산 하이라이트 시: 비대상 흐림.
            const budgetDim = !outSido && !!budgetSet && budgetSet.size > 0 && !hi && d != null;
            const fill = outSido ? '#EEF2F7' : colorFor(metric, v);
            return (
              <path key={code} d={r.d} fill={fill} fillOpacity={outSido ? 0.35 : budgetDim ? 0.2 : 1}
                stroke={hi ? '#0C2340' : '#fff'} strokeWidth={hi ? 1.6 : 0.5} vectorEffect="non-scaling-stroke"
                style={{ cursor: 'pointer', outline: 'none' }}
                onMouseEnter={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHover({ code, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                onClick={() => { if (!suppressClick.current) router.push(`/prices?code=${code}`); }} />
            );
          })}
          {/* 오버레이: 규제지역(빨간 빗금) · 유망 지역(주황 빗금) — 클릭은 아래 지역 path가 받도록 통과 */}
          {showReg && [...ADJUSTED_CODES].map((code) => geo.regions[code] && (
            <path key={`reg-${code}`} d={geo.regions[code].d} fill="url(#regHatch)" stroke="#E5484D" strokeWidth={0.8} vectorEffect="non-scaling-stroke" pointerEvents="none" data-overlay="reg" />
          ))}
          {showProm && promising && [...promising].map((code) => geo.regions[code] && (
            <path key={`prom-${code}`} d={geo.regions[code].d} fill="url(#promHatch)" stroke="#F5A524" strokeWidth={0.8} vectorEffect="non-scaling-stroke" pointerEvents="none" data-overlay="prom" />
          ))}
        </svg>

        {/* 줌 컨트롤 */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([['지도 확대', '+', () => zoomCenter(0.6)], ['지도 축소', '−', () => zoomCenter(1.6)], ['지도 초기화', '⟲', () => setView(null)]] as const).map(([label, icon, fn]) => (
            <button key={label} aria-label={label} onClick={fn}
              style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.95)', color: 'var(--navy)', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(12,35,64,0.10)' }}>{icon}</button>
          ))}
        </div>

        {hoveredInfo && (
          <div style={{ position: 'fixed', left: hover!.x + 14, top: hover!.y + 14, background: 'var(--navy)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, pointerEvents: 'none', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 800 }}>
              {hoveredInfo.s} {hoveredInfo.n}
              {ADJUSTED_CODES.has(hover!.code) && <span style={{ color: '#FCA5A5', fontSize: 11, marginLeft: 6 }}>🚫 규제지역</span>}
              {promising?.has(hover!.code) && <span style={{ color: '#FBBF77', fontSize: 11, marginLeft: 6 }}>⭐ 유망</span>}
            </div>
            {hoveredDatum ? (
              <div style={{ opacity: 0.92, marginTop: 3, lineHeight: 1.6, fontSize: 12 }}>
                <div>매매 중위 <b>{hoveredDatum.sale}억</b> · 전세 <b>{hoveredDatum.jeonse ?? '—'}억</b></div>
                <div>전세가율 {hoveredDatum.ratio ?? '—'}% · 갭 {hoveredDatum.jeonse != null ? (Math.round((hoveredDatum.sale - hoveredDatum.jeonse) * 10) / 10) : '—'}억</div>
                <div>3개월 {hoveredDatum.chg != null ? `${hoveredDatum.chg >= 0 ? '+' : ''}${hoveredDatum.chg}%` : '—'} · 거래 {hoveredDatum.vol != null ? `${hoveredDatum.vol.toLocaleString('ko-KR')}건` : '—'} · 스코어 {hoveredDatum.score ?? '—'}</div>
                <div style={{ opacity: 0.7, marginTop: 2 }}>클릭 → 상세 시세·실거래</div>
              </div>
            ) : (
              <div style={{ opacity: 0.75, marginTop: 2 }}>클릭해 시세 불러오기</div>
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{METRICS[metric].label}:</span>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{METRICS[metric].lo}</span>
        {METRICS[metric].ramp.map((c) => <span key={c} style={{ width: 26, height: 12, background: c, borderRadius: 2 }} />)}
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{METRICS[metric].hi}</span>
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
