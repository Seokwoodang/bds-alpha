import { createClient } from '@/lib/supabase/server';

/** 현재 사용자의 관심 매물 id 목록(읽기 전용 서버 헬퍼 — 서버 액션 아님). 비로그인이면 []. */
export async function getSaved(): Promise<number[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id as number);
}
