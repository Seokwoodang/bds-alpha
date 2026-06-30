import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

/** 현재 사용자의 보유 자산 목록(읽기 전용). 비로그인이면 []. */
export async function getProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}
