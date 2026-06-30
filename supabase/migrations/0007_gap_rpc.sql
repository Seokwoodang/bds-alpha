-- v3.2: 갭/전세가율 집계 RPC (대표평형 60~85㎡, 최근 3개월 중위)

create or replace function public.region_gap()
returns table(region text, sale_eok numeric, jeonse_eok numeric, gap_eok numeric, jeonse_ratio numeric)
language sql stable security definer set search_path = public as $$
  with s as (
    select region, percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions
    where area between 60 and 85
      and deal_date >= (select max(deal_date) from transactions) - interval '3 months'
    group by region
  ),
  j as (
    select region, percentile_cont(0.5) within group (order by deposit) as med
    from rents
    where monthly_rent = 0 and area between 60 and 85
      and deal_date >= (select max(deal_date) from rents) - interval '3 months'
    group by region
  )
  select s.region,
    round((s.med / 10000)::numeric, 1) as sale_eok,
    round((j.med / 10000)::numeric, 1) as jeonse_eok,
    round(((s.med - j.med) / 10000)::numeric, 1) as gap_eok,
    round((j.med / nullif(s.med, 0) * 100)::numeric, 1) as jeonse_ratio
  from s join j using (region);
$$;

grant execute on function public.region_gap() to anon, authenticated;
