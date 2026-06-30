import { getRegions } from '@/lib/queries/regions';
import { RegionCompare } from '@/components/RegionCompare';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const regions = await getRegions();
  const names = regions.map((r) => r.name);

  return (
    <div className="bds-fade" style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>지역 비교</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>여러 지역의 매매·전세 시세, 상승률, 갭·전세가율을 나란히 비교해 진입할 지역을 고르세요.</p>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24 }}>
        <RegionCompare regions={names} />
      </div>
    </div>
  );
}
