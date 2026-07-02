'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { canAfford } from '@/lib/invest';
import { acquisitionTax, isAdjustedCode } from '@/lib/tax';
import { investScore, scoreBadge } from '@/lib/score';
import { CODE_TO_SIGUNGU, SIDO_LIST } from '@/lib/regions-kr';
import { KoreaChoropleth, type MapDatum } from '@/components/KoreaChoropleth';

interface Row { code: string; name: string; sido: string; sale: number; jeonse: number; ratio: number | null; score: number; lowSample: boolean }

const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, outline: 'none' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#9FB6D6' };

/** 홈 대시보드 — 예산·보유주택·시/도 입력을 지도(하이라이트)와 추천(스코어순)에 동시 반영. */
export function HomeDashboard() {
  const [mapData, setMapData] = useState<Record<string, MapDatum>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [capital, setCapital] = useState<number | ''>('');
  const [loan, setLoan] = useState<number | ''>('');
  const [owned, setOwned] = useState<number | ''>('');
  const [sido, setSido] = useState('전국');

  useEffect(() => {
    const supabase = createClient();
    Promise.all([supabase.rpc('region_gap_all'), supabase.rpc('region_score_all')]).then(([g, s]) => {
      const scoreByCode = new Map<string, { score: number; lowSample: boolean }>();
      ((s.data as { lawd_cd: string; sale_eok: number; jeonse_ratio: number | null; chg3: number | null; vol_recent: number; vol_prev: number; tx_count: number }[]) ?? []).forEach((d) => {
        const r = investScore({ code: d.lawd_cd, sale: Number(d.sale_eok), ratio: d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null, chg3: d.chg3 != null ? Number(d.chg3) : null, volRecent: Number(d.vol_recent), volPrev: Number(d.vol_prev), txCount: Number(d.tx_count) });
        scoreByCode.set(d.lawd_cd, { score: r.score, lowSample: r.lowSample });
      });
      const md: Record<string, MapDatum> = {};
      const list: Row[] = [];
      ((g.data as { lawd_cd: string; sale_eok: number; jeonse_eok: number; jeonse_ratio: number | null }[]) ?? []).forEach((d) => {
        const sgg = CODE_TO_SIGUNGU[d.lawd_cd];
        if (!sgg) return;
        const sale = Number(d.sale_eok), jeonse = Number(d.jeonse_eok);
        const ratio = d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null;
        md[d.lawd_cd] = { sale, jeonse, ratio };
        const sc = scoreByCode.get(d.lawd_cd);
        list.push({ code: d.lawd_cd, name: sgg.name, sido: sgg.sido, sale, jeonse, ratio, score: sc?.score ?? 0, lowSample: sc?.lowSample ?? true });
      });
      setMapData(md);
      setRows(list);
    });
  }, []);

  const cap = capital === '' ? 0 : capital;
  const ln = loan === '' ? 0 : loan;
  const own = owned === '' ? 0 : owned;
  const active = cap + ln > 0;

  // 진입 가능 계산(취득세: 보유 own → 취득 후 own+1주택, 조정지역 중과)
  const affordAll = useMemo(() => {
    if (!active) return [];
    return rows
      .map((r) => { const tax = acquisitionTax(r.sale, 84, own + 1, isAdjustedCode(r.code)); return { r, res: canAfford('gap', r.sale, r.jeonse, cap, ln, tax.total) }; })
      .filter((x) => x.res.afford);
  }, [rows, cap, ln, own, active]);

  const affordSet = useMemo(() => active ? new Set(affordAll.map((x) => x.r.code)) : null, [affordAll, active]);

  // 추천: 시/도 필터 → 스코어 내림차순(저표본 뒤로) TOP 3 — 예산이 커질수록 더 좋은 지역이 올라옴
  const recs = useMemo(() => affordAll
    .filter((x) => sido === '전국' || x.r.sido === sido)
    .sort((a, b) => (Number(a.r.lowSample) - Number(b.r.lowSample)) || (b.r.score - a.r.score))
    .slice(0, 3), [affordAll, sido]);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 560px', minWidth: 300, background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
        <KoreaChoropleth externalData={mapData} highlight={affordSet} sidoFilter={sido === '전국' ? null : sido} />
      </div>

      <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--navy)', borderRadius: 18, padding: 22, color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>💰 내 예산으로 어디를 살 수 있나</div>
          <div style={{ fontSize: 12, color: '#9FB6D6', marginBottom: 14 }}>갭투자 기준 · 취득세(보유주택 중과 반영) 포함 · 결과는 지도에 굵은 테두리로 표시</div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <label style={{ flex: 1, ...lbl }}>보유 자본(억)
              <input type="number" min="0" step="0.5" value={capital} placeholder="예: 3" aria-label="홈 보유 자본"
                onChange={(e) => setCapital(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} style={{ ...field, marginTop: 5 }} />
            </label>
            <label style={{ flex: 1, ...lbl }}>대출 가능(억)
              <input type="number" min="0" step="0.5" value={loan} placeholder="예: 2" aria-label="홈 대출 가능액"
                onChange={(e) => setLoan(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} style={{ ...field, marginTop: 5 }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <label style={{ flex: 1, ...lbl }}>보유 주택 수
              <input type="number" min="0" step="1" value={owned} placeholder="0" aria-label="홈 보유 주택 수"
                onChange={(e) => setOwned(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))} style={{ ...field, marginTop: 5 }} />
            </label>
            <label style={{ flex: 1, ...lbl }}>지역 필터
              <select value={sido} onChange={(e) => setSido(e.target.value)} aria-label="홈 시도 필터" style={{ ...field, marginTop: 5 }}>
                <option value="전국">전국</option>
                {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          {active && (
            recs.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, color: '#9FB6D6', marginBottom: 6 }}>진입 가능 {affordAll.filter((x) => sido === '전국' || x.r.sido === sido).length}곳 중 투자 스코어 상위</div>
                {recs.map(({ r, res }) => {
                  const badge = scoreBadge(r.score);
                  const reverseGap = r.jeonse >= r.sale; // 역갭(전세≥매매) — 깡통 위험
                  return (
                    <Link key={r.code} href={`/prices?code=${r.code}`}
                      style={{ display: 'block', padding: '9px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 6, color: '#fff', textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{r.name} <span style={{ fontSize: 11, fontWeight: 600, color: '#9FB6D6' }}>{r.sido}</span></span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: badge.color === 'var(--up)' ? '#8FE3C0' : badge.color === 'var(--primary)' ? '#9FC3FF' : '#FBBF77' }}>{badge.label} {r.score}점</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#9FB6D6', marginTop: 2 }}>
                        필요자본 {Math.max(0, res.need).toFixed(1)}억 · 매매 {r.sale}억
                        {reverseGap && <span style={{ color: '#FCA5A5', fontWeight: 700 }}> · 역갭(전세≥매매) 주의</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9FB6D6', padding: '8px 2px' }}>{sido === '전국' ? '이 예산으로 진입 가능한 지역이 아직 없어요.' : `${sido}에서 진입 가능한 지역이 없어요. 필터를 넓혀 보세요.`}</div>
            )
          )}

          <Link href="/invest" style={{ display: 'block', textAlign: 'center', marginTop: 10, background: 'var(--primary)', borderRadius: 10, padding: 11, color: '#fff', fontSize: 14, fontWeight: 700 }}>
            상세 추천 보기 (생애최초·매물 단위) →
          </Link>
        </div>

        <div style={{ fontSize: 12, color: '#7286A0', lineHeight: 1.7, padding: '0 6px' }}>
          <strong style={{ color: 'var(--navy)' }}>투자 스코어</strong> = 모멘텀 40(3개월 추세) + 거래량 30(수요) + 진입성 30(전세가율). 오르면서 거래가 붙는 지역을 찾습니다.
        </div>
      </div>
    </div>
  );
}
