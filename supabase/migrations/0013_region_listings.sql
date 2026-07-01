-- v14: 지역별 개별 실거래 목록(코드 단위) — 전국 개별 매물 보기.
create or replace function public.region_listings_code(p_lawd text, p_limit int default 30)
returns table(apt_name text, dong text, area numeric, floor int, deal_amount int, deal_date date)
language sql stable security definer set search_path = public as $$
  select apt_name, dong, area, floor, deal_amount, deal_date
  from transactions
  where lawd_cd = p_lawd
  order by deal_date desc, deal_amount desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.region_listings_code(text, int) to anon, authenticated;
