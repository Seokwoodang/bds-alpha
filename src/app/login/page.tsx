import { AuthForm } from '@/components/AuthForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  // 오픈 리다이렉트 방지: 내부 경로(/로 시작, //가 아님)만 허용.
  const safeReturn = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>부동산알파 로그인</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 32px', textAlign: 'center' }}>관심 매물 저장과 맞춤 분석을 위해 로그인하세요.</p>
      <AuthForm returnTo={safeReturn} />
    </div>
  );
}
