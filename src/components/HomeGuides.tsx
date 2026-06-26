'use client';

import { useCallback, useState } from 'react';
import type { Guide } from '@/lib/types';
import { cover } from '@/lib/cover';
import { GuideOverlay } from '@/components/GuideOverlay';

export function HomeGuides({ guides }: { guides: Guide[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = guides.find((g) => g.id === openId) ?? null;
  const handleClose = useCallback(() => setOpenId(null), []);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 22 }}>
        {guides.map((g) => (
          <button key={g.id} onClick={() => setOpenId(g.id)} className="bds-card"
            style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 130, background: cover(g.hue), display: 'flex', alignItems: 'flex-end', padding: 14 }}>
              <span style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 30 }}>{g.category}</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.35, marginBottom: 8 }}>{g.title}</div>
              <div style={{ fontSize: 14, color: '#7286A0', lineHeight: 1.5, marginBottom: 14 }}>{g.excerpt}</div>
              <div style={{ fontSize: 12, color: '#9AACC2', fontWeight: 600 }}>{g.meta}</div>
            </div>
          </button>
        ))}
      </div>
      {open && <GuideOverlay guide={open} onClose={handleClose} />}
    </>
  );
}
