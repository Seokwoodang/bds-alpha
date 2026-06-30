'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/types';
import { formatPriceManwon, holdingText } from '@/lib/property';
import { deleteProperty } from '@/lib/queries/properties';
import { PropertyForm } from '@/components/PropertyForm';
import { EmptyState } from '@/components/EmptyState';

export function MyAssets({ properties }: { properties: Property[] }) {
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

      {mode === 'add' && <PropertyForm editing={null} onDone={() => setMode('list')} />}
      {typeof mode === 'object' && 'edit' in mode && <PropertyForm editing={mode.edit} onDone={() => setMode('list')} />}

      {properties.length === 0 && mode === 'list' ? (
        <EmptyState icon="🏠" title="등록된 보유 자산이 없어요" desc="보유 중인 집을 등록하면 한곳에서 관리할 수 있어요." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {properties.map((p) => (
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
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 10 }}>평가손익은 실거래가 연동 후 제공됩니다.</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
