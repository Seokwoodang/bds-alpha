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

export interface QuerySpec {
  deal: Deal | '전체';
  region: string; // '전체' | 지역명
  ptype: PType | '전체';
  q: string;
  sort: SortKey;
}
