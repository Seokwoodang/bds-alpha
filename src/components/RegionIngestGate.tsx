'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 아직 수집 안 된 시군구를 처음 열었을 때 국토부에서 온디맨드 수집.
 * /api/ingest-region 호출 → 완료 후 router.refresh()로 페이지 재조회.
 */
export function RegionIngestGate({ code, region }: { code: string; region: string }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch('/api/ingest-region', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, months: 6 }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || '수집 실패');
        if ((j.tx ?? 0) === 0 && (j.rent ?? 0) === 0) {
          setState('error'); setMsg('해당 지역의 최근 실거래 데이터가 없습니다.');
          return;
        }
        router.refresh();
      } catch (e) {
        setState('error'); setMsg((e as Error).message);
      }
    })();
  }, [code, router]);

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: '48px 24px', textAlign: 'center' }}>
      {state === 'loading' ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{region} 실거래 데이터를 불러오는 중…</div>
          <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>이 지역은 처음이라 국토부에서 최근 시세를 가져오고 있어요. (최초 1회, 몇 초)</div>
          <div style={{ marginTop: 16, width: 32, height: 32, margin: '16px auto 0', border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'bdsspin 0.8s linear infinite' }} />
          <style>{`@keyframes bdsspin{to{transform:rotate(360deg)}}`}</style>
        </>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{msg}</div>
      )}
    </div>
  );
}
