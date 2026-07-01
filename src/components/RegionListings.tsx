'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPriceManwon } from '@/lib/property';

interface Row { apt_name: string | null; dong: string | null; area: number; floor: number | null; deal_amount: number; deal_date: string }

/** 선택 시군구의 최근 개별 실거래(개별 매물) 목록. 코드 기반, 브라우저 조회. */
export function RegionListings({ code, region }: { code: string; region: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    setRows(null);
    const supabase = createClient();
    supabase.rpc('region_listings_code', { p_lawd: code, p_limit: 30 }).then(({ data }) => {
      setRows(((data as Row[]) ?? []).map((d) => ({ ...d, area: Number(d.area), deal_amount: Number(d.deal_amount) })));
    });
  }, [code]);

  return (
    <section style={{ marginTop: 8 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>{region} 최근 실거래</h2>
      <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 14 }}>국토부 신고 기준 최신순 개별 거래(매매).</div>
      {rows == null ? (
        <div style={{ color: 'var(--muted-2)', padding: '20px 0' }}>불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: 'var(--muted-2)', padding: '20px 0' }}>표시할 실거래가 없습니다.</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['단지', '법정동', '전용', '층', '거래가', '계약일'].map((h) => (
                    <th key={h} style={{ textAlign: h === '단지' || h === '법정동' ? 'left' : 'right', padding: '10px 14px', fontSize: 12, color: '#8499B3', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: 'var(--navy)', fontWeight: 700 }}>{r.apt_name ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#7286A0' }}>{r.dong ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.area}㎡</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>{r.floor ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: 'var(--navy)', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatPriceManwon(r.deal_amount)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#7286A0', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.deal_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
