import type { Listing, Region } from '@/lib/types';

export interface HeroStats {
  topRegion: string;
  topRegionPrice: string; // "24.0억"
  topRegionChange: number;
  avgRoi: string; // "3.8"
  regionCount: number;
  listingCount: number;
}

/** hero/플로팅 카드 통계를 데이터에서 파생(AD3). */
export function aggregateStats(listings: Listing[], regions: Region[]): HeroStats {
  const top = [...regions].sort((a, b) => b.price - a.price)[0];
  const roiVals = listings.filter((l) => l.roi > 0).map((l) => l.roi);
  const avgRoi = roiVals.length ? roiVals.reduce((s, v) => s + v, 0) / roiVals.length : 0;
  return {
    topRegion: top?.name ?? '—',
    topRegionPrice: top ? `${top.price.toFixed(1)}억` : '—',
    topRegionChange: top?.change ?? 0,
    avgRoi: avgRoi.toFixed(1),
    regionCount: regions.length,
    listingCount: listings.length,
  };
}
