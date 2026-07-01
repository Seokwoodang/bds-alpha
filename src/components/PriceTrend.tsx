'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildSeriesChart } from '@/lib/chart';
import { PriceChart } from '@/components/PriceChart';

type Gran = 'month' | 'week';
type Point = { label: string; value: number };

/**
 * 시세 추이 차트 + 월간/주간 토글.
 * 월간 시계열은 서버에서 계산해 넘겨(initialMonthly) 첫 페인트 즉시. 주간은 최초 선택 시 브라우저에서 조회·캐시.
 */
export function PriceTrend({ region, initialMonthly }: { region: string; initialMonthly: Point[] }) {
  const [gran, setGran] = useState<Gran>('month');
  const [weekly, setWeekly] = useState<Point[] | null>(null);
  const [loading, setLoading] = useState(false);

  // 지역이 바뀌면 월간으로 리셋 + 주간 캐시 무효화
  useEffect(() => { setGran('month'); setWeekly(null); }, [region]);

  useEffect(() => {
    if (gran !== 'week' || weekly !== null) return;
    setLoading(true);
    const supabase = createClient();
    supabase.rpc('region_series_weekly', { p_region: region }).then(({ data }) => {
      setWeekly(((data as { label: string; price_eok: number }[]) ?? []).map((d) => ({ label: d.label, value: Number(d.price_eok) })));
      setLoading(false);
    });
  }, [gran, region, weekly]);

  const points = gran === 'month' ? initialMonthly : (weekly ?? []);
  const chart = buildSeriesChart(points.map((p) => p.value), points.map((p) => p.label));

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>{`${region} 시세 추이`}</div>
        <div style={{ display: 'flex', gap: 4, background: '#EAEFF6', padding: 4, borderRadius: 10 }}>
          {([['month', '월간'], ['week', '주간']] as const).map(([g, label]) => (
            <button key={g} aria-pressed={gran === g} onClick={() => setGran(g)}
              style={{ border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: gran === g ? '#fff' : 'transparent', color: gran === g ? 'var(--primary)' : '#7286A0', boxShadow: gran === g ? '0 2px 6px rgba(12,35,64,0.12)' : 'none' }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#8499B3', marginBottom: 16 }}>
        {gran === 'month' ? '최근 13개월 · 월별 중위가(3개월 이동평균)' : '최근 26주 · 주별 중위가(4주 이동평균)'} · 국토부 실거래 대표평형 60~85㎡(억)
      </div>
      {loading ? (
        <div style={{ color: 'var(--muted-2)', padding: '40px 0', textAlign: 'center' }}>주간 데이터 불러오는 중…</div>
      ) : points.length === 0 ? (
        <div style={{ color: 'var(--muted-2)', padding: '40px 0', textAlign: 'center' }}>표시할 실거래가 부족합니다.</div>
      ) : (
        <PriceChart data={chart} />
      )}
    </div>
  );
}
