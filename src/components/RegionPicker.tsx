'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BY_SIDO, SIDO_LIST, CODE_TO_SIGUNGU } from '@/lib/regions-kr';

const sel: React.CSSProperties = { border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', background: '#fff', outline: 'none', minWidth: 140 };

/** 전국 시/도 → 시군구 선택 → {basePath}?code= 이동. */
export function RegionPicker({ code, basePath = '/prices' }: { code: string; basePath?: string }) {
  const router = useRouter();
  const current = CODE_TO_SIGUNGU[code];
  const [sido, setSido] = useState(current?.sido ?? SIDO_LIST[0]);

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
      <select style={sel} value={sido} onChange={(e) => setSido(e.target.value)} aria-label="시도 선택">
        {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={sel} value={current?.sido === sido ? code : ''} onChange={(e) => { if (e.target.value) router.push(`${basePath}?code=${e.target.value}`); }} aria-label="시군구 선택">
        <option value="">시군구 선택</option>
        {(BY_SIDO[sido] ?? []).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
      </select>
      {current && <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>선택: <strong style={{ color: 'var(--navy)' }}>{current.sido} {current.name}</strong></span>}
    </div>
  );
}
