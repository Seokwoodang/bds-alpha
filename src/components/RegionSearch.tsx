'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SIGUNGU, type Sigungu } from '@/lib/regions-kr';

/**
 * 전국 시군구 자동완성 검색 → /prices?code=.
 * (단지명 검색은 지역 선택 후 매물 화면에서 — 전국 단지명 인덱스는 미보유라 정직하게 지역만)
 */
export function RegionSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo<Sigungu[]>(() => {
    const kw = q.trim();
    if (!kw) return [];
    const starts = SIGUNGU.filter((s) => s.name.startsWith(kw));
    const contains = SIGUNGU.filter((s) => !s.name.startsWith(kw) && (s.name.includes(kw) || s.sido.includes(kw)));
    return [...starts, ...contains].slice(0, 8);
  }, [q]);

  function go(s: Sigungu) {
    setOpen(false);
    setQ('');
    router.push(`/prices?code=${s.code}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) {
      if (e.key === 'Enter' && matches[0]) go(matches[0]);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[hi]) go(matches[hi]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div style={{ position: 'relative', maxWidth: 480 }}>
      <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '11px 16px', boxShadow: '0 10px 30px rgba(12,35,64,0.07)', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#A6B6CC', fontSize: 18 }}>⌕</span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={onKey}
          placeholder="지역 검색 (예: 해운대구, 분당구)"
          aria-label="지역 검색"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', background: 'none', minWidth: 0 }}
        />
      </div>
      {open && q.trim() && (
        <div role="listbox" aria-label="추천 지역 목록" style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 16px 40px rgba(12,35,64,0.14)', overflow: 'hidden', zIndex: 30 }}>
          {matches.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--muted-2)' }}>일치하는 지역이 없어요</div>
          ) : (
            matches.map((s, i) => (
              <button key={s.code} role="option" aria-selected={i === hi}
                onMouseDown={(e) => { e.preventDefault(); if (blurTimer.current) clearTimeout(blurTimer.current); go(s); }}
                onMouseEnter={() => setHi(i)}
                style={{ display: 'flex', width: '100%', alignItems: 'baseline', gap: 8, padding: '11px 16px', border: 'none', background: i === hi ? 'var(--primary-soft)' : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{s.name}</span>
                <span style={{ fontSize: 12, color: '#8499B3' }}>{s.sido}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
