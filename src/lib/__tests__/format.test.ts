/**
 * RED tests — 표시 포맷터 (src/lib/format.ts) · logic 레이어 (순수, DOM/네트워크 無)
 * docs scope: src/lib/format.ts 미구현 → import 미해결로 RED. GREEN 단계에서 구현.
 *
 * 커버 셀: card·roi>0/=0, card·dealStyle(3), card·areaText,
 *          detail·beds(0/>0), detail·roi(0/>0), detail·points(roi0/fallback/tags)
 */
import { describe, it, expect } from 'vitest';
import {
  roiText,
  dealBadge,
  areaText,
  detailSpecs,
  detailPoints,
} from '@/lib/format';
import type { Listing } from '@/lib/types';

// 픽스처 ----------------------------------------------------------------
const apt: Listing = {
  id: 1, title: '라이프 청담 102동', type: '아파트', deal: '매매',
  region: '강남구', dong: '청담동', price_text: '24억 5,000', price_num: 245000,
  area: 84, floor: '24/30층', built: 2019, roi: 3.1, tags: ['한강뷰', '역세권'], beds: 3,
};
const jeonse: Listing = { // roi=0 (전세)
  id: 3, title: '잠실 레이크포레', type: '아파트', deal: '전세',
  region: '송파구', dong: '잠실동', price_text: '전세 11억', price_num: 110000,
  area: 84, floor: '9/24층', built: 2017, roi: 0, tags: ['호수뷰', '대단지'], beds: 3,
};
const office: Listing = { // beds=0 (오피스)
  id: 7, title: '여의도 파이낸스타워 #1204', type: '오피스', deal: '월세',
  region: '영등포구', dong: '여의도동', price_text: '2,000 / 350', price_num: 35000,
  area: 56, floor: '24/40층', built: 2020, roi: 5.6, tags: ['오피스', '금융가'], beds: 0,
};

describe('roiText', () => {
  it('T1 · roi>0이면 "연 N.N%"(소수1자리)', () => {
    expect(roiText(3.1)).toBe('연 3.1%');
    expect(roiText(5)).toBe('연 5.0%');
  });
  it('T2 · roi=0이면 "—"', () => {
    expect(roiText(0)).toBe('—');
  });
});

describe('dealBadge', () => {
  it('T3 · 매매 → #0C2340', () => { expect(dealBadge('매매').bg).toBe('#0C2340'); });
  it('T4 · 전세 → #1C5DDA', () => { expect(dealBadge('전세').bg).toBe('#1C5DDA'); });
  it('T5 · 월세 → #0E9F6E', () => { expect(dealBadge('월세').bg).toBe('#0E9F6E'); });
});

describe('areaText', () => {
  it('T6 · "{area}㎡ · {floor}"', () => {
    expect(areaText(84, '24/30층')).toBe('84㎡ · 24/30층');
  });
});

describe('detailSpecs', () => {
  it('T7 · beds=0이면 방개수 "오피스/원룸"', () => {
    const specs = detailSpecs(office);
    const beds = specs.find((s) => s.k === '방 개수');
    expect(beds?.v).toBe('오피스/원룸');
  });
  it('T8 · beds>0이면 "{beds}개"', () => {
    const specs = detailSpecs(apt);
    expect(specs.find((s) => s.k === '방 개수')?.v).toBe('3개');
  });
  it('T9 · roi=0이면 예상수익률 "해당 없음"', () => {
    const specs = detailSpecs(jeonse);
    expect(specs.find((s) => s.k === '예상 수익률')?.v).toBe('해당 없음');
  });
  it('T10 · roi>0이면 예상수익률 "연 N.N%"', () => {
    const specs = detailSpecs(apt);
    expect(specs.find((s) => s.k === '예상 수익률')?.v).toBe('연 3.1%');
  });
  it('· 8개 행을 반환한다', () => {
    expect(detailSpecs(apt)).toHaveLength(8);
  });
});

describe('detailPoints', () => {
  it('T11 · roi=0이면 3번째 포인트가 실거주 문구(수익률 문구 아님)', () => {
    const pts = detailPoints(jeonse);
    expect(pts[2]).toContain('실거주');
    expect(pts[2]).not.toContain('수익률');
  });
  it('T12 · tags[1] 부재 시 "우수한 생활 인프라" fallback', () => {
    const oneTag: Listing = { ...apt, tags: ['한강뷰'] };
    expect(detailPoints(oneTag)[1]).toContain('우수한 생활 인프라');
  });
  it('T13 · tags[1] 존재 시 그 태그 사용', () => {
    expect(detailPoints(apt)[1]).toContain('역세권');
  });
  it('· 3개 포인트를 반환한다', () => {
    expect(detailPoints(apt)).toHaveLength(3);
  });
});
