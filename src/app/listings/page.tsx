import { parseListingParams } from '@/lib/listingsQuery';
import { getListings } from '@/lib/queries/listings';
import { getSaved } from '@/lib/queries/savedRead';
import { ListingCard } from '@/components/ListingCard';
import { FilterPanel } from '@/components/FilterPanel';
import { SortSelect } from '@/components/SortSelect';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

const GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 };

export default async function ListingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const usp = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (v == null ? [] : [[k, Array.isArray(v) ? v[0] : v]] as [string, string][])),
  );
  const spec = parseListingParams(usp);
  const returnTo = `/listings?${usp.toString()}`;

  const [{ rows, count }, saved] = await Promise.all([getListings(spec), getSaved()]);
  const savedSet = new Set(saved);

  return (
    <div className="bds-fade" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>매물 찾기</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>조건에 맞는 투자 매물을 검색하고 비교하세요.</p>

      <FilterPanel spec={spec} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 15, color: 'var(--muted)' }}>총 <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>{count}</strong>개 매물</div>
        <SortSelect value={spec.sort} />
      </div>

      {count > 0 ? (
        <div style={GRID}>
          {rows.map((l) => (
            <ListingCard key={l.id} listing={l} isSaved={savedSet.has(l.id)} returnTo={returnTo} />
          ))}
        </div>
      ) : (
        <EmptyState icon="🔍" title="조건에 맞는 매물이 없어요" desc="필터를 변경해 다시 검색해 보세요." />
      )}
    </div>
  );
}
