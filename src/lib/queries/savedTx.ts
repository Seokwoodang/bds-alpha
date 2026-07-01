'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** 개별 실거래(전국 매물) 관심 토글. 비로그인이면 /login. */
export async function toggleSaveTx(txId: number, returnTo = '/'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);

  const { data: existing, error: selErr } = await supabase
    .from('saved_transactions').select('tx_id')
    .eq('user_id', user.id).eq('tx_id', txId).maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await supabase.from('saved_transactions').delete().eq('user_id', user.id).eq('tx_id', txId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('saved_transactions').insert({ user_id: user.id, tx_id: txId });
    if (error) throw error;
  }
  revalidatePath('/', 'layout');
}
