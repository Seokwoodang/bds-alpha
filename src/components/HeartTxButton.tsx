'use client';

import { useEffect, useState, useTransition } from 'react';
import { toggleSaveTx } from '@/lib/queries/savedTx';

/** 개별 실거래 관심 하트(낙관적). listingId 대신 tx id 사용. */
export function HeartTxButton({ txId, isSaved, returnTo, variant = 'card' }: { txId: number; isSaved: boolean; returnTo: string; variant?: 'card' | 'detail' }) {
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(isSaved);
  useEffect(() => setSaved(isSaved), [isSaved]);

  function onClick(e?: React.MouseEvent) {
    e?.preventDefault();
    setSaved((s) => !s);
    startTransition(() => { toggleSaveTx(txId, returnTo); });
  }

  if (variant === 'detail') {
    return (
      <button onClick={onClick} aria-pressed={saved} aria-label={saved ? '관심 매물 저장됨' : '관심 매물 저장'}
        style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14, color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
        <span style={{ color: 'var(--down)', fontSize: 16 }}>{saved ? '♥' : '♡'}</span> 관심 매물 저장
      </button>
    );
  }
  return (
    <button onClick={onClick} aria-pressed={saved} aria-label={saved ? '관심 매물 저장됨' : '관심 매물 저장'}
      style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--down)', cursor: 'pointer', zIndex: 2 }}>
      {saved ? '♥' : '♡'}
    </button>
  );
}
