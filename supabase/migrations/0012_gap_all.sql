-- v13: 캐시된 전 지역 갭/전세가율(코드 단위) — 투자추천 전국화.
-- 온디맨드로 수집된 모든 시군구(lawd_cd)에 대해 최근 3개월 대표평형 중위 기준.
create or replace function public.region_gap_all()
returns table(lawd_cd text, sale_eok numeric, jeonse_eok numeric, gap_eok numeric, jeonse_ratio numeric)
language sql stable security definer set search_path = public as $$
  with s as (
    select lawd_cd, percentile_cont(0.5) within group (order by deal_amount) as med
    from transactions
    where area between 60 and 85
      and deal_date >= (select max(deal_date) from transactions) - interval '3 months'
    group by lawd_cd
  ),
  j as (
    select lawd_cd, percentile_cont(0.5) within group (order by deposit) as med
    from rents
    where monthly_rent = 0 and area between 60 and 85
      and deal_date >= (select max(deal_date) from rents) - interval '3 months'
    group by lawd_cd
  )
  select s.lawd_cd,
    round((s.med / 10000)::numeric, 1),
    round((j.med / 10000)::numeric, 1),
    round(((s.med - j.med) / 10000)::numeric, 1),
    round((j.med / nullif(s.med, 0) * 100)::numeric, 1)
  from s join j using (lawd_cd)
  where s.med is not null and j.med is not null;
$$;

grant execute on function public.region_gap_all() to anon, authenticated;
