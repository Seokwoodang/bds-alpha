'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { SortKey } from '@/lib/types';

const SORTS: SortKey[] = ['추천순', '가격높은순', '가격낮은순', '수익률순'];

export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(v: string) {
    const params = new URLSearchParams(window.location.search);
    if (v === '추천순') params.delete('sort');
    else params.set('sort', v);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="정렬"
      style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '9px 14px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--ink)', background: '#fff', cursor: 'pointer' }}
    >
      {SORTS.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  );
}
