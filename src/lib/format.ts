import type { Deal, Listing } from '@/lib/types';

/** 수익률 표시: roi>0 → "연 N.N%", 아니면(전세 등) "—". */
export function roiText(roi: number): string {
  return roi > 0 ? `연 ${roi.toFixed(1)}%` : '—';
}

/** 거래유형 배지 색. 매매=네이비 / 전세=프라이머리 / 월세=업그린. */
export function dealBadge(deal: Deal): { bg: string } {
  const bg = deal === '매매' ? '#0C2340' : deal === '전세' ? '#1C5DDA' : '#0E9F6E';
  return { bg };
}

/** 면적·층 표시. */
export function areaText(area: number, floor: string): string {
  return `${area}㎡ · ${floor}`;
}

/** 상세 정보 표(8행). beds=0 → "오피스/원룸", roi=0 → "해당 없음". */
export function detailSpecs(l: Listing): { k: string; v: string }[] {
  return [
    { k: '매물 유형', v: l.type },
    { k: '거래 유형', v: l.deal },
    { k: '전용 면적', v: `${l.area}㎡` },
    { k: '해당 층', v: l.floor },
    { k: '방 개수', v: l.beds > 0 ? `${l.beds}개` : '오피스/원룸' },
    { k: '준공 연도', v: `${l.built}년` },
    { k: '소재지', v: `${l.region} ${l.dong}` },
    { k: '예상 수익률', v: l.roi > 0 ? `연 ${l.roi.toFixed(1)}%` : '해당 없음' },
  ];
}

/** 투자 포인트(3개). tags[1] 없으면 fallback, roi=0이면 실거주 문구. */
export function detailPoints(l: Listing): string[] {
  const tag0 = l.tags[0] ?? '우수한 입지';
  const tag1 = l.tags[1] ?? '우수한 생활 인프라';
  return [
    `${l.region} ${l.dong} ${tag0} 입지로 실수요와 임대 수요가 안정적입니다.`,
    `${l.built}년 준공으로 관리 상태가 양호하며, ${tag1} 프리미엄을 갖췄습니다.`,
    l.roi > 0
      ? `예상 수익률 연 ${l.roi.toFixed(1)}% 수준으로 동일 지역 평균 대비 경쟁력이 있습니다.`
      : '실거주 만족도가 높아 장기 보유 시 안정적입니다.',
  ];
}
