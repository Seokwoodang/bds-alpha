-- v15: 개별 실거래(전국 매물) 관심 저장.
create table if not exists public.saved_transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  tx_id bigint not null references public.transactions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tx_id)
);

alter table public.saved_transactions enable row level security;
drop policy if exists "own saved_tx select" on public.saved_transactions;
drop policy if exists "own saved_tx insert" on public.saved_transactions;
drop policy if exists "own saved_tx delete" on public.saved_transactions;
create policy "own saved_tx select" on public.saved_transactions for select using (auth.uid() = user_id);
create policy "own saved_tx insert" on public.saved_transactions for insert with check (auth.uid() = user_id);
create policy "own saved_tx delete" on public.saved_transactions for delete using (auth.uid() = user_id);
