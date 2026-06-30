import { createClient } from '@/lib/supabase/server';
import type { Region } from '@/lib/types';

/** 지역 시세 목록. 실거래 RPC(중위 시세·전월대비)를 regions 표(이름·순서)에 병합. 데이터 없으면 더미 fallback. */
export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();
  const [{ data: base, error }, { data: summary }] = await Promise.all([
    supabase.from('regions').select('name,price,change,ord').order('ord', { ascending: true }),
    supabase.rpc('region_price_summary'),
  ]);
  if (error) throw error;
  const map = new Map<string, { price: number | null; change: number | null }>(
    ((summary as { region: string; price: number | null; change: number | null }[]) ?? []).map((s) => [s.region, s]),
  );
  return ((base ?? []) as { name: string; price: number; change: number }[]).map((b) => {
    const s = map.get(b.name);
    return {
      name: b.name,
      price: s?.price != null ? Number(s.price) : b.price,
      change: s?.change != null ? Number(s.change) : b.change,
    };
  });
}

/** 지역 최근 13개월 중위 시세 시계열(억). */
export async function getRegionSeries(region: string): Promise<{ label: string; value: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('region_series', { p_region: region });
  if (error) throw error;
  return ((data as { label: string; price_eok: number }[]) ?? []).map((d) => ({ label: d.label, value: Number(d.price_eok) }));
}

export interface RegionGap { region: string; sale_eok: number; jeonse_eok: number; gap_eok: number; jeonse_ratio: number }

/** 지역별 갭(매매-전세)·전세가율(대표평형 60~85㎡, 최근 3개월 중위). */
export async function getRegionGap(): Promise<RegionGap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('region_gap');
  if (error) throw error;
  return ((data as RegionGap[]) ?? []).map((d) => ({
    region: d.region,
    sale_eok: Number(d.sale_eok), jeonse_eok: Number(d.jeonse_eok),
    gap_eok: Number(d.gap_eok), jeonse_ratio: Number(d.jeonse_ratio),
  }));
}

/** 지역+면적대 현재 중위 단가(억). 평가손익 추정용. 데이터 없으면 null. */
export async function getRegionAreaMedian(region: string, area: number): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('region_area_median', { p_region: region, p_area: area });
  if (error) throw error;
  return data != null ? Number(data) : null;
}
