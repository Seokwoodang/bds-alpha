'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Region } from '@/lib/types';

const POS: Record<string, [number, number]> = {
  강남구: [62, 66], 서초구: [49, 68], 송파구: [77, 60], 용산구: [44, 50],
  성동구: [60, 44], 광진구: [75, 45], 마포구: [29, 47], 영등포구: [33, 64],
};

export function MapView({ regions, selected }: { regions: Region[]; selected: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function select(name: string) {
    const params = new URLSearchParams(window.location.search);
    params.set('region', name);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
      <div style={{ flex: '2 1 540px', minWidth: 320, position: 'relative', height: 560, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', background: '#EAF0F7', backgroundImage: 'linear-gradient(#DDE6F1 1px,transparent 1px),linear-gradient(90deg,#DDE6F1 1px,transparent 1px),linear-gradient(115deg,transparent 46%,#D2DEEC 46%,#D2DEEC 54%,transparent 54%),linear-gradient(200deg,transparent 60%,#CFE0F0 60%,#CFE0F0 67%,transparent 67%)', backgroundSize: '40px 40px,40px 40px,100% 100%,100% 100%' }}>
        <span style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11, color: '#8FA4C0', background: 'rgba(255,255,255,0.7)', padding: '4px 9px', borderRadius: 6 }}>[ 지도 영역 · 실제 지도 연동 위치 ]</span>
        <span style={{ position: 'absolute', bottom: '46%', left: '30%', color: '#9DB1CC', fontSize: 13, fontWeight: 700, transform: 'rotate(-8deg)' }}>한 강</span>
        {regions.map((r) => {
          const on = r.name === selected;
          const [left, top] = POS[r.name] ?? [50, 50];
          return (
            <button key={r.name} onClick={() => select(r.name)} aria-label={`${r.name} 선택`}
              style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-100%)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: on ? 20 : 10 }}>
              <span style={{ whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 30, boxShadow: '0 4px 12px rgba(12,35,64,0.2)', color: '#fff', background: on ? 'var(--primary)' : 'var(--navy)', border: `2px solid ${on ? '#fff' : 'transparent'}` }}>{r.name} {r.price.toFixed(1)}억</span>
              <span style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${on ? 'var(--primary)' : 'var(--navy)'}` }} />
            </button>
          );
        })}
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 260 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8499B3', padding: '12px 14px 8px' }}>지역별 평균 시세</div>
          {regions.map((r) => {
            const on = r.name === selected;
            return (
              <button key={r.name} onClick={() => select(r.name)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: on ? 'var(--primary-soft)' : 'none' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{r.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{r.price.toFixed(1)}억</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.change >= 0 ? 'var(--up)' : 'var(--down)' }}>{r.change >= 0 ? '▲ ' : '▼ '}{Math.abs(r.change).toFixed(1)}%</span>
                </span>
              </button>
            );
          })}
        </div>
        <Link href={`/prices?region=${encodeURIComponent(selected)}`} style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 14, background: 'var(--navy)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, fontWeight: 700 }}>
          {selected} 상세 시세 분석 →
        </Link>
      </div>
    </div>
  );
}
