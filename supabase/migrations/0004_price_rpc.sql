-- v3: 실거래 기반 시세 집계 RPC (중위값/median 기준, 억 단위)

-- 지역별 최신월 중위 시세(억) + 전월 대비 변동률(%)
create or replace function public.region_price_summary()
returns table(region text, price numeric, change numeric)
language sql stable security definer set search_path = public as $$
  with m as (
    select region, date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions group by region, date_trunc('month', deal_date)
  ),
  r as (select region, mon, med, row_number() over (partition by region order by mon desc) as rn from m)
  select region,
    round(((max(med) filter (where rn = 1)) / 10000)::numeric, 1) as price,
    round((((max(med) filter (where rn = 1)) - (max(med) filter (where rn = 2)))
          / nullif(max(med) filter (where rn = 2), 0) * 100)::numeric, 1) as change
  from r group by region;
$$;

-- 지역 최근 13개월 중위 시세 시계열(억)
create or replace function public.region_series(p_region text)
returns table(label text, price_eok numeric)
language sql stable security definer set search_path = public as $$
  select to_char(mon, 'MM'), round((med / 10000)::numeric, 1)
  from (
    select date_trunc('month', deal_date) as mon,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions where region = p_region
    group by date_trunc('month', deal_date)
    order by date_trunc('month', deal_date) desc
    limit 13
  ) t order by mon;
$$;

-- 지역+면적대 현재 중위 단가(평가손익용): area ±15% 범위 최신 3개월 중위가(억)
create or replace function public.region_area_median(p_region text, p_area numeric)
returns numeric
language sql stable security definer set search_path = public as $$
  select round((percentile_cont(0.5) within group (order by deal_amount) / 10000)::numeric, 1)
  from transactions
  where region = p_region
    and area between p_area * 0.85 and p_area * 1.15
    and deal_date >= (current_date - interval '3 months');
$$;

grant execute on function public.region_price_summary() to anon, authenticated;
grant execute on function public.region_series(text) to anon, authenticated;
grant execute on function public.region_area_median(text, numeric) to anon, authenticated;
