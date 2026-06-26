'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { label: '홈', href: '/' },
  { label: '매물', href: '/listings' },
  { label: '시세', href: '/prices' },
  { label: '가이드', href: '/guides' },
  { label: '지도', href: '/map' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  // detail(/listings/[id])는 '매물' 무강조 — 정확 일치만.
  return pathname === href;
}

export function Header({ isAuthed, savedCount }: { isAuthed: boolean; savedCount: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#1C5DDA,#0A357F)', color: '#fff', fontWeight: 800, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(28,93,218,0.32)' }}>α</span>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--navy)' }}>부동산<span style={{ color: 'var(--primary)' }}>알파</span></span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {NAV.map((n) => {
            const on = isActive(pathname, n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} style={{ background: on ? 'var(--primary-soft)' : 'none', borderRadius: 9, padding: '9px 15px', fontSize: 15, fontWeight: on ? 700 : 600, color: on ? 'var(--primary)' : 'var(--ink-soft)' }}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/mypage" aria-label={isAuthed ? `관심목록 ${savedCount}개` : '마이페이지'} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 13px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
            <span style={{ fontSize: 15 }}>♡</span>
            {isAuthed && (
              <span style={{ display: 'inline-block', minWidth: 18, textAlign: 'center', background: 'var(--primary)', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{savedCount}</span>
            )}
          </Link>
          {isAuthed ? (
            <button onClick={logout} style={{ background: 'var(--navy)', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
          ) : (
            <Link href="/login" style={{ background: 'var(--navy)', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: '#fff' }}>로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
