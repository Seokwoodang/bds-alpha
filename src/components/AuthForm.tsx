'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', outline: 'none' };

export function AuthForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }

    setPending(true);
    const supabase = createClient();
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return; }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message.includes('registered') ? '이미 가입된 이메일입니다.' : '회원가입에 실패했습니다.');
          return;
        }
      }
      router.push(returnTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function social(provider: 'google' | 'kakao') {
    setError(null);
    // TODO(F1): Supabase 콘솔에서 Google/Kakao provider 활성화 후 아래 redirect 코드로 교체.
    // 현재는 provider 미설정(deferred)이라 OAuth로 리다이렉트하면 Supabase 오류 페이지로 이탈하므로,
    // 인앱에서 "준비 중"으로 안내한다.
    const enabled = process.env.NEXT_PUBLIC_OAUTH_ENABLED === 'true';
    if (!enabled) {
      setError(`${provider === 'google' ? 'Google' : '카카오'} 로그인은 준비 중입니다. (provider 설정 필요)`);
      return;
    }
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setError(`${provider === 'google' ? 'Google' : '카카오'} 로그인 중 오류가 발생했습니다.`);
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 11, marginBottom: 24 }}>
        {(['login', 'signup'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); }} aria-pressed={mode === m}
            style={{ flex: 1, border: 'none', borderRadius: 9, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, background: mode === m ? '#fff' : 'transparent', color: mode === m ? 'var(--primary)' : '#7286A0' }}>
            {m === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} aria-label="이메일" />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} aria-label="비밀번호" />
        </label>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--down)', fontWeight: 600 }}>{error}</div>}
        <button type="submit" disabled={pending} style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#9AACC2', fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} /> 또는 <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => social('google')} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Google로 계속하기</button>
        <button onClick={() => social('kakao')} style={{ background: '#FEE500', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, color: '#3A1D1D', cursor: 'pointer', fontFamily: 'inherit' }}>카카오로 계속하기</button>
      </div>
    </div>
  );
}
