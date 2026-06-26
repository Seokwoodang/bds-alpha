'use client';

import { useEffect, useRef } from 'react';
import type { Guide } from '@/lib/types';
import { cover } from '@/lib/cover';

/** 가이드 리딩 모달. role=dialog + ESC + focus-trap + body scroll-lock + 포커스 복귀. */
export function GuideOverlay({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    // 첫 포커스 가능한 요소(닫기 버튼)로 포커스 이동
    const focusables = () =>
      dialog
        ? Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'))
        : [];
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(12,35,64,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: '40px 20px', animation: 'bdsFade .25s ease' }}
    >
      <article
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={guide.title}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, maxWidth: 680, width: '100%', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}
      >
        <div style={{ height: 200, background: cover(guide.hue), display: 'flex', alignItems: 'flex-end', padding: 24, position: 'relative' }}>
          <button onClick={onClose} aria-label="닫기" style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--navy)' }}>✕</button>
          <span style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 30 }}>{guide.category}</span>
        </div>
        <div style={{ padding: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.25, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{guide.title}</h2>
          <div style={{ fontSize: 13, color: '#9AACC2', fontWeight: 600, marginBottom: 24 }}>{guide.meta}</div>
          {guide.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-soft)', margin: '0 0 18px' }}>{para}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
