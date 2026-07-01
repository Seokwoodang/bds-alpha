/**
 * 네이버 지도 검색 링크 — 실제 매물 사진 대신 위치·로드뷰(거리뷰)로 실물 확인.
 * 좌표 없이도 "시도 시군구 동 단지명"으로 검색하면 해당 건물로 이동, 거기서 거리뷰 열람.
 */
function naverUrl(query: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(query.trim())}`;
}

export function MapLink({ query, variant = 'button' }: { query: string; variant?: 'button' | 'icon' | 'cover' }) {
  const href = naverUrl(query);
  const common = { href, target: '_blank', rel: 'noopener noreferrer' as const };

  if (variant === 'icon') {
    return (
      <a {...common} aria-label="네이버 지도·로드뷰에서 보기" onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 10, left: 10, height: 34, padding: '0 10px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--navy)', textDecoration: 'none', zIndex: 2 }}>
        🗺️ 로드뷰
      </a>
    );
  }
  if (variant === 'cover') {
    return (
      <a {...common} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--line)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
        🗺️ 지도·로드뷰에서 위치 보기
      </a>
    );
  }
  return (
    <a {...common} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box', marginTop: 10, background: '#03C75A', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
      🗺️ 네이버 지도·로드뷰
    </a>
  );
}
