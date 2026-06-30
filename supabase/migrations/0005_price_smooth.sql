-- v3.1: 시세 평활 — 대표 평형(전용 60~85㎡) 필터 + 3개월 이동평균

-- 지역 최신월 중위 시세(억, 대표평형) + 전월 대비(%)
create or replace function public.region_price_summary()
returns table(region text, price numeric, change numeric)
language sql stable security definer set search_path = public as $$
  with m as (
    select region, date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions
    where area between 60 and 85
    group by region, date_trunc('month', deal_date)
  ),
  ma as (
    select region, mon, avg(med) over (partition by region order by mon rows between 2 preceding and current row) as sm
    from m
  ),
  r as (select region, mon, sm, row_number() over (partition by region order by mon desc) as rn from ma)
  select region,
    round(((max(sm) filter (where rn = 1)) / 10000)::numeric, 1) as price,
    round((((max(sm) filter (where rn = 1)) - (max(sm) filter (where rn = 2)))
          / nullif(max(sm) filter (where rn = 2), 0) * 100)::numeric, 1) as change
  from r group by region;
$$;

-- 지역 최근 13개월 시계열(억) — 대표평형 월중위가의 3개월 이동평균
create or replace function public.region_series(p_region text)
returns table(label text, price_eok numeric)
language sql stable security definer set search_path = public as $$
  with monthly as (
    select date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions
    where region = p_region and area between 60 and 85
    group by date_trunc('month', deal_date)
  ),
  ma as (
    select mon, avg(med) over (order by mon rows between 2 preceding and current row) as sm
    from monthly
  )
  select label, price_eok from (
    select mon, to_char(mon, 'MM') as label, round((sm / 10000)::numeric, 1) as price_eok
    from ma order by mon desc limit 13
  ) t order by mon;
$$;

grant execute on function public.region_price_summary() to anon, authenticated;
grant execute on function public.region_series(text) to anon, authenticated;
