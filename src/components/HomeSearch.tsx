'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUICK = ['강남구', '서초구', '마포구', '성동구', '용산구'];

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function submit() {
    // 빈 q여도 목록으로 이동(AD4).
    router.push(q.trim() ? `/listings?q=${encodeURIComponent(q.trim())}` : '/listings');
  }

  return (
    <>
      <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '7px 7px 7px 18px', boxShadow: '0 10px 30px rgba(12,35,64,0.07)', maxWidth: 480, alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#A6B6CC', fontSize: 18 }}>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="지역, 단지명으로 검색 (예: 강남구)"
          aria-label="매물 검색"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', background: 'none', minWidth: 0 }}
        />
        <button onClick={submit} style={{ background: 'var(--primary)', border: 'none', borderRadius: 9, padding: '11px 22px', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>검색</button>
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 16, flexWrap: 'wrap' }}>
        {QUICK.map((r) => (
          <button key={r} onClick={() => router.push(`/listings?region=${encodeURIComponent(r)}`)}
            style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 30, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#5B6E88', cursor: 'pointer' }}>{r}</button>
        ))}
      </div>
    </>
  );
}
