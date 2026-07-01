-- v12: 전국 온디맨드 — lawd_cd(시군구코드) 기반 시세/갭 RPC.
-- 구 이름 중복(중구·남구 등) 회피 위해 코드로 필터. 대표평형 60~85㎡.

-- 수집 여부/신선도 확인용
create or replace function public.region_coverage(p_lawd text)
returns table(tx_count bigint, rent_count bigint, max_tx date)
language sql stable security definer set search_path = public as $$
  select (select count(*) from transactions where lawd_cd = p_lawd),
         (select count(*) from rents where lawd_cd = p_lawd),
         (select max(deal_date) from transactions where lawd_cd = p_lawd);
$$;

-- 최신월 중위가(억) + 전월 대비(%)
create or replace function public.region_summary_code(p_lawd text)
returns table(price numeric, change numeric)
language sql stable security definer set search_path = public as $$
  with m as (
    select date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions where lawd_cd = p_lawd and area between 60 and 85
    group by date_trunc('month', deal_date)
  ),
  ma as (select mon, avg(med) over (order by mon rows between 2 preceding and current row) as sm from m),
  r as (select mon, sm, row_number() over (order by mon desc) as rn from ma)
  select round(((max(sm) filter (where rn = 1)) / 10000)::numeric, 1),
         round((((max(sm) filter (where rn = 1)) - (max(sm) filter (where rn = 2)))
               / nullif(max(sm) filter (where rn = 2), 0) * 100)::numeric, 1)
  from r;
$$;

-- 13개월 시계열(억, 3개월 이동평균)
create or replace function public.region_series_code(p_lawd text)
returns table(label text, price_eok numeric)
language sql stable security definer set search_path = public as $$
  with monthly as (
    select date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions where lawd_cd = p_lawd and area between 60 and 85
    group by date_trunc('month', deal_date)
  ),
  ma as (select mon, avg(med) over (order by mon rows between 2 preceding and current row) as sm from monthly)
  select label, price_eok from (
    select mon, to_char(mon, 'MM') as label, round((sm / 10000)::numeric, 1) as price_eok
    from ma order by mon desc limit 13
  ) t order by mon;
$$;

-- 26주 주간 시계열(억, 4주 이동평균)
create or replace function public.region_series_weekly_code(p_lawd text)
returns table(label text, price_eok numeric)
language sql stable security definer set search_path = public as $$
  with weekly as (
    select date_trunc('week', deal_date) as wk,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions where lawd_cd = p_lawd and area between 60 and 85
    group by date_trunc('week', deal_date)
  ),
  ma as (select wk, avg(med) over (order by wk rows between 3 preceding and current row) as sm from weekly)
  select label, price_eok from (
    select wk, to_char(wk, 'MM/DD') as label, round((sm / 10000)::numeric, 1) as price_eok
    from ma order by wk desc limit 26
  ) t order by wk;
$$;

-- 갭/전세가율(최근 3개월 중위)
create or replace function public.region_gap_code(p_lawd text)
returns table(sale_eok numeric, jeonse_eok numeric, gap_eok numeric, jeonse_ratio numeric)
language sql stable security definer set search_path = public as $$
  with s as (
    select percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions where lawd_cd = p_lawd and area between 60 and 85
      and deal_date >= (select max(deal_date) from transactions where lawd_cd = p_lawd) - interval '3 months'
  ),
  j as (
    select percentile_cont(0.5) within group (order by deposit) as med
    from rents where lawd_cd = p_lawd and monthly_rent = 0 and area between 60 and 85
      and deal_date >= (select max(deal_date) from rents where lawd_cd = p_lawd) - interval '3 months'
  )
  select round((s.med / 10000)::numeric, 1), round((j.med / 10000)::numeric, 1),
         round(((s.med - j.med) / 10000)::numeric, 1),
         round((j.med / nullif(s.med, 0) * 100)::numeric, 1)
  from s, j;
$$;

grant execute on function public.region_coverage(text) to anon, authenticated;
grant execute on function public.region_summary_code(text) to anon, authenticated;
grant execute on function public.region_series_code(text) to anon, authenticated;
grant execute on function public.region_series_weekly_code(text) to anon, authenticated;
grant execute on function public.region_gap_code(text) to anon, authenticated;
