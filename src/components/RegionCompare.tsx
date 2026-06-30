'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RegionGap } from '@/lib/queries/regions';

interface Row {
  region: string;
  price: number | null;   // 매매 중위가(억)
  change: number | null;  // 전월대비(%)
  jeonse: number | null;  // 전세 중위가(억)
  gap: number | null;     // 갭(억)
  ratio: number | null;   // 전세가율(%)
}

const MAX = 3;

export function RegionCompare({ regions }: { regions: string[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [picked, setPicked] = useState<string[]>(regions.slice(0, 2));

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.rpc('region_price_summary'),
      supabase.rpc('region_gap'),
    ]).then(([{ data: sum }, { data: gap }]) => {
      const sumMap = new Map((((sum as { region: string; price: number | null; change: number | null }[]) ?? [])).map((s) => [s.region, s]));
      const gapMap = new Map((((gap as RegionGap[]) ?? [])).map((g) => [g.region, g]));
      setRows(regions.map((r) => {
        const s = sumMap.get(r);
        const g = gapMap.get(r);
        return {
          region: r,
          price: s?.price != null ? Number(s.price) : null,
          change: s?.change != null ? Number(s.change) : null,
          jeonse: g ? Number(g.jeonse_eok) : null,
          gap: g ? Number(g.gap_eok) : null,
          ratio: g ? Number(g.jeonse_ratio) : null,
        };
      }));
    });
  }, [regions]);

  function toggle(r: string) {
    setPicked((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : prev.length >= MAX ? prev : [...prev, r]);
  }

  const sel = (rows ?? []).filter((r) => picked.includes(r.region));
  // 지표별 '가장 유리' 판정: 갭 작을수록·전세가율 높을수록·상승률 높을수록 유리
  const best = {
    gap: min(sel.map((r) => r.gap)),
    ratio: max(sel.map((r) => r.ratio)),
    change: max(sel.map((r) => r.change)),
  };

  const METRICS: { key: keyof Row; label: string; fmt: (v: number) => string; goodIs: 'high' | 'low' | null; bestVal: number | null }[] = [
    { key: 'price', label: '매매 중위가', fmt: (v) => `${v}억`, goodIs: null, bestVal: null },
    { key: 'change', label: '전월대비', fmt: (v) => `${v > 0 ? '+' : ''}${v}%`, goodIs: 'high', bestVal: best.change },
    { key: 'jeonse', label: '전세 중위가', fmt: (v) => `${v}억`, goodIs: null, bestVal: null },
    { key: 'gap', label: '갭(매매−전세)', fmt: (v) => `${v}억`, goodIs: 'low', bestVal: best.gap },
    { key: 'ratio', label: '전세가율', fmt: (v) => `${v}%`, goodIs: 'high', bestVal: best.ratio },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>비교할 지역 선택 (최대 {MAX}개)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {regions.map((r) => {
          const on = picked.includes(r);
          const disabled = !on && picked.length >= MAX;
          return (
            <button key={r} onClick={() => toggle(r)} disabled={disabled}
              aria-pressed={on}
              style={{ border: `1px solid ${on ? 'var(--primary)' : 'var(--line)'}`, background: on ? 'var(--primary)' : '#fff', color: on ? '#fff' : disabled ? 'var(--muted-2)' : 'var(--ink)', borderRadius: 999, padding: '7px 15px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1 }}>
              {r}
            </button>
          );
        })}
      </div>

      {!rows ? (
        <div style={{ color: 'var(--muted-2)', padding: '30px 0', textAlign: 'center' }}>불러오는 중…</div>
      ) : sel.length === 0 ? (
        <div style={{ color: 'var(--muted-2)', padding: '30px 0', textAlign: 'center' }}>비교할 지역을 선택하세요.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#8499B3', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>지표</th>
                {sel.map((r) => (
                  <th key={r.region} style={{ textAlign: 'right', padding: '10px 12px', fontSize: 15, color: 'var(--navy)', fontWeight: 800, borderBottom: '1px solid var(--line)' }}>{r.region}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.key}>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line-soft)' }}>{m.label}</td>
                  {sel.map((r) => {
                    const v = r[m.key] as number | null;
                    const isBest = m.bestVal != null && v != null && v === m.bestVal && sel.length > 1;
                    const color = m.key === 'change' && v != null ? (v >= 0 ? 'var(--up)' : 'var(--down)') : 'var(--navy)';
                    return (
                      <td key={r.region} style={{ textAlign: 'right', padding: '12px', fontSize: 15, fontWeight: isBest ? 800 : 600, color: isBest ? 'var(--up)' : color, borderBottom: '1px solid var(--line-soft)', background: isBest ? 'rgba(34,197,94,0.07)' : undefined }}>
                        {v == null ? '—' : m.fmt(v)}{isBest ? ' ★' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12, lineHeight: 1.6 }}>
            ★ = 비교 지역 중 가장 유리한 값(상승률·전세가율은 높을수록, 갭은 작을수록 진입에 유리). 대표평형 60~85㎡ 실거래 중위 기준.
          </div>
        </div>
      )}
    </div>
  );
}

function min(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.min(...v) : null;
}
function max(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
}
