import { notFound } from 'next/navigation';
import { getListingById, getSimilar } from '@/lib/queries/listings';
import { getSaved } from '@/lib/queries/savedRead';
import { getProperties } from '@/lib/queries/propertiesRead';
import { TaxEstimate } from '@/components/TaxEstimate';
import { detailSpecs, detailPoints, dealBadge } from '@/lib/format';
import { LISTING_COVER } from '@/lib/cover';
import { ListingCard } from '@/components/ListingCard';
import { HeartButton } from '@/components/HeartButton';
import { BackLink } from '@/components/BackLink';

// force-dynamic을 두지 않음: 쿠키(Supabase 세션) 사용으로 어차피 동적이며,
// 스트리밍 커밋 전에 notFound()가 평가되어 올바른 404 상태가 반환됨.
export const dynamic = 'auto';

const GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 };

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const listing = await getListingById(id);
  if (!listing) notFound();

  const [similar, saved, properties] = await Promise.all([getSimilar(listing.region, listing.id), getSaved(), getProperties()]);
  const savedSet = new Set(saved);
  const ownedCount = properties.length;
  const specs = detailSpecs(listing);
  const points = detailPoints(listing);
  const badge = dealBadge(listing.deal);
  const returnTo = `/listings/${listing.id}`;

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 64px' }}>
      <BackLink />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 520px', minWidth: 300 }}>
          <div style={{ position: 'relative', height: 360, borderRadius: 18, background: LISTING_COVER, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', marginBottom: 14 }}>
            <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, color: '#9FB1C9' }}>[ 매물 대표 사진 ]</span>
            <span style={{ position: 'absolute', top: 16, left: 16, background: badge.bg, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{listing.deal}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {['거실', '주방', '전망'].map((th) => (
              <div key={th} style={{ height: 88, borderRadius: 12, background: 'repeating-linear-gradient(135deg,#DCE6F2 0 12px,#E9F0F8 12px 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: '#9FB1C9' }}>{th}</span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', margin: '0 0 14px' }}>상세 정보</h2>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
            {specs.map((sp) => (
              <div key={sp.k} style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ width: 130, fontSize: 14, color: '#8499B3', fontWeight: 600 }}>{sp.k}</span>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{sp.v}</span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', margin: '0 0 14px' }}>투자 포인트</h2>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
            {points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0' }}>
                <span style={{ color: 'var(--up)', fontWeight: 800, fontSize: 15 }}>✓</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{pt}</span>
              </div>
            ))}
          </div>

          <TaxEstimate priceEok={listing.price_num / 10000} area={listing.area} region={listing.region} ownedDefault={ownedCount} />
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div style={{ position: 'sticky', top: 88, background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, boxShadow: '0 12px 32px rgba(12,35,64,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '3px 9px', borderRadius: 6 }}>{listing.type}</span>
              <span style={{ fontSize: 13, color: '#8499B3', fontWeight: 600 }}>{listing.region} {listing.dong}</span>
            </div>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{listing.title}</h1>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{listing.deal}가</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em', marginBottom: 20 }}>{listing.price_text}</div>
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>예상 수익률</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--up)' }}>{listing.roi > 0 ? `연 ${listing.roi.toFixed(1)}%` : '해당 없음'}</div>
              </div>
              <div style={{ width: 1, background: '#E0E7F0' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>전용 면적</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{listing.area}㎡</div>
              </div>
            </div>
            <button disabled aria-label="상담 신청하기 (준비 중)" style={{ width: '100%', background: 'var(--primary)', border: 'none', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'not-allowed', opacity: 0.55, marginBottom: 10, fontFamily: 'inherit' }}>상담 신청하기 (준비 중)</button>
            <HeartButton listingId={listing.id} isSaved={savedSet.has(listing.id)} returnTo={returnTo} variant="detail" />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: '40px 0 18px', letterSpacing: '-0.02em' }}>{listing.region} 비슷한 매물</h2>
          <div style={GRID}>
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} isSaved={savedSet.has(l.id)} returnTo={returnTo} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
