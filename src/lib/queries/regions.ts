import { createClient } from '@/lib/supabase/server';
import type { Region } from '@/lib/types';

/** 지역 시세 목록(시드 순서 보존을 위해 정렬 없이 입력 순). */
export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('regions').select('name,price,change').order('ord', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Region[];
}
