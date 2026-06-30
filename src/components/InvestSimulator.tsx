'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { canAfford, type InvestMode } from '@/lib/invest';
import { acquisitionTax, isAdjustedRegion } from '@/lib/tax';
import type { RegionGap } from '@/lib/queries/regions';

interface ListingRow { id: number; title: string; region: string; dong: string | null; price_text: string; price_num: number; area: number }

const field: React.CSSProperties = { width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', outline: 'none' };
const e = (n: number) => `${n.toFixed(1)}억`;

export function InvestSimulator() {
  const [gaps, setGaps] = useState<RegionGap[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [capital, setCapital] = useState(5);
  const [loan, setLoan] = useState(3);
  const [owned, setOwned] = useState(0); // 현재 보유 주택 수
  const [mode, setMode] = useState<InvestMode>('gap');

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.rpc('region_gap'),
      supabase.from('listings').select('id,title,region,dong,price_text,price_num,area').order('price_num', { ascending: true }),
    ]).then(([g, l]) => {
      setGaps(((g.data as RegionGap[]) ?? []).map((d) => ({ region: d.region, sale_eok: Number(d.sale_eok), jeonse_eok: Number(d.jeonse_eok), gap_eok: Number(d.gap_eok), jeonse_ratio: Number(d.jeonse_ratio) })));
      setListings(((l.data as ListingRow[]) ?? []).map((d) => ({ ...d, price_num: Number(d.price_num), area: Number(d.area) })));
      setLoaded(true);
    });
  }, []);

  const jeonseByRegion = useMemo(() => Object.fromEntries(gaps.map((g) => [g.region, g.jeonse_eok])), [gaps]);
  const budget = mode === 'gap' ? capital + loan : capital;

  const regionRecs = useMemo(() => gaps
    .map((g) => { const tax = acquisitionTax(g.sale_eok, 84, owned + 1, isAdjustedRegion(g.region)); return { g, tax, r: canAfford(mode, g.sale_eok, g.jeonse_eok, capital, loan, tax.total) }; })
    .filter((x) => x.r.afford)
    .sort((a, b) => mode === 'gap' ? b.g.jeonse_ratio - a.g.jeonse_ratio : a.r.need - b.r.need),
    [gaps, mode, capital, loan, owned]);

  const listingRecs = useMemo(() => listings
    .map((l) => { const sale = l.price_num / 10000; const jeonse = jeonseByRegion[l.region] ?? 0; const tax = acquisitionTax(sale, l.area, owned + 1, isAdjustedRegion(l.region)); return { l, sale, tax, r: canAfford(mode, sale, jeonse, capital, loan, tax.total) }; })
    .filter((x) => x.r.afford)
    .sort((a, b) => a.r.need - b.r.need)
    .slice(0, 12),
    [listings, jeonseByRegion, mode, capital, loan, owned]);

  return (
    <div>
      {/* 입력 */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 11, width: 'fit-content', marginBottom: 18 }}>
          {([['gap', '갭투자(전세 끼고)'], ['live', '실거주 매수']] as const).map(([m, label]) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}
              style={{ border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, background: mode === m ? '#fff' : 'transparent', color: mode === m ? 'var(--primary)' : '#7286A0', boxShadow: mode === m ? '0 2px 6px rgba(12,35,64,0.12)' : 'none' }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>보유 자본 (억)
            <input type="number" step="0.5" min="0" value={capital} onChange={(ev) => setCapital(Math.max(0, Number(ev.target.value)))} aria-label="보유 자본" style={{ ...field, marginTop: 6 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>대출 가능액 (억)
            <input type="number" step="0.5" min="0" value={loan} onChange={(ev) => setLoan(Math.max(0, Number(ev.target.value)))} aria-label="대출 가능액" style={{ ...field, marginTop: 6 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>현재 보유 주택 수
            <input type="number" step="1" min="0" value={owned} onChange={(ev) => setOwned(Math.max(0, Math.floor(Number(ev.target.value))))} aria-label="현재 보유 주택 수" style={{ ...field, marginTop: 6 }} />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 6 }}>{mode === 'gap' ? '가용 예산(자본+대출)' : '자기자본'}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{e(budget)}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12 }}>
          {mode === 'gap' ? '갭투자: 필요자본 = (매매−전세) + 취득세. 전세보증금이 매매대금 레버리지.' : '실거주: 필요자본 = 매매 + 취득세 − 대출.'} 취득세는 <strong>취득 후 {owned + 1}주택</strong> 기준 + 조정대상지역(강남·서초·송파·용산) 중과 + 85㎡초과 농특세를 반영(간이). 실거래 중위가 기준.
        </div>
      </div>

      {!loaded ? (
        <div style={{ color: 'var(--muted-2)', padding: '30px 0', textAlign: 'center' }}>불러오는 중…</div>
      ) : (
        <>
          {/* 지역 추천 */}
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>진입 가능한 지역 <span style={{ color: 'var(--primary)' }}>{regionRecs.length}</span></h2>
          {regionRecs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 30, textAlign: 'center', color: 'var(--muted)' }}>예산으로 진입 가능한 지역이 없어요. 자본·대출을 조정해 보세요.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
              {regionRecs.map(({ g, tax, r }) => (
                <Link key={g.region} href={`/listings?region=${encodeURIComponent(g.region)}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{g.region}{isAdjustedRegion(g.region) && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--down)', background: '#FCE9EA', padding: '1px 6px', borderRadius: 5, marginLeft: 6 }}>조정</span>}</div>
                  <div style={{ fontSize: 13, color: '#7286A0', marginBottom: 2 }}>매매 {e(g.sale_eok)} · 전세 {e(g.jeonse_eok)}</div>
                  {mode === 'gap' && <div style={{ fontSize: 13, color: '#7286A0', marginBottom: 8 }}>갭 {e(g.gap_eok)} · 전세가율 <strong style={{ color: g.jeonse_ratio >= 45 ? 'var(--up)' : 'var(--ink)' }}>{g.jeonse_ratio}%</strong></div>}
                  <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#8499B3' }}>필요자본 </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{e(r.need)}</span>
                    <span style={{ fontSize: 12, color: 'var(--up)', fontWeight: 700, marginLeft: 6 }}>여유 {e(r.margin)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>취득세 {e(tax.total)} ({tax.totalRatePct}%{tax.heavy ? ' 중과' : ''})</div>
                </Link>
              ))}
            </div>
          )}

          {/* 매물 추천 */}
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>예산 내 추천 매물 <span style={{ color: 'var(--primary)' }}>{listingRecs.length}</span></h2>
          {listingRecs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 30, textAlign: 'center', color: 'var(--muted)' }}>예산 내 매물이 없어요.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
              {listingRecs.map(({ l, tax, r }) => (
                <Link key={l.id} href={`/listings/${l.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 5 }}>{l.region}</span>
                    <span style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>{l.dong} · {l.area}㎡</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{l.price_text}</div>
                  <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10 }}>
                    <span style={{ fontSize: 12, color: '#8499B3' }}>필요자본 </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{e(r.need)}</span>
                    <span style={{ fontSize: 12, color: 'var(--up)', fontWeight: 700, marginLeft: 6 }}>여유 {e(r.margin)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>취득세 {e(tax.total)} ({tax.totalRatePct}%{tax.heavy ? ' 중과' : ''})</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
