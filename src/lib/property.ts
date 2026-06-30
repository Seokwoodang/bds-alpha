import type { PropertyInput } from '@/lib/types';

export const PROPERTY_REGIONS = ['강남구', '서초구', '송파구', '용산구', '성동구', '마포구', '광진구', '영등포구'] as const;
export const PROPERTY_TYPES = ['아파트', '오피스텔', '주택', '오피스'] as const;

/** 매입가(만원) → "24억 5,000" / "32억" / "9,000만" 형식. */
export function formatPriceManwon(manwon: number): string {
  const eok = Math.floor(manwon / 10000);
  const man = manwon % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString('ko-KR')}`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString('ko-KR')}만`;
}

/** 보유 기간(개월). purchase_date ~ now. */
export function holdingMonths(purchaseDate: string, now: Date): number {
  const p = new Date(purchaseDate + 'T00:00:00');
  if (Number.isNaN(p.getTime())) return 0;
  const months = (now.getFullYear() - p.getFullYear()) * 12 + (now.getMonth() - p.getMonth());
  return Math.max(0, months);
}

/** 보유 기간 표시 ("3년 2개월" / "5개월"). */
export function holdingText(purchaseDate: string, now: Date): string {
  const m = holdingMonths(purchaseDate, now);
  const y = Math.floor(m / 12);
  const mm = m % 12;
  if (y > 0 && mm > 0) return `${y}년 ${mm}개월`;
  if (y > 0) return `${y}년`;
  return `${mm}개월`;
}

export type PropertyErrors = Partial<Record<keyof PropertyInput, string>>;

/** 폼 입력 검증(순수). 에러 없으면 {} 반환. now는 미래일자 검증용. */
export function validateProperty(input: PropertyInput, now: Date): PropertyErrors {
  const e: PropertyErrors = {};
  if (!input.name || !input.name.trim()) e.name = '단지명/별칭을 입력하세요.';
  if (!(PROPERTY_REGIONS as readonly string[]).includes(input.region)) e.region = '지역을 선택하세요.';
  if (!(PROPERTY_TYPES as readonly string[]).includes(input.type)) e.type = '매물 유형을 선택하세요.';
  if (input.area === '' || !(Number(input.area) > 0)) e.area = '전용면적은 0보다 커야 합니다.';
  if (input.purchase_price === '' || !(Number(input.purchase_price) > 0)) e.purchase_price = '매입가는 0보다 커야 합니다.';
  if (!input.purchase_date) {
    e.purchase_date = '매입일을 입력하세요.';
  } else {
    const d = new Date(input.purchase_date + 'T00:00:00');
    if (Number.isNaN(d.getTime())) e.purchase_date = '올바른 날짜가 아닙니다.';
    else if (d.getTime() > now.getTime()) e.purchase_date = '매입일은 미래일 수 없습니다.';
  }
  return e;
}

export function hasErrors(e: PropertyErrors): boolean {
  return Object.keys(e).length > 0;
}

export interface Valuation { currentEok: number; purchaseEok: number; diffEok: number; pct: number }

/** 평가손익 추정: 매입가(만원) vs 현재 지역+면적대 중위가(억). 비교가 없으면 null. */
export function estimatePL(purchaseManwon: number, currentEok: number | null): Valuation | null {
  if (currentEok == null || !(purchaseManwon > 0)) return null;
  const purchaseEok = purchaseManwon / 10000;
  const diffEok = Math.round((currentEok - purchaseEok) * 10) / 10;
  const pct = Math.round((diffEok / purchaseEok) * 1000) / 10;
  return { currentEok, purchaseEok: Math.round(purchaseEok * 10) / 10, diffEok, pct };
}
