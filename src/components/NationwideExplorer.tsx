'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BY_SIDO, SIDO_LIST } from '@/lib/regions-kr';

interface Cached { sale: number; ratio: number | null }

/** 전국 시/도 → 시군구 탐색. 캐시된 지역은 중위가·전세가율 미리보기, 그 외는 조회 링크(→/prices 온디맨드). */
export function NationwideExplorer() {
  const [sido, setSido] = useState('서울특별시');
  const [cache, setCache] = useState<Record<string, Cached>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('region_gap_all').then(({ data }) => {
      const m: Record<string, Cached> = {};
      ((data as { lawd_cd: string; sale_eok: number; jeonse_ratio: number | null }[]) ?? []).forEach((d) => {
        m[d.lawd_cd] = { sale: Number(d.sale_eok), ratio: d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null };
      });
      setCache(m);
    });
  }, []);

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>전국 지역 탐색</h2>
        <select value={sido} onChange={(e) => setSido(e.target.value)} aria-label="시도 선택"
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
          {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
        {(BY_SIDO[sido] ?? []).map((s) => {
          const c = cache[s.code];
          return (
            <Link prefetch={false} key={s.code} href={`/prices?code=${s.code}`} className="bds-card"
              style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{s.name}</div>
              {c ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{c.sale}억</div>
                  <div style={{ fontSize: 12, color: c.ratio != null && c.ratio >= 45 ? 'var(--up)' : '#8499B3', fontWeight: 600 }}>전세가율 {c.ratio != null ? `${c.ratio}%` : '—'}</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>시세 조회 →</div>
              )}
            </Link>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12 }}>미리보기 수치가 없는 지역은 클릭 시 국토부에서 실거래를 불러옵니다(최초 1회, 몇 초).</div>
    </section>
  );
}
