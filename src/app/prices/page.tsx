import { getRegions } from '@/lib/queries/regions';
import { buildChart, kpiRules } from '@/lib/chart';
import { PriceChart } from '@/components/PriceChart';
import { RegionTabs, RegionBars } from '@/components/RegionSelector';

export const dynamic = 'force-dynamic';

export default async function PricesPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams;
  const regions = await getRegions();
  const selected = regions.find((r) => r.name === region) ?? regions[0];
  const chart = buildChart(selected.price);
  const kpis = kpiRules(selected);

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>시세 분석</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>지역별 실거래 시세 흐름과 변동률을 확인하세요. (84㎡ 아파트 평균 매매가 기준)</p>

      <RegionTabs regions={regions} selected={selected.name} />

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: '1 1 200px', background: 'var(--navy)', borderRadius: 16, padding: 22, color: '#fff' }}>
          <div style={{ fontSize: 13, color: '#9FB6D6', fontWeight: 600, marginBottom: 8 }}>{`${selected.name} 평균 매매가`}</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>{selected.price.toFixed(1)}억</div>
        </div>
        {kpis.map((k) => (
          <div key={k.label} style={{ flex: '1 1 160px', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{`${selected.name} 시세 추이`}</div>
        <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 16 }}>최근 12개월 · 단위 억원</div>
        <PriceChart data={chart} />
      </div>

      <RegionBars regions={regions} selected={selected.name} />
    </div>
  );
}
