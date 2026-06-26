/** 가이드 커버 그라데이션(아티클별 hue). */
export function cover(hue: number): string {
  return `linear-gradient(135deg,oklch(0.7 0.12 ${hue}),oklch(0.55 0.15 ${hue + 24}))`;
}

/** 매물 사진 플레이스홀더(스트라이프). */
export const LISTING_COVER = 'repeating-linear-gradient(135deg,#DCE6F2 0 14px,#E9F0F8 14px 28px)';
