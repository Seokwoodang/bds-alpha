'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateProperty, hasErrors } from '@/lib/property';
import type { PropertyInput } from '@/lib/types';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnTo=%2Fmypage');
  return { supabase, user };
}

function numOr(v: number | '' | undefined, fallback: number): number {
  return v === '' || v == null ? fallback : Number(v);
}

function toRow(input: PropertyInput) {
  const isRental = !!input.is_rental;
  return {
    name: input.name.trim(),
    region: input.region,
    dong: input.dong?.trim() || null,
    type: input.type,
    area: Number(input.area),
    purchase_price: Number(input.purchase_price),
    purchase_date: input.purchase_date,
    memo: input.memo?.trim() || null,
    is_rental: isRental,
    deposit: isRental ? numOr(input.deposit, 0) : 0,
    monthly_rent: isRental ? numOr(input.monthly_rent, 0) : 0,
    rent_day: isRental && input.rent_day !== '' && input.rent_day != null ? Number(input.rent_day) : null,
    lease_start: isRental && input.lease_start ? input.lease_start : null,
    lease_end: isRental && input.lease_end ? input.lease_end : null,
  };
}

/** 보유 자산 등록. 비로그인 → /login. 검증 실패 → throw(클라가 선검증). */
export async function addProperty(input: PropertyInput): Promise<void> {
  const { supabase, user } = await requireUser();
  if (hasErrors(validateProperty(input, new Date()))) throw new Error('invalid property input');
  const { error } = await supabase.from('properties').insert({ user_id: user.id, ...toRow(input) });
  if (error) throw error;
  revalidatePath('/mypage');
}

/** 보유 자산 수정(본인 행만 — RLS + user_id 필터). */
export async function updateProperty(id: string, input: PropertyInput): Promise<void> {
  const { supabase, user } = await requireUser();
  if (hasErrors(validateProperty(input, new Date()))) throw new Error('invalid property input');
  const { error } = await supabase.from('properties').update(toRow(input)).eq('id', id).eq('user_id', user.id);
  if (error) throw error;
  revalidatePath('/mypage');
}

/** 보유 자산 삭제(본인 행만). */
export async function deleteProperty(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('properties').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
  revalidatePath('/mypage');
}
