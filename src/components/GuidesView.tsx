'use client';

import { useCallback, useState } from 'react';
import type { Guide } from '@/lib/types';
import { cover } from '@/lib/cover';
import { GuideOverlay } from '@/components/GuideOverlay';

export function GuidesView({ guides }: { guides: Guide[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = guides.find((g) => g.id === openId) ?? null;
  const handleClose = useCallback(() => setOpenId(null), []);
  const [featured, ...rest] = guides;

  return (
    <>
      {featured && (
        <button onClick={() => setOpenId(featured.id)} className="bds-card"
          style={{ textAlign: 'left', width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ flex: '1 1 300px', minHeight: 220, background: cover(featured.hue) }} />
          <div style={{ flex: '1 1 320px', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ width: 'fit-content', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 30, marginBottom: 14 }}>{featured.category} · 추천</span>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3, marginBottom: 12, letterSpacing: '-0.02em' }}>{featured.title}</div>
            <div style={{ fontSize: 15, color: '#7286A0', lineHeight: 1.6, marginBottom: 16 }}>{featured.excerpt}</div>
            <div style={{ fontSize: 13, color: '#9AACC2', fontWeight: 600 }}>{featured.meta}</div>
          </div>
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 22 }}>
        {rest.map((g) => (
          <button key={g.id} onClick={() => setOpenId(g.id)} className="bds-card"
            style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 140, background: cover(g.hue), display: 'flex', alignItems: 'flex-end', padding: 14 }}>
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
