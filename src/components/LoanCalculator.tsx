'use client';

import { useMemo, useState } from 'react';
import { loanLimit, type RegionKind } from '@/lib/loan';

const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', outline: 'none', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 };
const e1 = (n: number) => `${n.toLocaleString('ko-KR')}억`;

const REGIONS: { key: RegionKind; label: string }[] = [
  { key: '규제', label: '규제지역(강남·서초·송파·용산)' },
  { key: '수도권', label: '수도권(서울·경기·인천)' },
  { key: '기타', label: '그 외 지방' },
];

/** 주택담보대출 한도 계산기 — LTV∧DSR + 수도권·규제 총액상한. 간이·참고용. */
export function LoanCalculator() {
  const [price, setPrice] = useState<number | ''>(8);
  const [region, setRegion] = useState<RegionKind>('수도권');
  const [income, setIncome] = useState<number | ''>(6000);
  const [owned, setOwned] = useState<number | ''>(0);
  const [firstTime, setFirstTime] = useState(false);
  const [rate, setRate] = useState<number | ''>(4);
  const [years, setYears] = useState<number | ''>(30);
  const [variable, setVariable] = useState(true);
  const [existing, setExisting] = useState<number | ''>('');

  const n = (v: number | '') => (v === '' ? 0 : v);
  const r = useMemo(() => loanLimit({
    priceEok: n(price), region, owned: n(owned), firstTime, incomeManwon: n(income),
    existingAnnualManwon: n(existing), ratePct: n(rate), years: n(years), variable,
  }), [price, region, income, owned, firstTime, rate, years, variable, existing]);

  return (
    <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, marginTop: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>내 대출 한도 계산 (LTV · DSR)</h2>
      <p style={{ fontSize: 14, color: '#7286A0', margin: '0 0 18px' }}>집값·소득·지역·보유주택으로 <strong>담보(LTV)</strong>와 <strong>소득(DSR)</strong> 한도를 함께 계산합니다.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        <div><label style={lbl}>집값 (억)</label><input type="number" step="0.5" min="0" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} aria-label="집값" style={field} /></div>
        <div><label style={lbl}>지역</label>
          <select value={region} onChange={(e) => setRegion(e.target.value as RegionKind)} aria-label="지역 구분" style={field}>
            {REGIONS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </div>
        <div><label style={lbl}>연소득 (만원)</label><input type="number" step="100" min="0" value={income} onChange={(e) => setIncome(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} aria-label="연소득" style={field} /></div>
        <div><label style={lbl}>보유 주택 수</label><input type="number" step="1" min="0" value={owned} onChange={(e) => setOwned(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))} aria-label="보유 주택 수" style={field} /></div>
        <div><label style={lbl}>금리 (%)</label><input type="number" step="0.1" min="0" value={rate} onChange={(e) => setRate(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} aria-label="금리" style={field} /></div>
        <div><label style={lbl}>만기 (년)</label><input type="number" step="1" min="1" value={years} onChange={(e) => setYears(e.target.value === '' ? '' : Math.max(1, Math.floor(Number(e.target.value))))} aria-label="만기" style={field} /></div>
        <div><label style={lbl}>기존 대출 연상환 (만원)</label><input type="number" step="100" min="0" value={existing} onChange={(e) => setExisting(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} placeholder="0" aria-label="기존 대출 연상환" style={field} /></div>
        <label style={{ alignSelf: 'end', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink)', paddingBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={variable} onChange={(e) => setVariable(e.target.checked)} /> 변동금리(스트레스 DSR)
        </label>
        {n(owned) === 0 && (
          <label style={{ alignSelf: 'end', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink)', paddingBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} /> 생애최초
          </label>
        )}
      </div>

      {/* 결과 */}
      <div style={{ marginTop: 20, background: 'var(--navy)', borderRadius: 14, padding: 20, color: '#fff' }}>
        {r.blocked ? (
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FCA5A5' }}>🚫 다주택자는 {region === '기타' ? '' : '수도권·규제지역에서 '}주택담보대출이 불가합니다.</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#9FB6D6', marginBottom: 4 }}>최대 대출 한도 (LTV·DSR 중 작은 값)</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>{e1(r.finalLimit)}
              <span style={{ fontSize: 14, fontWeight: 700, color: '#8FE3C0', marginLeft: 8 }}>{r.binding} 기준</span>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14 }}>
              <div><div style={{ fontSize: 11, color: '#9FB6D6' }}>담보(LTV {r.ltvPct}%)</div><div style={{ fontSize: 16, fontWeight: 700 }}>{e1(r.ltvLimit)}{r.cap != null && r.ltvByRatio > r.cap && <span style={{ fontSize: 11, color: '#FBBF77' }}> (상한 {r.cap}억)</span>}</div></div>
              <div><div style={{ fontSize: 11, color: '#9FB6D6' }}>소득(DSR 40%{r.stressPct ? ` +스트레스 ${r.stressPct}%p` : ''})</div><div style={{ fontSize: 16, fontWeight: 700 }}>{e1(r.dsrLimit)}</div></div>
            </div>
          </>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 10, lineHeight: 1.6 }}>
        ※ 2025 6.27 대책 + 2026 스트레스 DSR 3단계 기준 간이 계산(참고용). 수도권·규제지역 총액상한(15억↓ 6억/~25억 4억/25억↑ 2억)·다주택 금지·생애최초(수도권·규제 70%) 반영. 실제 한도는 은행·개인 신용·정책에 따라 달라집니다.
      </div>
    </section>
  );
}
