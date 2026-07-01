-- v11: 주간 시세 추이 — 대표평형(60~85㎡) 주중위가 + 4주 이동평균(노이즈 완화)
create or replace function public.region_series_weekly(p_region text)
returns table(label text, price_eok numeric)
language sql stable security definer set search_path = public as $$
  with weekly as (
    select date_trunc('week', deal_date) as wk,
      percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions
    where region = p_region and area between 60 and 85
    group by date_trunc('week', deal_date)
  ),
  ma as (
    select wk, avg(med) over (order by wk rows between 3 preceding and current row) as sm
    from weekly
  )
  select label, price_eok from (
    select wk, to_char(wk, 'MM/DD') as label, round((sm / 10000)::numeric, 1) as price_eok
    from ma order by wk desc limit 26
  ) t order by wk;
$$;

grant execute on function public.region_series_weekly(text) to anon, authenticated;
