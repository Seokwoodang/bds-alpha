import { createClient } from '@/lib/supabase/server';
import type { InvestMode } from '@/lib/invest';

export interface InvestProfile {
  capital: number;
  loan: number;
  owned: number;
  firstTime: boolean;
  mode: InvestMode;
}

/** 현재 사용자의 저장된 투자 조건. 없으면 null. */
export async function getProfile(): Promise<InvestProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('capital_eok,loan_eok,owned_houses,first_time,mode')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    capital: Number(data.capital_eok),
    loan: Number(data.loan_eok),
    owned: data.owned_houses,
    firstTime: data.first_time,
    mode: (data.mode === 'live' ? 'live' : 'gap'),
  };
}
