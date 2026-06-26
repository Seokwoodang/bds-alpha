import { createClient } from '@/lib/supabase/server';
import { buildListingsQuery } from '@/lib/listingsQuery';
import type { Listing, QuerySpec } from '@/lib/types';

/** 목록 조회: QuerySpec → eq/ilike-or/order 적용. {rows, count} 반환. */
export async function getListings(spec: QuerySpec): Promise<{ rows: Listing[]; count: number }> {
  const supabase = await createClient();
  const { eq, ilikeOr, order } = buildListingsQuery(spec);

  let query = supabase.from('listings').select('*', { count: 'exact' });
  if (eq.deal) query = query.eq('deal', eq.deal);
  if (eq.region) query = query.eq('region', eq.region);
  if (eq.type) query = query.eq('type', eq.type);
  if (ilikeOr) query = query.or(ilikeOr.join(','));
  if (order) query = query.order(order.col, { ascending: order.asc });
  // 안정 정렬(동률 → id 오름차순). 추천순일 때도 id 순서.
  query = query.order('id', { ascending: true });

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Listing[], count: count ?? 0 };
}

/** 단일 매물. 없으면 null(호출부에서 notFound). */
export async function getListingById(id: number): Promise<Listing | null> {
  if (!Number.isInteger(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Listing) ?? null;
}

/** id 목록으로 매물 조회(마이페이지 관심목록 등). */
export async function getListingsByIds(ids: number[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*').in('id', ids).order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

/** 전체 매물 수(홈 통계용). */
export async function countListings(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from('listings').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

/** 유사 매물: 같은 지역, 현재 제외, 최대 3개. */
export async function getSimilar(region: string, excludeId: number): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('region', region)
    .neq('id', excludeId)
    .order('id', { ascending: true })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as Listing[];
}
