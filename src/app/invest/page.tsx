import { InvestSimulator } from '@/components/InvestSimulator';

export const dynamic = 'force-dynamic';

export default function InvestPage() {
  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 추천</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>보유 자본과 대출을 입력하면, 실거래 데이터로 진입 가능한 지역과 매물을 추천합니다.</p>
      <InvestSimulator />
    </div>
  );
}
