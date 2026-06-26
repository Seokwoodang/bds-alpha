'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** 관심 매물 토글(서버 액션). 비로그인이면 /login으로 리다이렉트. */
export async function toggleSave(listingId: number, returnTo = '/'): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const { data: existing, error: selErr } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id: listingId });
    if (error) throw error;
  }

  revalidatePath('/', 'layout');
}
