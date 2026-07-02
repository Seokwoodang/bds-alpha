import Link from 'next/link';
import { getGuides } from '@/lib/queries/guides';
import { getRegionGapAll, getRegionListings } from '@/lib/queries/regionsCode';
import { formatPriceManwon } from '@/lib/property';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import { KoreaChoropleth } from '@/components/KoreaChoropleth';
import { HomeSearch } from '@/components/HomeSearch';
import { HomeGuides } from '@/components/HomeGuides';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const gapAll = await getRegionGapAll();
  const topRegions = [...gapAll].filter((g) => g.jeonse_ratio != null).sort((a, b) => b.jeonse_ratio - a.jeonse_ratio).slice(0, 6);
  const featuredCode = topRegions[0]?.lawd_cd ?? '11680';
  const featuredSgg = CODE_TO_SIGUNGU[featuredCode];
  const [guides, featuredListings] = await Promise.all([getGuides(), getRegionListings(featuredCode, 6)]);

  return (
    <div className="bds-fade">
      {/* 검색 + 전국 지도 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--navy)', margin: '0 0 6px' }}>전국 부동산 투자 지도</h1>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>지역을 클릭해 실거래 시세·갭을 확인하고, 투자하기 좋은 지역과 매물을 찾아보세요.</p>
          </div>
          <div style={{ flex: '0 1 380px', minWidth: 260 }}><HomeSearch /></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <KoreaChoropleth />
        </div>
      </section>

      {/* 투자하기 좋은 지역 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>지금 투자하기 좋은 지역</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>전세가율이 높아 적은 자본으로 갭투자 진입이 유리한 순</p>
          </div>
          <Link href="/compare" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>지역 비교 더보기 →</Link>
        </div>
        {topRegions.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 28, textAlign: 'center', color: 'var(--muted)' }}>지도에서 지역을 클릭해 데이터를 불러오면 여기에 랭킹이 표시됩니다.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {topRegions.map((g, i) => {
              const sgg = CODE_TO_SIGUNGU[g.lawd_cd];
              return (
                <Link key={g.lawd_cd} href={`/prices?code=${g.lawd_cd}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: 'var(--up)', borderRadius: 5, padding: '1px 7px' }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>{sgg?.sido}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{sgg?.name ?? g.lawd_cd}</div>
                  <div style={{ fontSize: 13, color: '#7286A0' }}>전세가율 <strong style={{ color: 'var(--up)' }}>{g.jeonse_ratio}%</strong></div>
                  <div style={{ fontSize: 13, color: '#7286A0' }}>매매 {g.sale_eok}억 · 갭 {g.gap_eok}억</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 눈여겨볼 실거래 매물 */}
      {featuredListings.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>눈여겨볼 실거래 매물</h2>
              <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>{featuredSgg?.sido} {featuredSgg?.name}의 최근 실거래</p>
            </div>
            <Link href={`/listings?code=${featuredCode}`} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>매물 더보기 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {featuredListings.map((t) => (
              <Link key={t.id} href={`/listings/tx/${t.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{featuredSgg?.name}{t.dong ? ` · ${t.dong}` : ''}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8, minHeight: 22 }}>{t.apt_name ?? '—'}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{formatPriceManwon(t.deal_amount)}</div>
                <div style={{ fontSize: 13, color: '#7286A0' }}>전용 {t.area}㎡ · {t.floor ?? '—'}층 · {t.deal_date}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 가이드 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 가이드</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>세금·입지·타이밍 실전 인사이트</p>
          </div>
          <Link href="/guides" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>전체보기 →</Link>
        </div>
        <HomeGuides guides={guides.slice(0, 3)} />
      </section>
    </div>
  );
}
