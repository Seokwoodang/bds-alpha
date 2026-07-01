'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BY_SIDO, SIDO_LIST, CODE_TO_SIGUNGU } from '@/lib/regions-kr';

interface Row {
  code: string;
  name: string;
  sido: string;
  loading: boolean;
  price: number | null;
  change: number | null;
  jeonse: number | null;
  gap: number | null;
  ratio: number | null;
}

const MAX = 3;
const DEFAULT_CODES = ['11680', '11650']; // 강남·서초
const sel: React.CSSProperties = { border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', outline: 'none' };

/** 시군구 데이터 확보(미수집이면 온디맨드) 후 요약/갭 조회. */
async function loadRegion(code: string): Promise<Omit<Row, 'loading'>> {
  const supabase = createClient();
  const sgg = CODE_TO_SIGUNGU[code];
  const cov = await supabase.rpc('region_coverage', { p_lawd: code });
  const txCount = Number((cov.data as { tx_count: number }[])?.[0]?.tx_count ?? 0);
  if (txCount === 0) {
    await fetch('/api/ingest-region', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, months: 6 }) }).catch(() => {});
  }
  const [s, g] = await Promise.all([
    supabase.rpc('region_summary_code', { p_lawd: code }),
    supabase.rpc('region_gap_code', { p_lawd: code }),
  ]);
  const sr = (s.data as { price: number | null; change: number | null }[])?.[0];
  const gr = (g.data as { jeonse_eok: number | null; gap_eok: number | null; jeonse_ratio: number | null }[])?.[0];
  return {
    code, name: sgg?.name ?? code, sido: sgg?.sido ?? '',
    price: sr?.price != null ? Number(sr.price) : null,
    change: sr?.change != null ? Number(sr.change) : null,
    jeonse: gr?.jeonse_eok != null ? Number(gr.jeonse_eok) : null,
    gap: gr?.gap_eok != null ? Number(gr.gap_eok) : null,
    ratio: gr?.jeonse_ratio != null ? Number(gr.jeonse_ratio) : null,
  };
}

export function RegionCompare() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sido, setSido] = useState(SIDO_LIST[0]);
  const [pickCode, setPickCode] = useState('');

  async function add(code: string) {
    if (!code || rows.some((r) => r.code === code) || rows.length >= MAX) return;
    const sgg = CODE_TO_SIGUNGU[code];
    setRows((p) => [...p, { code, name: sgg?.name ?? code, sido: sgg?.sido ?? '', loading: true, price: null, change: null, jeonse: null, gap: null, ratio: null }]);
    const loaded = await loadRegion(code);
    setRows((p) => p.map((r) => (r.code === code ? { ...loaded, loading: false } : r)));
  }
  function remove(code: string) { setRows((p) => p.filter((r) => r.code !== code)); }

  // 최초 기본 지역
  useEffect(() => { DEFAULT_CODES.forEach((c) => add(c)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const ready = rows.filter((r) => !r.loading);
  const min = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.min(...v) : null; };
  const max = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.max(...v) : null; };
  const best = { gap: min(ready.map((r) => r.gap)), ratio: max(ready.map((r) => r.ratio)), change: max(ready.map((r) => r.change)) };

  const METRICS: { key: keyof Row; label: string; fmt: (v: number) => string; bestVal: number | null }[] = [
    { key: 'price', label: '매매 중위가', fmt: (v) => `${v}억`, bestVal: null },
    { key: 'change', label: '전월대비', fmt: (v) => `${v > 0 ? '+' : ''}${v}%`, bestVal: best.change },
    { key: 'jeonse', label: '전세 중위가', fmt: (v) => `${v}억`, bestVal: null },
    { key: 'gap', label: '갭(매매−전세)', fmt: (v) => `${v}억`, bestVal: best.gap },
    { key: 'ratio', label: '전세가율', fmt: (v) => `${v}%`, bestVal: best.ratio },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>비교할 지역 추가 (최대 {MAX}개)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <select style={sel} value={sido} onChange={(e) => { setSido(e.target.value); setPickCode(''); }} aria-label="시도 선택">
          {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={sel} value={pickCode} onChange={(e) => setPickCode(e.target.value)} aria-label="시군구 선택">
          <option value="">시군구 선택</option>
          {(BY_SIDO[sido] ?? []).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
        <button onClick={() => { add(pickCode); setPickCode(''); }} disabled={!pickCode || rows.length >= MAX}
          style={{ border: 'none', borderRadius: 10, padding: '9px 18px', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: rows.length >= MAX ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !pickCode || rows.length >= MAX ? 0.5 : 1 }}>+ 추가</button>
      </div>

      {rows.length === 0 ? (
        <div style={{ color: 'var(--muted-2)', padding: '30px 0', textAlign: 'center' }}>비교할 지역을 추가하세요.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#8499B3', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>지표</th>
                {rows.map((r) => (
                  <th key={r.code} style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11, color: '#8499B3', fontWeight: 600 }}>{r.sido}</div>
                    <div style={{ fontSize: 15, color: 'var(--navy)', fontWeight: 800 }}>{r.name} <button onClick={() => remove(r.code)} aria-label={`${r.name} 제거`} style={{ border: 'none', background: 'none', color: 'var(--muted-2)', cursor: 'pointer', fontSize: 13 }}>✕</button></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.key}>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line-soft)' }}>{m.label}</td>
                  {rows.map((r) => {
                    if (r.loading) return <td key={r.code} style={{ textAlign: 'right', padding: '12px', fontSize: 13, color: 'var(--muted-2)', borderBottom: '1px solid var(--line-soft)' }}>…</td>;
                    const v = r[m.key] as number | null;
                    const isBest = m.bestVal != null && v != null && v === m.bestVal && ready.length > 1;
                    const color = m.key === 'change' && v != null ? (v >= 0 ? 'var(--up)' : 'var(--down)') : 'var(--navy)';
                    return (
                      <td key={r.code} style={{ textAlign: 'right', padding: '12px', fontSize: 15, fontWeight: isBest ? 800 : 600, color: isBest ? 'var(--up)' : color, borderBottom: '1px solid var(--line-soft)', background: isBest ? 'rgba(34,197,94,0.07)' : undefined }}>
                        {v == null ? '—' : m.fmt(v)}{isBest ? ' ★' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12, lineHeight: 1.6 }}>
            ★ = 비교 지역 중 가장 유리한 값(상승률·전세가율 높을수록, 갭 작을수록). 처음 보는 지역은 국토부에서 온디맨드 수집(몇 초). 대표평형 60~85㎡ 실거래 중위.
          </div>
        </div>
      )}
    </div>
  );
}
