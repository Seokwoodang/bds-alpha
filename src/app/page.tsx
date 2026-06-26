import Link from 'next/link';
import { getListings } from '@/lib/queries/listings';
import { getRegions } from '@/lib/queries/regions';
import { getGuides } from '@/lib/queries/guides';
import { getSaved } from '@/lib/queries/savedRead';
import { aggregateStats } from '@/lib/stats';
import { ListingCard } from '@/components/ListingCard';
import { HomeSearch } from '@/components/HomeSearch';
import { HomeGuides } from '@/components/HomeGuides';

export const dynamic = 'force-dynamic';

const VALUE_PROPS = [
  { icon: '📊', title: '실거래 기반 시세', desc: '국토부 실거래가를 정제해 지역·평형별 흐름을 한눈에 보여줍니다.' },
  { icon: '📈', title: '예상 수익률 분석', desc: '임대료·세금·공실을 반영한 실질 수익률로 투자 가치를 판단합니다.' },
  { icon: '🗺️', title: '지도 기반 탐색', desc: '관심 지역의 매물과 시세를 지도 위에서 직관적으로 비교합니다.' },
  { icon: '📚', title: '검증된 투자 가이드', desc: '세금·입지·타이밍까지 실전 투자 노하우를 콘텐츠로 제공합니다.' },
];

export default async function HomePage() {
  const [{ rows }, regions, guides, saved] = await Promise.all([
    getListings({ deal: '전체', region: '전체', ptype: '전체', q: '', sort: '추천순' }),
    getRegions(),
    getGuides(),
    getSaved(),
  ]);
  const featured = rows.slice(0, 4);
  const savedSet = new Set(saved);
  const stats = aggregateStats(rows, regions);

  return (
    <div className="bds-fade">
      {/* 시안 A — 분할형 hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 8px', display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 420px', minWidth: 300 }}>
          <span style={{ display: 'inline-block', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 30, marginBottom: 22 }}>데이터로 검증하는 부동산 투자</span>
          <h1 style={{ fontSize: 'clamp(34px,5vw,52px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--navy)', margin: '0 0 20px' }}>감이 아니라<br />숫자로 투자하세요</h1>
          <p style={{ fontSize: 'clamp(16px,2vw,19px)', lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 32px', maxWidth: 480 }}>실거래 시세, 예상 수익률, 지역별 흐름까지. 부동산알파가 투자 판단에 필요한 모든 데이터를 한 곳에 모았습니다.</p>
          <HomeSearch />
        </div>
        <div style={{ flex: '1 1 380px', minWidth: 300, position: 'relative' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#DCE6F2 0 16px,#E6EEF7 16px 32px)', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, color: '#90A4C0' }}>[ 도심 스카이라인 이미지 ]</span>
          </div>
          <div style={{ position: 'absolute', left: -14, bottom: 28, background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 16px 40px rgba(12,35,64,0.16)', border: '1px solid #EDF1F7' }}>
            <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{stats.topRegion} 평균 매매가</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>{stats.topRegionPrice}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: stats.topRegionChange >= 0 ? 'var(--up)' : 'var(--down)' }}>{stats.topRegionChange >= 0 ? '▲' : '▼'} {Math.abs(stats.topRegionChange).toFixed(1)}%</span>
            </div>
          </div>
          <div style={{ position: 'absolute', right: -10, top: 24, background: 'var(--navy)', color: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 16px 40px rgba(12,35,64,0.24)' }}>
            <div style={{ fontSize: 12, color: '#9FB6D6', fontWeight: 600, marginBottom: 3 }}>평균 예상 수익률</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.avgRoi}% <span style={{ fontSize: 12, fontWeight: 600, color: '#8FE3C0' }}>연</span></div>
          </div>
        </div>
      </section>

      {/* 추천 투자 매물 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>추천 투자 매물</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>수익률과 입지를 함께 분석한 엄선 매물</p>
          </div>
          <Link href="/listings" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>전체보기 →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 }}>
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} isSaved={savedSet.has(l.id)} returnTo="/" />
          ))}
        </div>
      </section>

      {/* 가치 제안 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {VALUE_PROPS.map((vp) => (
            <div key={vp.title}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, marginBottom: 14 }}>{vp.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{vp.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: '#7286A0' }}>{vp.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 가이드 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 꿀팁 & 가이드</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>초보부터 고수까지, 실전 투자 인사이트</p>
          </div>
          <Link href="/guides" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>전체보기 →</Link>
        </div>
        <HomeGuides guides={guides.slice(0, 3)} />
      </section>
    </div>
  );
}
