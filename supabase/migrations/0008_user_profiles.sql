-- v7: 사용자 투자 조건 저장(프로필)

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  capital_eok numeric(8,1) not null default 5,
  loan_eok numeric(8,1) not null default 3,
  owned_houses int not null default 0,
  first_time boolean not null default false,
  mode text not null default 'gap',
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
drop policy if exists "own profile select" on public.user_profiles;
drop policy if exists "own profile upsert" on public.user_profiles;
drop policy if exists "own profile update" on public.user_profiles;
create policy "own profile select" on public.user_profiles for select using (auth.uid() = user_id);
create policy "own profile upsert" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
