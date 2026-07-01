import { createClient } from '@/lib/supabase/server';

export interface SavedTxRow {
  id: number; region: string; lawd_cd: string; apt_name: string | null; dong: string | null;
  deal_amount: number; area: number; floor: number | null; build_year: number | null; deal_date: string;
}

/** 현재 사용자가 저장한 개별 실거래 id 목록. 비로그인이면 []. */
export async function getSavedTxIds(): Promise<number[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('saved_transactions').select('tx_id').eq('user_id', user.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.tx_id as number);
}

/** 저장한 개별 실거래 상세(마이페이지용). */
export async function getSavedTx(): Promise<SavedTxRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('saved_transactions')
    .select('tx_id, transactions(id,region,lawd_cd,apt_name,dong,deal_amount,area,floor,build_year,deal_date)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as { transactions: SavedTxRow }[])
    .map((r) => r.transactions)
    .filter(Boolean)
    .map((t) => ({ ...t, deal_amount: Number(t.deal_amount), area: Number(t.area) }));
}
