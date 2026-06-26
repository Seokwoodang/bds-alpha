import { getGuides } from '@/lib/queries/guides';
import { GuidesView } from '@/components/GuidesView';

export const dynamic = 'force-dynamic';

export default async function GuidesPage() {
  const guides = await getGuides();
  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 꿀팁 & 가이드</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 28px' }}>초보부터 고수까지, 실전에서 통하는 부동산 투자 인사이트.</p>
      <GuidesView guides={guides} />
    </div>
  );
}
