'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RegionGap } from '@/lib/queries/regions';

/** 갭/전세가율 분석(클라이언트 로드). region_gap RPC를 브라우저에서 호출 — 서버 렌더 상호작용과 분리. */
export function GapAnalysis({ selected }: { selected: string }) {
  const [gaps, setGaps] = useState<RegionGap[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('region_gap').then(({ data }) => {
      const rows = ((data as RegionGap[]) ?? []).map((d) => ({
        region: d.region, sale_eok: Number(d.sale_eok), jeonse_eok: Number(d.jeonse_eok),
        gap_eok: Number(d.gap_eok), jeonse_ratio: Number(d.jeonse_ratio),
      }));
      setGaps(rows.sort((a, b) => b.jeonse_ratio - a.jeonse_ratio));
    });
  }, []);

  const selGap = gaps?.find((g) => g.region === selected);

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, marginTop: 24 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>갭 투자 분석</div>
      <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 18 }}>매매가 − 전세가 = 갭 · 전세가율 = 전세÷매매 (대표평형 60~85㎡ 실거래 중위, 최근 3개월). 전세가율이 높을수록 갭이 작아 적은 자본으로 진입.</div>

      {!gaps ? (
        <div style={{ color: 'var(--muted-2)', fontSize: 14, padding: '20px 0' }}>불러오는 중…</div>
      ) : (
        <>
          {selGap && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              {[
                { label: `${selected} 매매`, value: `${selGap.sale_eok}억`, color: 'var(--navy)' },
                { label: '전세', value: `${selGap.jeonse_eok}억`, color: 'var(--navy)' },
                { label: '갭(매매−전세)', value: `${selGap.gap_eok}억`, color: 'var(--primary)' },
                { label: '전세가율', value: `${selGap.jeonse_ratio}%`, color: selGap.jeonse_ratio >= 45 ? 'var(--up)' : 'var(--down)' },
              ].map((k) => (
                <div key={k.label} style={{ flex: '1 1 130px', background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', margin: '4px 0 8px' }}>전세가율 높은 순 (갭 작은 지역 = 진입 유리)</div>
          <div role="table">
            <div role="row" style={{ display: 'flex', color: '#8499B3', fontSize: 12, padding: '8px 10px', fontWeight: 600 }}>
              <span style={{ flex: 2 }}>지역</span>
              <span style={{ flex: 1, textAlign: 'right' }}>매매</span>
              <span style={{ flex: 1, textAlign: 'right' }}>전세</span>
              <span style={{ flex: 1, textAlign: 'right' }}>갭</span>
              <span style={{ flex: 1, textAlign: 'right' }}>전세가율</span>
            </div>
            {gaps.map((g) => {
              const on = g.region === selected;
              return (
                <div role="row" key={g.region} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--line-soft)', background: on ? 'var(--primary-soft)' : 'transparent', padding: '10px', fontSize: 14 }}>
                  <span style={{ flex: 2, fontWeight: 700, color: on ? 'var(--primary)' : 'var(--navy)' }}>{g.region}</span>
                  <span style={{ flex: 1, textAlign: 'right', color: 'var(--ink)' }}>{g.sale_eok}억</span>
                  <span style={{ flex: 1, textAlign: 'right', color: 'var(--ink)' }}>{g.jeonse_eok}억</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{g.gap_eok}억</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 800, color: g.jeonse_ratio >= 45 ? 'var(--up)' : 'var(--ink)' }}>{g.jeonse_ratio}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
