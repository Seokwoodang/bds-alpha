import { getRegions } from '@/lib/queries/regions';
import { MapView } from '@/components/MapView';
import { NationwideExplorer } from '@/components/NationwideExplorer';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams;
  const regions = await getRegions();
  const selected = regions.find((r) => r.name === region) ?? regions[0];

  return (
    <div className="bds-fade" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 48px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>지도로 탐색</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 22px' }}>서울 주요 지역은 지도에서, 전국은 아래 탐색기에서 시·도별로 살펴보세요.</p>
      <MapView regions={regions} selected={selected.name} />
      <NationwideExplorer />
    </div>
  );
}
