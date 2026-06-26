import type { Deal, PType, QuerySpec, SortKey } from '@/lib/types';

const DEALS: Deal[] = ['매매', '전세', '월세'];
const PTYPES: PType[] = ['아파트', '오피스텔', '주택', '오피스'];
const SORTS: SortKey[] = ['추천순', '가격높은순', '가격낮은순', '수익률순'];

/** URL searchParams → QuerySpec. 미지정/알 수 없는 값은 기본값으로 정규화(throw 없음). */
export function parseListingParams(sp: URLSearchParams): QuerySpec {
  const deal = sp.get('deal');
  const ptype = sp.get('ptype');
  const sort = sp.get('sort');
  return {
    deal: deal && (DEALS as string[]).includes(deal) ? (deal as Deal) : '전체',
    region: sp.get('region') || '전체',
    ptype: ptype && (PTYPES as string[]).includes(ptype) ? (ptype as PType) : '전체',
    q: sp.get('q') ?? '',
    sort: sort && (SORTS as string[]).includes(sort) ? (sort as SortKey) : '추천순',
  };
}

export interface ListingsQuery {
  eq: { deal?: string; region?: string; type?: string };
  /** PostgREST `.or()` 절(필드별 ilike). q 없으면 null. */
  ilikeOr: string[] | null;
  order: { col: 'price_num' | 'roi'; asc: boolean } | null;
}

/** 텍스트 검색 필드(ilike, 부분일치, 대소문자 무시). tags는 배열이라 별도(cs). */
const TEXT_FIELDS = ['title', 'region', 'dong', 'type'] as const;

/** QuerySpec → Supabase 쿼리 스펙(순수). '전체'는 조건 제외. */
export function buildListingsQuery(spec: QuerySpec): ListingsQuery {
  const eq: ListingsQuery['eq'] = {};
  if (spec.deal !== '전체') eq.deal = spec.deal;
  if (spec.region !== '전체') eq.region = spec.region;
  if (spec.ptype !== '전체') eq.type = spec.ptype;

  // PostgREST .or()는 `,`로 절을 나누고 `(){}`로 그룹/배열을 표기 → 사용자 입력에서 제거(주입/오파싱 방지).
  const q = spec.q.trim().toLowerCase().replace(/[,(){}*]/g, ' ').replace(/\s+/g, ' ').trim();
  // 텍스트 필드는 ilike(부분일치, PostgREST or()에선 와일드카드 `*`), tags는 text[]라 contains(cs, 완전 태그 일치)로 검색.
  const ilikeOr = q ? [...TEXT_FIELDS.map((f) => `${f}.ilike.*${q}*`), `tags.cs.{${q}}`] : null;

  let order: ListingsQuery['order'] = null;
  if (spec.sort === '가격높은순') order = { col: 'price_num', asc: false };
  else if (spec.sort === '가격낮은순') order = { col: 'price_num', asc: true };
  else if (spec.sort === '수익률순') order = { col: 'roi', asc: false };

  return { eq, ilikeOr, order };
}
