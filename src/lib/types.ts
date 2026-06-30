export type Deal = '매매' | '전세' | '월세';
export type PType = '아파트' | '오피스텔' | '주택' | '오피스';
export type SortKey = '추천순' | '가격높은순' | '가격낮은순' | '수익률순';

export interface Listing {
  id: number;
  title: string;
  type: PType;
  deal: Deal;
  region: string;
  dong: string;
  price_text: string;
  price_num: number;
  area: number;
  floor: string;
  built: number;
  roi: number;
  tags: string[];
  beds: number;
}

export interface Region {
  name: string;
  price: number; // 억
  change: number; // %
  // DB에는 표시 순서용 `ord int` 컬럼이 있으나 select 대상이 아니므로 타입에는 포함하지 않음(정렬 키로만 사용).
}

export interface Guide {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  meta: string;
  hue: number;
  body: string[];
}

export interface SavedRow {
  user_id: string;
  listing_id: number;
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  region: string;
  dong: string | null;
  type: string; // 아파트/오피스텔/주택/오피스/지식산업센터/상가 등(보유자산은 자유)
  area: number;
  purchase_price: number; // 만원
  purchase_date: string; // YYYY-MM-DD
  memo: string | null;
  // 임대 정보(임대 주는 물건)
  is_rental: boolean;
  deposit: number;        // 보증금(만원)
  monthly_rent: number;   // 월세(만원)
  rent_day: number | null;// 월세 수령일(1~31)
  lease_start: string | null;
  lease_end: string | null;
  created_at: string;
}

/** 내 집 등록 폼 입력(검증 대상). */
export interface PropertyInput {
  name: string;
  region: string;
  dong?: string;
  type: string;
  area: number | '';
  purchase_price: number | '';
  purchase_date: string;
  memo?: string;
  // 임대
  is_rental?: boolean;
  deposit?: number | '';
  monthly_rent?: number | '';
  rent_day?: number | '';
  lease_start?: string;
  lease_end?: string;
}

export interface QuerySpec {
  deal: Deal | '전체';
  region: string; // '전체' | 지역명
  ptype: PType | '전체';
  q: string;
  sort: SortKey;
}
