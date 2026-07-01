import { getRegions } from '@/lib/queries/regions';
import { getCoverage, getSummaryCode, getGapCode, getSeriesCode } from '@/lib/queries/regionsCode';
import { PriceTrend } from '@/components/PriceTrend';
import { RegionPicker } from '@/components/RegionPicker';
import { RegionIngestGate } from '@/components/RegionIngestGate';
import { RegionBars } from '@/components/RegionSelector';
import { RegionListings } from '@/components/RegionListings';
import { GapAnalysis } from '@/components/GapAnalysis';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';

export const dynamic = 'force-dynamic';

const DEFAULT_CODE = '11680'; // 강남구

export default async function PricesPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: codeParam } = await searchParams;
  const code = CODE_TO_SIGUNGU[codeParam ?? ''] ? codeParam! : DEFAULT_CODE;
  const sgg = CODE_TO_SIGUNGU[code];

  const coverage = await getCoverage(code);
  const needsIngest = coverage.tx_count === 0;

  const [summary, gap, series, regions] = needsIngest
    ? [null, null, [], await getRegions()]
    : await Promise.all([getSummaryCode(code), getGapCode(code), getSeriesCode(code), getRegions()]);

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>시세 분석</h1>
      <p style={{ fontSize: 15, color: '#7286A0', margin: '0 0 24px' }}>전국 시군구 실거래 시세 흐름과 변동률을 확인하세요. (국토교통부 아파트 실거래가 · 대표평형 60~85㎡ 중위)</p>

      <RegionPicker code={code} />

      {needsIngest ? (
        <RegionIngestGate code={code} region={`${sgg.sido} ${sgg.name}`} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: '1 1 200px', background: 'var(--navy)', borderRadius: 16, padding: 22, color: '#fff' }}>
              <div style={{ fontSize: 13, color: '#9FB6D6', fontWeight: 600, marginBottom: 8 }}>{`${sgg.name} 중위 매매가`}</div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>{summary?.price != null ? `${summary.price.toFixed(1)}억` : '—'}</div>
              {summary?.change != null && (
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, color: summary.change >= 0 ? '#86EFAC' : '#FCA5A5' }}>전월 대비 {summary.change >= 0 ? '+' : ''}{summary.change}%</div>
              )}
            </div>
            <div style={{ flex: '1 1 160px', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 8 }}>전세가율</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: gap?.jeonse_ratio != null && gap.jeonse_ratio >= 45 ? 'var(--up)' : 'var(--navy)' }}>{gap?.jeonse_ratio != null ? `${gap.jeonse_ratio}%` : '—'}</div>
            </div>
            <div style={{ flex: '1 1 160px', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 8 }}>갭(매매−전세)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>{gap?.gap_eok != null ? `${gap.gap_eok}억` : '—'}</div>
            </div>
          </div>

          <PriceTrend region={sgg.name} initialMonthly={series} code={code} />

          <div style={{ marginBottom: 28 }}><RegionListings code={code} region={sgg.name} /></div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 14px', letterSpacing: '-0.02em' }}>주요 지역 비교</h2>
          <RegionBars regions={regions} selected={sgg.name} />
          <GapAnalysis selected={sgg.name} />
        </>
      )}
    </div>
  );
}
