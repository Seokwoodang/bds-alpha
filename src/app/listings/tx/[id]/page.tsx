import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSavedTxIds } from '@/lib/queries/savedTxRead';
import { getProperties } from '@/lib/queries/propertiesRead';
import { formatPriceManwon } from '@/lib/property';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import { TaxEstimate } from '@/components/TaxEstimate';
import { SellTaxSim } from '@/components/SellTaxSim';
import { HeartTxButton } from '@/components/HeartTxButton';
import { RegistryLink } from '@/components/RegistryLink';
import { MapLink } from '@/components/MapLink';
import { BackLink } from '@/components/BackLink';

export const dynamic = 'force-dynamic';

interface TxRow { id: number; region: string; lawd_cd: string; apt_name: string | null; dong: string | null; deal_amount: number; area: number; floor: number | null; build_year: number | null; deal_date: string }

export default async function TxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from('transactions').select('id,region,lawd_cd,apt_name,dong,deal_amount,area,floor,build_year,deal_date').eq('id', id).maybeSingle();
  const tx = data as TxRow | null;
  if (!tx) notFound();

  const sgg = CODE_TO_SIGUNGU[tx.lawd_cd];
  const sido = sgg?.sido ?? '';
  const priceManwon = Number(tx.deal_amount);
  const area = Number(tx.area);

  const [savedIds, properties, { data: sim }] = await Promise.all([
    getSavedTxIds(),
    getProperties(),
    supabase.from('transactions').select('id,apt_name,dong,area,floor,deal_amount,deal_date').eq('lawd_cd', tx.lawd_cd).neq('id', id).order('deal_date', { ascending: false }).limit(6),
  ]);
  const isSaved = savedIds.includes(id);
  const similar = ((sim as { id: number; apt_name: string | null; dong: string | null; area: number; floor: number | null; deal_amount: number; deal_date: string }[]) ?? []);
  const returnTo = `/listings/tx/${id}`;
  const specs = [
    { k: '지역', v: `${sido} ${tx.region}${tx.dong ? ` ${tx.dong}` : ''}` },
    { k: '전용면적', v: `${area}㎡` },
    { k: '층', v: tx.floor != null ? `${tx.floor}층` : '—' },
    { k: '건축연도', v: tx.build_year ? `${tx.build_year}년` : '—' },
    { k: '거래금액', v: formatPriceManwon(priceManwon) },
    { k: '계약일', v: tx.deal_date },
  ];

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 64px' }}>
      <BackLink />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 520px', minWidth: 300 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', margin: '0 0 14px' }}>실거래 정보</h2>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
            {specs.map((sp) => (
              <div key={sp.k} style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ width: 130, fontSize: 14, color: '#8499B3', fontWeight: 600 }}>{sp.k}</span>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{sp.v}</span>
              </div>
            ))}
          </div>
          <TaxEstimate priceEok={priceManwon / 10000} area={area} region={tx.region} ownedDefault={properties.length} />
          <SellTaxSim buyEok={priceManwon / 10000} />
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div style={{ position: 'sticky', top: 88, background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 24, boxShadow: '0 12px 32px rgba(12,35,64,0.07)' }}>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{sido} {tx.region}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{tx.apt_name ?? '실거래'}</h1>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>실거래가(매매)</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em', marginBottom: 20 }}>{formatPriceManwon(priceManwon)}</div>
            <div style={{ fontSize: 13, color: '#7286A0', marginBottom: 18 }}>전용 {area}㎡ · {tx.floor ?? '—'}층 · {tx.deal_date}</div>
            <HeartTxButton txId={id} isSaved={isSaved} returnTo={returnTo} variant="detail" />
            <MapLink query={`${sido} ${tx.region} ${tx.dong ?? ''} ${tx.apt_name ?? ''}`} />
            <RegistryLink address={`${sido} ${tx.region} ${tx.apt_name ?? ''}`.trim()} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: '40px 0 18px', letterSpacing: '-0.02em' }}>{tx.region} 최근 실거래</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
            {similar.map((s) => (
              <Link key={s.id} href={`/listings/tx/${s.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8, minHeight: 22 }}>{s.apt_name ?? '—'}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{formatPriceManwon(Number(s.deal_amount))}</div>
                <div style={{ fontSize: 13, color: '#7286A0' }}>전용 {Number(s.area)}㎡ · {s.floor ?? '—'}층 · {s.deal_date}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
