import { InvestSimulator } from '@/components/InvestSimulator';
import { LoanCalculator } from '@/components/LoanCalculator';
import { getProfile } from '@/lib/queries/profileRead';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function InvestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initial = user ? await getProfile() : null;

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 추천</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>보유 자본과 대출을 입력하면, 실거래 데이터로 진입 가능한 지역과 매물을 추천합니다. 대출 가능액을 모르면 아래 계산기로 먼저 확인하세요.</p>
      <InvestSimulator initial={initial} loggedIn={!!user} />
      <LoanCalculator />
    </div>
  );
}
