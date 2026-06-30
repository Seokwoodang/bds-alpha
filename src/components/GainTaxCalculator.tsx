'use client';

import { useState } from 'react';
import { gainTax } from '@/lib/gainTax';

const e = (n: number) => `${n.toFixed(2)}억`;
const field: React.CSSProperties = { width: '100%', border: '1px solid var(--line)', borderRadius: 9, padding: '9px 12px', fontFamily: 'inherit', fontSize: 15, marginTop: 6 };
const lab: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--muted)' };

export function GainTaxCalculator() {
  const [buy, setBuy] = useState(5);
  const [sell, setSell] = useState(8);
  const [hold, setHold] = useState(5);
  const [live, setLive] = useState(5);
  const [oneHouse, setOneHouse] = useState(true);
  const [heavyMulti, setHeavyMulti] = useState(false);
  const [houses, setHouses] = useState(2);

  const r = gainTax({ buyEok: buy, sellEok: sell, holdYears: hold, liveYears: live, oneHouse, heavyMulti: !oneHouse && heavyMulti, houses });

  const rows: [string, string][] = [
    ['양도차익 (양도−취득)', e(r.gain)],
    ...(r.taxableGain !== r.gain ? [['과세대상 차익 (12억 초과분 안분)', e(r.taxableGain)] as [string, string]] : []),
    ...(r.ltdRatePct > 0 ? [[`장기보유특별공제 (${r.ltdRatePct}%)`, `-${e(r.ltd)}`] as [string, string]] : []),
    ['과세표준 (− 기본공제 250만)', e(r.base)],
    [`산출세액 · ${r.rateLabel}`, e(r.incomeTax)],
    ['지방소득세 (10%)', e(r.localTax)],
  ];

  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>양도세 계산기</h2>
      <p style={{ fontSize: 13, color: '#8499B3', margin: '0 0 16px' }}>팔 때 양도소득세를 시뮬레이션합니다. (보유 자산 카드의 매입가·현재 추정가를 넣어보세요)</p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 14 }}>
          <label style={lab}>취득가 (억)<input type="number" step="0.5" min="0" value={buy} onChange={(ev) => setBuy(Math.max(0, Number(ev.target.value)))} aria-label="취득가" style={field} /></label>
          <label style={lab}>양도가 (억)<input type="number" step="0.5" min="0" value={sell} onChange={(ev) => setSell(Math.max(0, Number(ev.target.value)))} aria-label="양도가" style={field} /></label>
          <label style={lab}>보유 연수<input type="number" step="1" min="0" value={hold} onChange={(ev) => setHold(Math.max(0, Number(ev.target.value)))} aria-label="보유 연수" style={field} /></label>
          <label style={lab}>거주 연수<input type="number" step="1" min="0" value={live} onChange={(ev) => setLive(Math.max(0, Number(ev.target.value)))} aria-label="거주 연수" style={field} /></label>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={oneHouse} onChange={(ev) => setOneHouse(ev.target.checked)} /> 1세대 1주택
          </label>
          {!oneHouse && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={heavyMulti} onChange={(ev) => setHeavyMulti(ev.target.checked)} /> 다주택 중과 적용
              </label>
              {heavyMulti && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>보유 주택 수
                  <input type="number" min="2" step="1" value={houses} onChange={(ev) => setHouses(Math.max(2, Number(ev.target.value)))} aria-label="보유 주택 수" style={{ ...field, width: 70, marginTop: 0 }} />
                </label>
              )}
            </>
          )}
        </div>

        {r.exempt ? (
          <div style={{ padding: 18, background: 'var(--primary-soft)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{r.rateLabel === '비과세' ? '비과세 — 양도세 0원' : r.rateLabel}</div>
            {r.rateLabel === '비과세' && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>1세대 1주택 · 2년 이상 보유 · 양도가 12억 이하</div>}
          </div>
        ) : (
          <>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontSize: 16 }}>
              <span style={{ fontWeight: 800, color: 'var(--navy)' }}>총 양도세</span>
              <span style={{ fontWeight: 800, color: 'var(--down)' }}>{e(r.total)} <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>(실효 {r.effectivePct}%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>세후 차익</span>
              <span style={{ fontWeight: 800, color: 'var(--up)' }}>{e(r.netGain)}</span>
            </div>
          </>
        )}
        <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 14 }}>※ 1세대 기준 간이 계산. 다주택 중과는 한시 배제(유예) 중일 수 있어 기본 미적용 — 적용 시 토글. 정확한 세액은 전문가 확인 권장.</div>
      </div>
    </section>
  );
}
