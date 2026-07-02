-- v16: 지역 투자 스코어 원자료 — 모멘텀(최근3개월 vs 이전3개월 중위가)·거래량 추이·전세가율·표본·기준일.
-- 대표평형 60~85㎡ 기준(가격), 거래량은 전체 평형.
create or replace function public.region_score_all()
returns table(
  lawd_cd text, sale_eok numeric, jeonse_ratio numeric, chg3 numeric,
  vol_recent bigint, vol_prev bigint, tx_count bigint, latest date
)
language sql stable security definer set search_path = public as $$
  with base as (
    select lawd_cd, max(deal_date) as mx from transactions group by lawd_cd
  ),
  s as (
    select t.lawd_cd,
      percentile_cont(0.5) within group (order by t.deal_amount)
        filter (where t.deal_date > b.mx - interval '3 months' and t.area between 60 and 85) as med_recent,
      percentile_cont(0.5) within group (order by t.deal_amount)
        filter (where t.deal_date <= b.mx - interval '3 months' and t.deal_date > b.mx - interval '6 months' and t.area between 60 and 85) as med_prev,
      count(*) filter (where t.deal_date > b.mx - interval '3 months') as vol_recent,
      count(*) filter (where t.deal_date <= b.mx - interval '3 months' and t.deal_date > b.mx - interval '6 months') as vol_prev,
      count(*) as tx_count,
      max(b.mx) as latest
    from transactions t join base b using (lawd_cd)
    group by t.lawd_cd
  ),
  j as (
    select r.lawd_cd, percentile_cont(0.5) within group (order by r.deposit) as jm
    from rents r join base b using (lawd_cd)
    where r.monthly_rent = 0 and r.area between 60 and 85 and r.deal_date > b.mx - interval '3 months'
    group by r.lawd_cd
  )
  select s.lawd_cd,
    round((s.med_recent / 10000)::numeric, 1),
    round((j.jm / nullif(s.med_recent, 0) * 100)::numeric, 1),
    round(((s.med_recent - s.med_prev) / nullif(s.med_prev, 0) * 100)::numeric, 1),
    s.vol_recent, s.vol_prev, s.tx_count, s.latest
  from s left join j using (lawd_cd)
  where s.med_recent is not null;
$$;

grant execute on function public.region_score_all() to anon, authenticated;

-- 데이터 신선도(기준일·표본) — 전 화면 공통 배지용
create or replace function public.data_meta()
returns table(max_tx date, tx_count bigint, rent_count bigint, region_count bigint)
language sql stable security definer set search_path = public as $$
  select (select max(deal_date) from transactions),
         (select count(*) from transactions),
         (select count(*) from rents),
         (select count(distinct lawd_cd) from transactions);
$$;

grant execute on function public.data_meta() to anon, authenticated;
