import { getRegions } from '@/lib/queries/regions';
import { MapView } from '@/components/MapView';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams;
  const regions = await getRegions();
  const selected = regions.find((r) => r.name === region) ?? regions[0];

  return (
    <div className="bds-fade" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 48px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>지도로 탐색</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 22px' }}>지역별 평균 시세를 지도 위에서 비교하고, 관심 지역의 매물을 살펴보세요.</p>
      <MapView regions={regions} selected={selected.name} />
    </div>
  );
}
