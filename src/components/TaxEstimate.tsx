'use client';

import { useState } from 'react';
import { acquisitionTax, isAdjustedRegion } from '@/lib/tax';

const e = (n: number) => `${n.toFixed(2)}억`;

/** 매물 상세 취득세 계산 — 이 매물(가격·면적·지역)을 보유 N주택 상태에서 살 때. */
export function TaxEstimate({ priceEok, area, region, ownedDefault }: { priceEok: number; area: number; region: string; ownedDefault: number }) {
  const [owned, setOwned] = useState(ownedDefault);
  const adjusted = isAdjustedRegion(region);
  const t = acquisitionTax(priceEok, area, owned + 1, adjusted);

  const rows: [string, string][] = [
    [`취득세 (${t.acqRatePct}%)`, e(t.acqTax)],
    [`지방교육세 (${t.eduRatePct}%)`, e(t.eduTax)],
    ...(t.farmRatePct > 0 ? [[`농어촌특별세 (${t.farmRatePct}%, 85㎡초과)`, e(t.farmTax)] as [string, string]] : []),
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22, marginTop: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>취득세 계산</h2>
      <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 16 }}>
        {region} {adjusted ? <span style={{ color: 'var(--down)', fontWeight: 700 }}>조정대상지역</span> : '비조정지역'} · 전용 {area}㎡ · 취득 후 {owned + 1}주택 기준 ({t.label})
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 16 }}>
        현재 보유 주택 수
        <input type="number" min="0" step="1" value={owned} onChange={(ev) => setOwned(Math.max(0, Math.floor(Number(ev.target.value))))} aria-label="현재 보유 주택 수"
          style={{ display: 'block', width: 120, marginTop: 6, border: '1px solid var(--line)', borderRadius: 9, padding: '9px 12px', fontFamily: 'inherit', fontSize: 15 }} />
      </label>

      <div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 14 }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 16 }}>
          <span style={{ fontWeight: 700, color: 'var(--navy)' }}>총 취득세 {t.heavy && <span style={{ fontSize: 11, color: 'var(--down)', fontWeight: 700 }}>중과</span>}</span>
          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{e(t.total)} <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>({t.totalRatePct}%)</span></span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 12 }}>※ 1세대 기준 간이 계산(생애최초·일시적2주택 감면, 다주택 정밀 판정 등 미반영). 실제 신고 전 전문가 확인 권장.</div>
    </div>
  );
}
