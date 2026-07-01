import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSaved } from '@/lib/queries/savedRead';
import { getSavedTx } from '@/lib/queries/savedTxRead';
import { getProperties } from '@/lib/queries/propertiesRead';
import { formatPriceManwon } from '@/lib/property';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import Link from 'next/link';
import { getRegionAreaMedian } from '@/lib/queries/regions';
import { getListingsByIds, countListings } from '@/lib/queries/listings';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';
import { MyAssets } from '@/components/MyAssets';
import { GainTaxCalculator } from '@/components/GainTaxCalculator';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnTo=%2Fmypage'); // 미들웨어 가드 + 이중 방어

  const savedIds = await getSaved();
  const [savedListings, total, properties, savedTx] = await Promise.all([getListingsByIds(savedIds), countListings(), getProperties(), getSavedTx()]);
  const savedSet = new Set(savedIds);

  // 보유 자산 평가손익용: 지역+면적대 현재 중위가(억) 조회
  const valEntries = await Promise.all(properties.map(async (p) => [p.id, await getRegionAreaMedian(p.region, p.area)] as const));
  const valuations: Record<string, number | null> = Object.fromEntries(valEntries);

  const stats = [
    { label: '관심 매물', value: `${savedIds.length}개` },
    { label: '보유 자산', value: `${properties.length}개` },
    { label: '추천 매물', value: `${total}개` },
  ];

  return (
    <div className="bds-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1C5DDA,#0A357F)', color: '#fff', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>투</span>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>투자자님, 안녕하세요</h1>
          <p style={{ fontSize: 14, color: '#7286A0', margin: '4px 0 0' }}>관심 매물과 투자 활동을 한곳에서 관리하세요.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, margin: '24px 0 32px' }}>
        {stats.map((m) => (
          <div key={m.label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, color: '#8499B3', fontWeight: 600, marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 18px', letterSpacing: '-0.02em' }}>관심 매물 <span style={{ color: 'var(--primary)' }}>{savedIds.length}</span></h2>
      {savedListings.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 }}>
          {savedListings.map((l) => (
            <ListingCard key={l.id} listing={l} isSaved={savedSet.has(l.id)} returnTo="/mypage" />
          ))}
        </div>
      ) : (
        <EmptyState icon="♡" title="아직 저장한 매물이 없어요" desc="마음에 드는 매물의 하트를 눌러 저장해 보세요." cta={{ label: '매물 둘러보기', href: '/listings' }} />
      )}

      {savedTx.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 18px', letterSpacing: '-0.02em' }}>관심 실거래 <span style={{ color: 'var(--primary)' }}>{savedTx.length}</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
            {savedTx.map((t) => {
              const sido = CODE_TO_SIGUNGU[t.lawd_cd]?.sido ?? '';
              return (
                <Link key={t.id} href={`/listings/tx/${t.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{sido} {t.region}{t.dong ? ` · ${t.dong}` : ''}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8, minHeight: 22 }}>{t.apt_name ?? '—'}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{formatPriceManwon(t.deal_amount)}</div>
                  <div style={{ fontSize: 13, color: '#7286A0' }}>전용 {t.area}㎡ · {t.floor ?? '—'}층 · {t.deal_date}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <MyAssets properties={properties} valuations={valuations} />

      <GainTaxCalculator />
    </div>
  );
}
