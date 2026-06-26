const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg,#EEF2F8 25%,#F6F9FC 37%,#EEF2F8 63%)',
  backgroundSize: '400% 100%',
  animation: 'bdsShimmer 1.4s ease infinite',
  borderRadius: 8,
};

function Box({ h, w = '100%', r = 8 }: { h: number; w?: number | string; r?: number }) {
  return <div style={{ ...shimmer, height: h, width: w, borderRadius: r }} />;
}

/** 카드 그리드 스켈레톤(목록/마이페이지/홈 추천). */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          <Box h={168} r={0} />
          <div style={{ padding: '16px 17px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Box h={14} w="40%" />
            <Box h={18} w="80%" />
            <Box h={20} w="55%" />
            <Box h={12} w="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 시세 차트/KPI 스켈레톤. */
export function SkeletonChart() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flex: '1 1 160px', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
            <Box h={14} w="50%" /><div style={{ height: 10 }} /><Box h={26} w="70%" />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24 }}>
        <Box h={300} />
      </div>
    </div>
  );
}
