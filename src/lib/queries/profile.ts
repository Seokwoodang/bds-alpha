'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { InvestProfile } from '@/lib/queries/profileRead';

/** 투자 조건 저장(upsert, 사용자별). 비로그인이면 /login. */
export async function saveProfile(p: InvestProfile): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnTo=%2Finvest');
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: user.id,
    capital_eok: p.capital,
    loan_eok: p.loan,
    owned_houses: p.owned,
    first_time: p.firstTime,
    mode: p.mode,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath('/invest');
}
