'use client';

import { useEffect, useState, useTransition } from 'react';
import { toggleSave } from '@/lib/queries/saved';

export function HeartButton({
  listingId,
  isSaved,
  returnTo,
  variant = 'card',
}: {
  listingId: number;
  isSaved: boolean;
  returnTo: string;
  variant?: 'card' | 'detail';
}) {
  const [, startTransition] = useTransition();
  // 낙관적 로컬 상태: 클릭 즉시 토글 반영(즉각 피드백 + 전역 동기 C46). 서버 prop 갱신 시 재동기화.
  // 버튼은 비활성화하지 않음 — 낙관적 UI라 즉시 반응, revalidation 라운드트립 동안 멈춰 보이지 않게.
  const [saved, setSaved] = useState(isSaved);
  useEffect(() => setSaved(isSaved), [isSaved]);

  function onClick() {
    setSaved((s) => !s); // 낙관적 업데이트
    startTransition(() => {
      // 서버 액션: 비로그인이면 내부에서 /login으로 redirect. 성공 시 revalidate로 서버 상태 동기.
      toggleSave(listingId, returnTo);
    });
  }

  if (variant === 'detail') {
    return (
      <button
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? '관심 매물 저장됨' : '관심 매물 저장'}
        style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14, color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
      >
        <span style={{ color: 'var(--down)', fontSize: 16 }}>{saved ? '♥' : '♡'}</span> 관심 매물 저장
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? '관심 매물 저장됨' : '관심 매물 저장'}
      style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--down)', cursor: 'pointer', zIndex: 2 }}
    >
      {saved ? '♥' : '♡'}
    </button>
  );
}
