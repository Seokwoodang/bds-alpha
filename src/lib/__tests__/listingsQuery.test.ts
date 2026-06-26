/**
 * RED tests — 쿼리 빌더 (src/lib/listingsQuery.ts) · logic 레이어 (순수)
 * docs scope: 모듈 미구현 → RED. GREEN 단계에서 구현.
 *
 * 계약(03-design §4):
 *   parseListingParams(sp: URLSearchParams): QuerySpec   // 기본값/정규화
 *   buildListingsQuery(spec): {
 *     eq: { deal?: string; region?: string; type?: string },   // '전체'면 키 제외
 *     ilikeOr: string[] | null,   // q면 [title,region,dong,type,tags] 필드별 ilike (대소문자 무시), 없으면 null
 *     order: { col: 'price_num'|'roi'; asc: boolean } | null,   // 추천순이면 null
 *   }
 * 커버 셀: params·defaults/unknown, search·*(title/region/dong/type/tags/case/no-match/empty/whitespace/no-cross-boundary),
 *          filter·*(dealType/region/ptype/combo-AND), sort·*(4종/roi0-bottom/tie-stable)
 */
import { describe, it, expect } from 'vitest';
import { parseListingParams, buildListingsQuery } from '@/lib/listingsQuery';
import type { QuerySpec } from '@/lib/types';

const base: QuerySpec = { deal: '전체', region: '전체', ptype: '전체', q: '', sort: '추천순' };

describe('parseListingParams', () => {
  it('T14 · 빈 파라미터 → 전부 기본값', () => {
    const spec = parseListingParams(new URLSearchParams(''));
    expect(spec).toEqual(base);
  });
  it('T14 · 주어진 파라미터를 QuerySpec으로', () => {
    const spec = parseListingParams(
      new URLSearchParams('deal=매매&region=강남구&ptype=아파트&q=청담&sort=가격높은순'),
    );
    expect(spec).toEqual({ deal: '매매', region: '강남구', ptype: '아파트', q: '청담', sort: '가격높은순' });
  });
  it('T15 · 알 수 없는 값은 기본값으로 정규화(throw 없음)', () => {
    const spec = parseListingParams(new URLSearchParams('deal=zzz&sort=무작위'));
    expect(spec.deal).toBe('전체');
    expect(spec.sort).toBe('추천순');
  });
});

describe('buildListingsQuery — 검색(q)', () => {
  const q = (text: string) => buildListingsQuery({ ...base, q: text });

  it('T16–T19 · q가 있으면 제목·지역·동·유형 필드별 ilike OR을 만든다', () => {
    const { ilikeOr } = q('청담');
    expect(ilikeOr).toBeTruthy();
    expect(ilikeOr).toEqual(
      expect.arrayContaining([
        expect.stringContaining('title'),
        expect.stringContaining('region'),
        expect.stringContaining('dong'),
        expect.stringContaining('type'),
      ]),
    );
  });
  it('T20 · tags 필드도 검색 대상에 포함(원본과 달라진 점)', () => {
    const { ilikeOr } = q('한강뷰');
    expect(ilikeOr?.some((c) => c.includes('tags'))).toBe(true);
  });
  it('T21 · 영문 대소문자 무시(ilike + 소문자화)', () => {
    const { ilikeOr } = q('ROI');
    // ilike는 대소문자 무시; 패턴은 소문자로 정규화되어야 함
    expect(ilikeOr?.every((c) => !c.includes('ROI'))).toBe(true);
    expect(ilikeOr?.some((c) => c.includes('roi') || c.includes('%roi%'))).toBe(true);
  });
  it('T22 · no-match 문자열도 정상적으로 조건만 구성(throw 없음)', () => {
    expect(() => q('존재하지않는검색어zzz')).not.toThrow();
    expect(q('존재하지않는검색어zzz').ilikeOr).toBeTruthy();
  });
  it('T23 · q가 빈 문자열이면 검색 조건 없음(null)', () => {
    expect(q('').ilikeOr).toBeNull();
  });
  it('T24 · q가 공백만이면 trim 후 검색 조건 없음(null)', () => {
    expect(q('   ').ilikeOr).toBeNull();
  });
  it('T25 · 필드별 매칭이므로 OR 조건은 단일 필드 단위(경계 거짓매칭 없음)', () => {
    // 각 조건이 정확히 하나의 필드만 참조해야 함(title+region 합성 컬럼 없음)
    const { ilikeOr } = q('동강');
    const fields = ['title', 'region', 'dong', 'type', 'tags'];
    for (const cond of ilikeOr ?? []) {
      const referenced = fields.filter((f) => cond.includes(f));
      expect(referenced).toHaveLength(1);
    }
  });
});

describe('buildListingsQuery — 필터', () => {
  it('T26 · dealType=매매 → eq.deal, 전체 → 키 없음', () => {
    expect(buildListingsQuery({ ...base, deal: '매매' }).eq.deal).toBe('매매');
    expect(buildListingsQuery(base).eq.deal).toBeUndefined();
  });
  it('T27 · region=강남구 → eq.region, 전체 → 키 없음', () => {
    expect(buildListingsQuery({ ...base, region: '강남구' }).eq.region).toBe('강남구');
    expect(buildListingsQuery(base).eq.region).toBeUndefined();
  });
  it('T28 · ptype=오피스텔 → eq.type, 전체 → 키 없음', () => {
    expect(buildListingsQuery({ ...base, ptype: '오피스텔' }).eq.type).toBe('오피스텔');
    expect(buildListingsQuery(base).eq.type).toBeUndefined();
  });
  it('T29 · 여러 필터는 모두 eq로 AND 결합', () => {
    const { eq } = buildListingsQuery({ ...base, deal: '매매', region: '강남구', ptype: '아파트' });
    expect(eq).toEqual({ deal: '매매', region: '강남구', type: '아파트' });
  });
});

describe('buildListingsQuery — 정렬', () => {
  it('T30 · 추천순 → order null', () => {
    expect(buildListingsQuery({ ...base, sort: '추천순' }).order).toBeNull();
  });
  it('T31 · 가격높은순 → price_num desc', () => {
    expect(buildListingsQuery({ ...base, sort: '가격높은순' }).order).toEqual({ col: 'price_num', asc: false });
  });
  it('T32 · 가격낮은순 → price_num asc', () => {
    expect(buildListingsQuery({ ...base, sort: '가격낮은순' }).order).toEqual({ col: 'price_num', asc: true });
  });
  it('T33 · 수익률순 → roi desc', () => {
    expect(buildListingsQuery({ ...base, sort: '수익률순' }).order).toEqual({ col: 'roi', asc: false });
  });
  // T34(roi=0 최하단), T35(tie=id asc)는 정렬 적용 결과를 검증 — getListings 통합(데이터 레이어) 또는
  // applySort 헬퍼로 검증. 여기서는 order 스펙만; 실제 순서 단언은 queries/listings 테스트(T45 인접)에서.
});
