import { createClient } from '@/lib/supabase/server';
import type { Guide } from '@/lib/types';

export async function getGuides(): Promise<Guide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('guides').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Guide[];
}

export async function getGuide(id: number): Promise<Guide | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('guides').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Guide) ?? null;
}
