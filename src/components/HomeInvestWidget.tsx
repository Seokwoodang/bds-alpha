'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { canAfford } from '@/lib/invest';
import { acquisitionTax, isAdjustedCode } from '@/lib/tax';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';

interface GapRow { code: string; name: string; sido: string; sale: number; jeonse: number; ratio: number }

const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, outline: 'none' };

/** 홈 미니 투자추천 — 자본·대출 입력 즉시 갭투자 진입 가능 지역 TOP 3. 상세는 /invest. */
export function HomeInvestWidget() {
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [capital, setCapital] = useState<number | ''>('');
  const [loan, setLoan] = useState<number | ''>('');

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('region_gap_all').then(({ data }) => {
      const rows = ((data as { lawd_cd: string; sale_eok: number; jeonse_eok: number; jeonse_ratio: number }[]) ?? [])
        .map((d) => {
          const s = CODE_TO_SIGUNGU[d.lawd_cd];
          return s ? { code: d.lawd_cd, name: s.name, sido: s.sido, sale: Number(d.sale_eok), jeonse: Number(d.jeonse_eok), ratio: Number(d.jeonse_ratio) } : null;
        }).filter(Boolean) as GapRow[];
      setGaps(rows);
    });
  }, []);

  const cap = capital === '' ? 0 : capital;
  const ln = loan === '' ? 0 : loan;
  const active = cap + ln > 0;

  const recs = useMemo(() => {
    if (!active) return [];
    return gaps
      .map((g) => { const tax = acquisitionTax(g.sale, 84, 1, isAdjustedCode(g.code)); return { g, r: canAfford('gap', g.sale, g.jeonse, cap, ln, tax.total) }; })
      .filter((x) => x.r.afford)
      .sort((a, b) => b.g.ratio - a.g.ratio)
      .slice(0, 3);
  }, [gaps, cap, ln, active]);

  return (
    <div style={{ background: 'var(--navy)', borderRadius: 18, padding: 22, color: '#fff' }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>💰 내 예산으로 어디를 살 수 있나</div>
      <div style={{ fontSize: 12, color: '#9FB6D6', marginBottom: 14 }}>갭투자(전세 끼고) 기준 · 취득세 포함 필요자본으로 계산</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <label style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#9FB6D6' }}>보유 자본(억)
          <input type="number" min="0" step="0.5" value={capital} placeholder="예: 3"
            onChange={(e) => setCapital(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            aria-label="홈 보유 자본" style={{ ...field, marginTop: 5 }} />
        </label>
        <label style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#9FB6D6' }}>대출 가능(억)
          <input type="number" min="0" step="0.5" value={loan} placeholder="예: 2"
            onChange={(e) => setLoan(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            aria-label="홈 대출 가능액" style={{ ...field, marginTop: 5 }} />
        </label>
      </div>

      {active && (
        recs.length > 0 ? (
          <div>
            {recs.map(({ g, r }) => (
              <Link key={g.code} href={`/prices?code=${g.code}`}
                style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '9px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 6, color: '#fff', textDecoration: 'none' }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{g.name} <span style={{ fontSize: 11, fontWeight: 600, color: '#9FB6D6' }}>{g.sido}</span></span>
                <span style={{ fontSize: 12, color: '#8FE3C0', fontWeight: 700 }}>필요자본 {r.need.toFixed(1)}억</span>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#9FB6D6', padding: '8px 2px' }}>이 예산으로 진입 가능한 지역이 아직 없어요. 금액을 조정해 보세요.</div>
        )
      )}

      <Link href="/invest" style={{ display: 'block', textAlign: 'center', marginTop: 10, background: 'var(--primary)', borderRadius: 10, padding: 11, color: '#fff', fontSize: 14, fontWeight: 700 }}>
        상세 추천 보기 (보유주택·생애최초 반영) →
      </Link>
    </div>
  );
}
