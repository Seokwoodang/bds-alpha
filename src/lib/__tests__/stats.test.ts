/**
 * T44 — aggregateStats: hero/플로팅 통계가 데이터에서 파생됨(AD3). logic, 순수.
 */
import { describe, it, expect } from 'vitest';
import { aggregateStats } from '@/lib/stats';
import type { Listing, Region } from '@/lib/types';

const regions: Region[] = [
  { name: '강남구', price: 24.0, change: 2.3 },
  { name: '성동구', price: 14.0, change: 3.2 },
];
const listings = [
  { roi: 3.0 }, { roi: 0 }, { roi: 5.0 },
] as Listing[];

describe('aggregateStats', () => {
  it('최고가 지역을 topRegion으로 잡는다', () => {
    const s = aggregateStats(listings, regions);
    expect(s.topRegion).toBe('강남구');
    expect(s.topRegionPrice).toBe('24.0억');
    expect(s.topRegionChange).toBe(2.3);
  });
  it('avgRoi는 roi>0만 평균(소수1자리)', () => {
    // (3.0 + 5.0)/2 = 4.0
    expect(aggregateStats(listings, regions).avgRoi).toBe('4.0');
  });
  it('regionCount/listingCount를 센다', () => {
    const s = aggregateStats(listings, regions);
    expect(s.regionCount).toBe(2);
    expect(s.listingCount).toBe(3);
  });
});
