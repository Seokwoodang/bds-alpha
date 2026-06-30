/**
 * v2 — 내 집 등록 순수 로직(property.ts): 가격 포맷·보유기간·검증.
 */
import { describe, it, expect } from 'vitest';
import { formatPriceManwon, holdingMonths, holdingText, validateProperty } from '@/lib/property';
import type { PropertyInput } from '@/lib/types';

describe('formatPriceManwon', () => {
  it('억+만 → "24억 5,000"', () => { expect(formatPriceManwon(245000)).toBe('24억 5,000'); });
  it('억만 떨어지면 → "32억"', () => { expect(formatPriceManwon(320000)).toBe('32억'); });
  it('4억 9,000', () => { expect(formatPriceManwon(49000)).toBe('4억 9,000'); });
  it('억 미만 → "9,000만"', () => { expect(formatPriceManwon(9000)).toBe('9,000만'); });
});

describe('holdingMonths / holdingText', () => {
  const now = new Date('2026-06-25T00:00:00');
  it('정확히 개월 수 계산', () => {
    expect(holdingMonths('2023-04-25', now)).toBe(38); // 3년 2개월
    expect(holdingMonths('2026-01-25', now)).toBe(5);
  });
  it('미래 매입일은 0', () => { expect(holdingMonths('2027-01-01', now)).toBe(0); });
  it('표시 텍스트', () => {
    expect(holdingText('2023-04-25', now)).toBe('3년 2개월');
    expect(holdingText('2026-01-25', now)).toBe('5개월');
    expect(holdingText('2025-06-25', now)).toBe('1년');
  });
});

describe('validateProperty', () => {
  const now = new Date('2026-06-25T00:00:00');
  const valid: PropertyInput = { name: '우리집', region: '강남구', dong: '청담동', type: '아파트', area: 84, purchase_price: 245000, purchase_date: '2023-04-25' };

  it('유효 입력 → 에러 없음', () => {
    expect(validateProperty(valid, now)).toEqual({});
  });
  it('빈 이름', () => { expect(validateProperty({ ...valid, name: '  ' }, now).name).toBeTruthy(); });
  it('목록 외 지역', () => { expect(validateProperty({ ...valid, region: '분당구' }, now).region).toBeTruthy(); });
  it('잘못된 유형', () => { expect(validateProperty({ ...valid, type: '빌라' }, now).type).toBeTruthy(); });
  it('면적 0 이하', () => { expect(validateProperty({ ...valid, area: 0 }, now).area).toBeTruthy(); });
  it('매입가 빈값', () => { expect(validateProperty({ ...valid, purchase_price: '' }, now).purchase_price).toBeTruthy(); });
  it('미래 매입일 거부', () => { expect(validateProperty({ ...valid, purchase_date: '2027-01-01' }, now).purchase_date).toBeTruthy(); });
  it('빈 매입일', () => { expect(validateProperty({ ...valid, purchase_date: '' }, now).purchase_date).toBeTruthy(); });
});
