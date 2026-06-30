'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/types';
import { formatPriceManwon, holdingText, estimatePL } from '@/lib/property';
import { rentalYield, leaseStatus, nextRentDate, rentText } from '@/lib/rental';
import { assessedFromMarket, propertyTax, comprehensiveRealEstateTax } from '@/lib/holdingTax';
import { monthlyRentTotal, cashflow, leaseAlerts } from '@/lib/portfolio';
import { deleteProperty } from '@/lib/queries/properties';
import { PropertyForm } from '@/components/PropertyForm';
import { EmptyState } from '@/components/EmptyState';

export function MyAssets({ properties, valuations }: { properties: Property[]; valuations: Record<string, number | null> }) {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'add' | { edit: Property }>('list');
  const [, startTransition] = useTransition();
  const now = new Date();

  function remove(p: Property) {
    if (!confirm(`'${p.name}' 자산을 삭제할까요?`)) return;
    startTransition(async () => {
      await deleteProperty(p.id);
      router.refresh();
    });
  }

  // 보유세 요약(간이): 공시가 = 추정 시세(없으면 매입가) × 현실화율
  const marketEokOf = (p: Property) => valuations[p.id] ?? p.purchase_price / 10000;
  const single = properties.length === 1;
  const propTaxOf = (p: Property) => propertyTax(assessedFromMarket(marketEokOf(p)), single);
  const totalAssessedEok = properties.reduce((s, p) => s + assessedFromMarket(marketEokOf(p)), 0);
  const totalPropertyTax = properties.reduce((s, p) => s + (propTaxOf(p)?.total ?? 0), 0);
  const cret = comprehensiveRealEstateTax(totalAssessedEok, properties.length, single);
  const totalHolding = Math.round((totalPropertyTax + cret.tax) * 10) / 10;
  const won = (manwon: number) => `${manwon.toLocaleString('ko-KR')}만원`;
  // 임대 현금흐름 + 계약 만기 알림
  const rentTotal = monthlyRentTotal(properties);
  const cf = cashflow(rentTotal, totalHolding);
  const alerts = leaseAlerts(properties, now);

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>
          내 보유 자산 <span style={{ color: 'var(--primary)' }}>{properties.length}</span>
        </h2>
        {mode === 'list' && (
          <button onClick={() => setMode('add')} style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>+ 자산 추가</button>
        )}
      </div>

      {mode === 'list' && alerts.count > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#C2410C', marginBottom: alerts.expired.length || alerts.soon.length ? 6 : 0 }}>
            ⏰ 계약 만기 주의 {alerts.count}건
          </div>
          <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.7 }}>
            {alerts.expired.map((p) => <div key={p.id}><strong>{p.name}</strong> · 만기 경과 — 갱신/정산 필요</div>)}
            {alerts.soon.map((p) => <div key={p.id}><strong>{p.name}</strong> · 만기 임박(D-{leaseStatus(p.lease_end, now)!.dday}) — 갱신 협의 시점</div>)}
          </div>
        </div>
      )}

      {properties.length > 0 && mode === 'list' && (
        <div style={{ background: 'linear-gradient(135deg,var(--navy),#2A4365)', borderRadius: 16, padding: 18, marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 10 }}>연간 보유세 추정 <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>(간이 · 공시가 시세×{Math.round(0.69 * 100)}% 추정)</span></div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>합계</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{won(totalHolding)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>재산세 합</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{won(Math.round(totalPropertyTax * 10) / 10)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>종합부동산세 {cret.taxable ? '' : '(비과세)'}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{won(cret.tax)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>공시가 합 / 공제</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{cret.totalAssessedEok}억 / {cret.deductionEok}억</div>
            </div>
          </div>
          {rentTotal > 0 && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>월 임대수입</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{won(cf.monthlyRent)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>월 보유세(연÷12)</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>−{won(cf.monthlyTax)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>월 순현금흐름</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: cf.netMonthly >= 0 ? '#86EFAC' : '#FCA5A5' }}>{cf.netMonthly >= 0 ? '+' : ''}{won(cf.netMonthly)}</div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 10 }}>※ 세부담상한·세액공제·지역자원시설세 미반영. 종부세는 인별 합산({properties.length}채{single ? ' · 1세대1주택 가정' : properties.length >= 3 ? ' · 3주택+ 중과' : ''}) 기준.</div>
        </div>
      )}

      {mode === 'add' && <PropertyForm editing={null} onDone={() => setMode('list')} />}
      {typeof mode === 'object' && 'edit' in mode && <PropertyForm editing={mode.edit} onDone={() => setMode('list')} />}

      {properties.length === 0 && mode === 'list' ? (
        <EmptyState icon="🏠" title="등록된 보유 자산이 없어요" desc="보유 중인 집을 등록하면 한곳에서 관리할 수 있어요." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {properties.map((p) => {
            const pl = estimatePL(p.purchase_price, valuations[p.id] ?? null);
            const up = pl ? pl.diffEok >= 0 : false;
            return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 5 }}>{p.type}</span>
                <span style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>{p.region}{p.dong ? ` ${p.dong}` : ''}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 4 }}>{formatPriceManwon(p.purchase_price)}</div>
              <div style={{ fontSize: 13, color: '#7286A0', marginBottom: 4 }}>{p.area}㎡ · 매입 {p.purchase_date}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 12 }}>보유 {holdingText(p.purchase_date, now)}{p.memo ? ` · ${p.memo}` : ''}</div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                <button onClick={() => setMode({ edit: p })} style={{ flex: 1, background: '#fff', border: '1px solid var(--line)', borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>수정</button>
                <button onClick={() => remove(p)} style={{ flex: 1, background: '#fff', border: '1px solid var(--line)', borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 700, color: 'var(--down)', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
              </div>
              {pl ? (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                  <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>현재 추정가 (지역·면적대 중위)</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{pl.currentEok}억</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: up ? 'var(--up)' : 'var(--down)' }}>
                      {up ? '▲' : '▼'} {Math.abs(pl.diffEok)}억 ({up ? '+' : ''}{pl.pct}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 10 }}>비교 실거래가 부족해 평가손익을 산출하지 못했어요.</div>
              )}
              {(() => {
                const pt = propTaxOf(p);
                return pt ? (
                  <div style={{ fontSize: 12, color: '#7286A0', marginTop: 8 }}>
                    재산세(연) <strong style={{ color: 'var(--navy)' }}>{won(pt.total)}</strong>
                    <span style={{ color: 'var(--muted-2)' }}> · 공시 {pt.assessedEok}억</span>
                  </div>
                ) : null;
              })()}
              {p.is_rental && (() => {
                const ry = rentalYield(p.purchase_price, p.deposit, p.monthly_rent);
                const ls = leaseStatus(p.lease_end, now);
                const nr = nextRentDate(p.rent_day, now);
                return (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: 'var(--up)', padding: '2px 7px', borderRadius: 5 }}>임대</span>
                      {ry && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>{rentText(p.monthly_rent)}</span>}
                    </div>
                    {ry && (
                      <div style={{ fontSize: 12, color: '#7286A0', marginBottom: 3 }}>
                        임대수익률 <strong style={{ color: 'var(--up)' }}>{ry.netPct ?? ry.grossPct}%</strong>
                        <span style={{ color: 'var(--muted-2)' }}> (실질{ry.netPct != null ? '' : '·산출불가'} / 표면 {ry.grossPct}%)</span>
                      </div>
                    )}
                    {nr && <div style={{ fontSize: 12, color: '#7286A0', marginBottom: 3 }}>다음 월세 {nr.label}</div>}
                    {ls && (
                      <div style={{ fontSize: 12, fontWeight: ls.soon || ls.expired ? 800 : 600, color: ls.expired ? 'var(--down)' : ls.soon ? '#D97706' : '#7286A0' }}>
                        계약 만기 {ls.label}{ls.soon && !ls.expired ? ' · 갱신 임박' : ''}{ls.expired ? ' · 갱신 필요' : ''}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
          })}
        </div>
      )}
    </section>
  );
}
