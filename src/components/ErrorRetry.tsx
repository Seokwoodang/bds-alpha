'use client';

export function ErrorRetry({ reset, message = '데이터를 불러오지 못했어요.' }: { reset: () => void; message?: string }) {
  return (
    <div role="alert" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid var(--line)', borderRadius: 18, color: 'var(--muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{message}</div>
      <div style={{ fontSize: 14, marginBottom: 20 }}>잠시 후 다시 시도해 주세요.</div>
      <button onClick={reset} style={{ background: 'var(--primary)', border: 'none', borderRadius: 11, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        다시 시도
      </button>
    </div>
  );
}
