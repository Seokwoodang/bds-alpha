'use client';

import { useRouter } from 'next/navigation';

/** 뒤로가기: 직전 필터 URL 보존을 위해 history.back() 사용, 진입 이력이 없으면 /listings. */
export function BackLink() {
  const router = useRouter();

  function back() {
    // 외부 사이트에서 직접 들어온 경우(referrer가 외부)만 목록으로 push,
    // 그 외(앱 내부 client-nav는 referrer가 비거나 same-origin)는 back으로 직전 필터 URL 보존.
    const ref = typeof document !== 'undefined' ? document.referrer : '';
    const external = ref !== '' && !ref.startsWith(window.location.origin);
    if (!external && window.history.length > 1) router.back();
    else router.push('/listings');
  }

  return (
    <button onClick={back} style={{ background: 'none', border: 'none', color: '#7286A0', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: 8 }}>
      ← 매물 목록으로
    </button>
  );
}
