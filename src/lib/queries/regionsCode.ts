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
