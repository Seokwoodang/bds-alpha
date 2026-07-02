'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPriceManwon } from '@/lib/property';
import { HeartTxButton } from '@/components/HeartTxButton';
import { MapLink } from '@/components/MapLink';

interface Tx { id: number; apt_name: string | null; dong: string | null; area: number; floor: number | null; deal_amount: number; deal_date: string }
type Sort = 'recent' | 'high' | 'low';

const SORTS: { key: Sort; label: string; col: string; asc: boolean }[] = [
  { key: 'recent', label: '최신순', col: 'deal_date', asc: false },
  { key: 'high', label: '가격 높은순', col: 'deal_amount', asc: false },
  { key: 'low', label: '가격 낮은순', col: 'deal_amount', asc: true },
];
const ctl: React.CSSProperties = { border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', outline: 'none' };

/** 전국 개별 실거래 매물 목록(코드 기반). 미수집이면 온디맨드 수집 후 표시. 검색·정렬·하트. */
export function NationwideListings({ code, region, sido, loggedIn, savedIds }: { code: string; region: string; sido: string; loggedIn: boolean; savedIds: number[] }) {
  const [rows, setRows] = useState<Tx[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ingesting' | 'ready' | 'empty'>('loading');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const s = SORTS.find((x) => x.key === sort)!;
    async function run() {
      setRows(null); setStatus('loading');
      // 미수집이면 온디맨드 수집
      const cov = await supabase.rpc('region_coverage', { p_lawd: code });
      const txCount = Number((cov.data as { tx_count: number }[])?.[0]?.tx_count ?? 0);
      if (txCount === 0) {
        if (!cancelled) setStatus('ingesting');
        await fetch('/api/ingest-region', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, months: 6 }) }).catch(() => {});
      }
      const { data } = await supabase.from('transactions')
        .select('id,apt_name,dong,area,floor,deal_amount,deal_date')
        .eq('lawd_cd', code).order(s.col, { ascending: s.asc }).limit(200);
      if (cancelled) return;
      const list = ((data as Tx[]) ?? []).map((d) => ({ ...d, area: Number(d.area), deal_amount: Number(d.deal_amount) }));
      setRows(list);
      setStatus(list.length ? 'ready' : 'empty');
    }
    run();
    return () => { cancelled = true; };
  }, [code, sort]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const kw = q.trim();
    return kw ? rows.filter((r) => (r.apt_name ?? '').includes(kw) || (r.dong ?? '').includes(kw)) : rows;
  }, [rows, q]);

  const returnTo = `/listings?code=${code}`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="단지명·동 검색" aria-label="단지명 검색" style={{ ...ctl, flex: '1 1 220px' }} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="정렬" style={ctl}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {status === 'ingesting' || status === 'loading' ? (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '44px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{status === 'ingesting' ? `${sido} ${region} 실거래를 불러오는 중…` : '불러오는 중…'}</div>
          {status === 'ingesting' && <div style={{ fontSize: 13, color: 'var(--muted-2)', marginTop: 6 }}>처음 보는 지역이라 국토부에서 가져오고 있어요(몇 초).</div>}
        </div>
      ) : status === 'empty' ? (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 30, textAlign: 'center', color: 'var(--muted)' }}>이 지역의 최근 실거래가 없습니다.</div>
      ) : (
        <>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>총 <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>{filtered.length}</strong>건 · {sido} {region}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
            {filtered.map((t) => (
              <div key={t.id} style={{ position: 'relative' }}>
                {loggedIn && <HeartTxButton txId={t.id} isSaved={savedSet.has(t.id)} returnTo={returnTo} />}
                <MapLink query={`${sido} ${region} ${t.dong ?? ''} ${t.apt_name ?? ''}`} variant="icon" />
                <Link prefetch={false} href={`/listings/tx/${t.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '52px 18px 18px' }}>
                  <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{sido} {region}{t.dong ? ` · ${t.dong}` : ''}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8, minHeight: 22 }}>{t.apt_name ?? '—'}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 6 }}>{formatPriceManwon(t.deal_amount)}</div>
                  <div style={{ fontSize: 13, color: '#7286A0' }}>전용 {t.area}㎡ · {t.floor ?? '—'}층 · {t.deal_date}</div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
