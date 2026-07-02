'use client';

import { useState } from 'react';
import { gainTax } from '@/lib/gainTax';

const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, outline: 'none' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--muted)' };
const e1 = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('ko-KR')}억`;

/**
 * 이 매물을 지금 이 가격에 사서 나중에 팔 때 양도세 간이 시뮬레이션.
 * 취득가 = 실거래가 고정, 매도가·보유연수·1세대1주택은 사용자가 조정.
 */
export function SellTaxSim({ buyEok }: { buyEok: number }) {
  const [sell, setSell] = useState<number | ''>(Math.round(buyEok * 1.2 * 10) / 10); // 기본 +20% 가정
  const [years, setYears] = useState<number | ''>(3);
  const [oneHouse, setOneHouse] = useState(true);

  const sellV = sell === '' ? 0 : sell;
  const yearsV = years === '' ? 0 : years;
  const r = sellV > 0 ? gainTax({ buyEok, sellEok: sellV, holdYears: yearsV, liveYears: 0, oneHouse }) : null;

  return (
    <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22, marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>매도 시 양도세 (간이)</h2>
      <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 16 }}>이 실거래가({e1(buyEok)})에 취득했다고 가정하고, 매도 시나리오의 세금·세후 차익을 계산합니다.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 14 }}>
        <label style={lbl}>예상 매도가(억)
          <input type="number" min="0" step="0.5" value={sell} aria-label="예상 매도가"
            onChange={(ev) => setSell(ev.target.value === '' ? '' : Math.max(0, Number(ev.target.value)))} style={{ ...field, marginTop: 5 }} />
        </label>
        <label style={lbl}>보유 연수
          <input type="number" min="0" step="1" value={years} aria-label="보유 연수"
            onChange={(ev) => setYears(ev.target.value === '' ? '' : Math.max(0, Math.floor(Number(ev.target.value))))} style={{ ...field, marginTop: 5 }} />
        </label>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 7, alignSelf: 'end', paddingBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={oneHouse} onChange={(ev) => setOneHouse(ev.target.checked)} />
          1세대 1주택
        </label>
      </div>

      {r && (
        r.exempt ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700, color: 'var(--up)' }}>
            비과세 — 양도세 0원 (1세대1주택 · 2년 이상 보유 · 12억 이하)
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { k: '양도차익', v: e1(r.gain), c: 'var(--navy)' },
              { k: `총 양도세 (${r.rateLabel})`, v: e1(r.total), c: 'var(--down)' },
              { k: '실효세율', v: `${r.effectivePct}%`, c: 'var(--navy)' },
              { k: '세후 차익', v: e1(r.netGain), c: 'var(--up)' },
            ].map((x) => (
              <div key={x.k} style={{ flex: '1 1 120px', background: 'var(--bg)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{x.k}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>
        )
      )}
      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 10 }}>※ 거주연수·필요경비·다주택 중과 미반영 간이 계산. 정밀 계산은 마이페이지 양도세 계산기.</div>
    </section>
  );
}
