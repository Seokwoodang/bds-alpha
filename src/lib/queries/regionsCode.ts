import { createClient } from '@/lib/supabase/server';

export interface CodeCoverage { tx_count: number; rent_count: number; max_tx: string | null }
export interface CodeSummary { price: number | null; change: number | null }
export interface CodeGap { sale_eok: number | null; jeonse_eok: number | null; gap_eok: number | null; jeonse_ratio: number | null }
export type SeriesPoint = { label: string; value: number };

export async function getCoverage(code: string): Promise<CodeCoverage> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_coverage', { p_lawd: code });
  const r = (data as CodeCoverage[])?.[0];
  return { tx_count: Number(r?.tx_count ?? 0), rent_count: Number(r?.rent_count ?? 0), max_tx: r?.max_tx ?? null };
}

export async function getSummaryCode(code: string): Promise<CodeSummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_summary_code', { p_lawd: code });
  const r = (data as CodeSummary[])?.[0];
  return { price: r?.price != null ? Number(r.price) : null, change: r?.change != null ? Number(r.change) : null };
}

export async function getGapCode(code: string): Promise<CodeGap | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_gap_code', { p_lawd: code });
  const r = (data as CodeGap[])?.[0];
  if (!r || r.sale_eok == null) return null;
  return { sale_eok: Number(r.sale_eok), jeonse_eok: r.jeonse_eok != null ? Number(r.jeonse_eok) : null, gap_eok: r.gap_eok != null ? Number(r.gap_eok) : null, jeonse_ratio: r.jeonse_ratio != null ? Number(r.jeonse_ratio) : null };
}

export async function getSeriesCode(code: string): Promise<SeriesPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_series_code', { p_lawd: code });
  return ((data as { label: string; price_eok: number }[]) ?? []).map((d) => ({ label: d.label, value: Number(d.price_eok) }));
}

export interface GapAllRow { lawd_cd: string; sale_eok: number; jeonse_eok: number; gap_eok: number; jeonse_ratio: number }
/** 캐시된 전 시군구 갭/전세가율. 홈 "투자 유리 지역" 랭킹용. */
export async function getRegionGapAll(): Promise<GapAllRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_gap_all');
  return ((data as GapAllRow[]) ?? []).map((d) => ({
    lawd_cd: d.lawd_cd, sale_eok: Number(d.sale_eok), jeonse_eok: Number(d.jeonse_eok), gap_eok: Number(d.gap_eok), jeonse_ratio: Number(d.jeonse_ratio),
  }));
}

export interface ScoreRow { lawd_cd: string; sale_eok: number; jeonse_ratio: number | null; chg3: number | null; vol_recent: number; vol_prev: number; tx_count: number; latest: string | null }
/** 지역 투자 스코어 원자료(모멘텀·거래량·전세가율·표본·기준일). */
export async function getRegionScoreAll(): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('region_score_all');
  return ((data as ScoreRow[]) ?? []).map((d) => ({
    lawd_cd: d.lawd_cd, sale_eok: Number(d.sale_eok),
    jeonse_ratio: d.jeonse_ratio != null ? Number(d.jeonse_ratio) : null,
    chg3: d.chg3 != null ? Number(d.chg3) : null,
    vol_recent: Number(d.vol_recent), vol_prev: Number(d.vol_prev), tx_count: Number(d.tx_count), latest: d.latest,
  }));
}

export interface DataMeta { max_tx: string | null; tx_count: number; rent_count: number; region_count: number }
/** 데이터 신선도(기준일·표본) — 공통 배지용. */
export async function getDataMeta(): Promise<DataMeta> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('data_meta');
  const r = (data as DataMeta[])?.[0];
  return { max_tx: r?.max_tx ?? null, tx_count: Number(r?.tx_count ?? 0), rent_count: Number(r?.rent_count ?? 0), region_count: Number(r?.region_count ?? 0) };
}

export interface TxRow { id: number; apt_name: string | null; dong: string | null; area: number; floor: number | null; deal_amount: number; deal_date: string }
/** 지역 최근 개별 실거래(홈 대표 매물용, 상세 링크 위해 id 포함). */
export async function getRegionListings(code: string, limit = 6): Promise<TxRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('transactions')
    .select('id,apt_name,dong,area,floor,deal_amount,deal_date')
    .eq('lawd_cd', code).order('deal_date', { ascending: false }).limit(limit);
  return ((data as TxRow[]) ?? []).map((t) => ({ ...t, area: Number(t.area), deal_amount: Number(t.deal_amount) }));
}
