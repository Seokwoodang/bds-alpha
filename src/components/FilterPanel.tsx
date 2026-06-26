'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { QuerySpec } from '@/lib/types';

const DEALS = ['전체', '매매', '전세', '월세'];
const REGIONS = ['전체', '강남구', '서초구', '송파구', '용산구', '성동구', '마포구', '광진구', '영등포구'];
const PTYPES = ['전체', '아파트', '오피스텔', '주택', '오피스'];

function segStyle(on: boolean): React.CSSProperties {
  return { border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, background: on ? '#fff' : 'transparent', color: on ? 'var(--primary)' : '#7286A0', boxShadow: on ? '0 2px 6px rgba(12,35,64,0.12)' : 'none' };
}
function chipStyle(on: boolean): React.CSSProperties {
  return { borderRadius: 30, padding: '8px 15px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 700 : 600, whiteSpace: 'nowrap', border: `1px solid ${on ? 'var(--primary)' : 'var(--line)'}`, background: on ? 'var(--primary)' : '#fff', color: on ? '#fff' : '#5B6E88' };
}

export function FilterPanel({ spec }: { spec: QuerySpec }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(spec.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 동기 파라미터 누적기: router.replace가 URL을 비동기로 갱신하므로,
  // 빠른 연속 클릭이 직전 변경을 덮어쓰지 않도록 ref에 즉시 반영. spec(서버 진실) 변경 시 재동기화.
  const paramsRef = useRef<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    setQ(spec.q);
    const p = new URLSearchParams();
    if (spec.deal !== '전체') p.set('deal', spec.deal);
    if (spec.region !== '전체') p.set('region', spec.region);
    if (spec.ptype !== '전체') p.set('ptype', spec.ptype);
    if (spec.q) p.set('q', spec.q);
    if (spec.sort !== '추천순') p.set('sort', spec.sort);
    paramsRef.current = p;
  }, [spec]);

  function pushParam(key: string, value: string) {
    const params = paramsRef.current; // 동기 누적
    if (!value || value === '전체') params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParam('q', value.trim()), 300);
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 11, padding: '6px 6px 6px 16px', marginBottom: 18, gap: 10 }}>
        <span style={{ color: '#A6B6CC', fontSize: 17 }}>⌕</span>
        <input
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="단지명, 지역으로 검색"
          aria-label="매물 검색"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', minWidth: 0 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 11, width: 'fit-content', marginBottom: 16, flexWrap: 'wrap' }}>
        {DEALS.map((d) => (
          <button key={d} aria-pressed={spec.deal === d} onClick={() => pushParam('deal', d)} style={segStyle(spec.deal === d)}>{d}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {REGIONS.map((r) => (
          <button key={r} aria-pressed={spec.region === r} onClick={() => pushParam('region', r)} style={chipStyle(spec.region === r)}>{r}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PTYPES.map((p) => (
          <button key={p} aria-pressed={spec.ptype === p} onClick={() => pushParam('ptype', p)} style={chipStyle(spec.ptype === p)}>{p}</button>
        ))}
      </div>
    </div>
  );
}
