import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { roiText, dealBadge, areaText } from '@/lib/format';
import { LISTING_COVER } from '@/lib/cover';
import { HeartButton } from '@/components/HeartButton';

export function ListingCard({ listing, isSaved, returnTo }: { listing: Listing; isSaved: boolean; returnTo: string }) {
  const badge = dealBadge(listing.deal);
  return (
    <article style={{ position: 'relative' }}>
      <Link
        href={`/listings/${listing.id}`}
        className="bds-card"
        style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', width: '100%' }}
      >
        <div style={{ position: 'relative', height: 168, background: LISTING_COVER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12, color: '#9FB1C9' }}>[ 매물 사진 ]</span>
          <span style={{ position: 'absolute', top: 12, left: 12, background: badge.bg, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{listing.deal}</span>
        </div>
        <div style={{ padding: '16px 17px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 5 }}>{listing.type}</span>
            <span style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>{listing.region} {listing.dong}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3, marginBottom: 8 }}>{listing.title}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 4 }}>{listing.price_text}</div>
          <div style={{ fontSize: 13, color: '#7286A0', marginBottom: 14 }}>{areaText(listing.area, listing.floor)}</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, borderTop: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {listing.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, color: '#7286A0', background: '#F2F5FA', padding: '3px 9px', borderRadius: 30 }}>{t}</span>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--up)', whiteSpace: 'nowrap' }}>{roiText(listing.roi)}</span>
          </div>
        </div>
      </Link>
      <HeartButton listingId={listing.id} isSaved={isSaved} returnTo={returnTo} />
    </article>
  );
}
