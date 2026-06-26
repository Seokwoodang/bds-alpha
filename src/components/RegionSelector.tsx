'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Region } from '@/lib/types';
import { barHeight } from '@/lib/chart';

function useSelectRegion() {
  const router = useRouter();
  const pathname = usePathname();
  return (name: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('region', name);
    router.replace(`${pathname}?${params.toString()}`);
  };
}

/** 지역 선택 칩(시세 상단). */
export function RegionTabs({ regions, selected }: { regions: Region[]; selected: string }) {
  const select = useSelectRegion();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
      {regions.map((r) => {
        const on = r.name === selected;
        return (
          <button key={r.name} aria-pressed={on} onClick={() => select(r.name)}
            style={{ borderRadius: 30, padding: '8px 15px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 700 : 600, border: `1px solid ${on ? 'var(--primary)' : 'var(--line)'}`, background: on ? 'var(--primary)' : '#fff', color: on ? '#fff' : '#5B6E88' }}>
            {r.name}
          </button>
        );
      })}
    </div>
  );
}

/** 지역별 막대 비교(클릭 시 선택). */
export function RegionBars({ regions, selected }: { regions: Region[]; selected: string }) {
  const select = useSelectRegion();
  const max = Math.max(...regions.map((r) => r.price));
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 20 }}>지역별 시세 비교</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 210, paddingBottom: 8, borderBottom: '1px solid #EEF2F8' }}>
        {regions.map((r) => {
          const on = r.name === selected;
          return (
            <button key={r.name} onClick={() => select(r.name)} aria-label={`${r.name} 선택`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 8, background: 'none', border: 'none', cursor: 'pointer', height: '100%', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)' }}>{r.price.toFixed(1)}억</span>
              <div style={{ width: '100%', maxWidth: 46, borderRadius: '8px 8px 0 0', background: on ? 'var(--primary)' : '#C5D4E8', height: barHeight(r.price, max), transition: 'height .4s ease' }} />
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        {regions.map((r) => (
          <div key={r.name} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#7286A0' }}>{r.name}</div>
        ))}
      </div>
    </div>
  );
}
