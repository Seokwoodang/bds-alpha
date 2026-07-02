import Link from 'next/link';
import { getGuides } from '@/lib/queries/guides';
import { getRegionScoreAll, getRegionListings, getDataMeta } from '@/lib/queries/regionsCode';
import { rankRegions, scoreBadge } from '@/lib/score';
import { formatPriceManwon } from '@/lib/property';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';
import { KoreaChoropleth } from '@/components/KoreaChoropleth';
import { HomeInvestWidget } from '@/components/HomeInvestWidget';
import { RegionSearch } from '@/components/RegionSearch';
import { HomeGuides } from '@/components/HomeGuides';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [scoreRows, guides, meta] = await Promise.all([getRegionScoreAll(), getGuides(), getDataMeta()]);

  const ranked = rankRegions(scoreRows.map((r) => ({
    code: r.lawd_cd, sale: r.sale_eok, ratio: r.jeonse_ratio, chg3: r.chg3,
    volRecent: r.vol_recent, volPrev: r.vol_prev, txCount: r.tx_count,
  })));
  const statByCode = new Map(scoreRows.map((r) => [r.lawd_cd, r]));
  const top = ranked.filter((r) => CODE_TO_SIGUNGU[r.code]).slice(0, 6);

  const featuredCode = top[0]?.code ?? '11680';
  const featuredSgg = CODE_TO_SIGUNGU[featuredCode];
  const featuredListings = await getRegionListings(featuredCode, 6);
  const basisDate = meta.max_tx ? meta.max_tx.slice(0, 10) : null;

  return (
    <div className="bds-fade">
      {/* 지도 + 미니 투자추천 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--navy)', margin: '0 0 6px' }}>전국 부동산 투자 지도</h1>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>
              지역을 클릭해 실거래 시세·갭을 확인하세요.
              {basisDate && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted-2)' }}>국토부 실거래 {basisDate} 신고분까지 · 매매 {meta.tx_count.toLocaleString('ko-KR')}건 · {meta.region_count}개 지역</span>}
            </p>
          </div>
          <div style={{ flex: '0 1 380px', minWidth: 260 }}><RegionSearch /></div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 560px', minWidth: 300, background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
            <KoreaChoropleth />
          </div>
          <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HomeInvestWidget />
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 18, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>투자 스코어란?</div>
              <div style={{ fontSize: 13, color: '#7286A0', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--navy)' }}>모멘텀 40</strong>(3개월 가격 추세) + <strong style={{ color: 'var(--navy)' }}>거래량 30</strong>(수요 유입) + <strong style={{ color: 'var(--navy)' }}>진입성 30</strong>(전세가율·갭)으로 계산한 종합 점수입니다. 전세가율만 높은 지역이 아니라, <strong style={{ color: 'var(--navy)' }}>오르면서 거래가 붙는 지역</strong>을 찾습니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 투자 스코어 랭킹 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>지금 투자하기 좋은 지역</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>모멘텀·거래량·진입성 종합 스코어 순 (근거 함께 표시)</p>
          </div>
          <Link href="/compare" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>지역 비교 더보기 →</Link>
        </div>
        {top.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 28, textAlign: 'center', color: 'var(--muted)' }}>지도에서 지역을 클릭해 데이터를 불러오면 랭킹이 표시됩니다.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {top.map((r, i) => {
              const sgg = CODE_TO_SIGUNGU[r.code];
              const stat = statByCode.get(r.code);
              const badge = scoreBadge(r.score);
              return (
                <Link key={r.code} href={`/prices?code=${r.code}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: 'var(--navy)', borderRadius: 5, padding: '1px 7px' }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: '#8499B3', fontWeight: 600 }}>{sgg?.sido}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: badge.color }}>{badge.label} {r.score}점</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{sgg?.name}</div>
                  <div style={{ fontSize: 12.5, color: '#7286A0', lineHeight: 1.6 }}>{r.reasons.join(' · ')}</div>
                  {stat && <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 6 }}>매매 중위 {stat.sale_eok}억 · 표본 {stat.tx_count.toLocaleString('ko-KR')}건</div>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 눈여겨볼 실거래 매물 */}
      {featuredListings.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>눈여겨볼 실거래 매물</h2>
              <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>스코어 1위 {featuredSgg?.sido} {featuredSgg?.name}의 최근 실거래</p>
            </div>
            <Link href={`/listings?code=${featuredCode}`} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>매물 더보기 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {featuredListings.map((t) => (
              <Link key={t.id} href={`/listings/tx/${t.id}`} className="bds-card" style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 12, color: '#8499B3', fontWeight: 600, marginBottom: 4 }}>{featuredSgg?.name}{t.dong ? ` · ${t.dong}` : ''}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8, minHeight: 22 }}>{t.apt_name ?? '—'}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{formatPriceManwon(t.deal_amount)}</div>
                <div style={{ fontSize: 13, color: '#7286A0' }}>전용 {t.area}㎡ · {t.floor ?? '—'}층 · {t.deal_date}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 가이드 */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>투자 가이드</h2>
            <p style={{ fontSize: 15, color: '#7286A0', margin: 0 }}>세금·입지·타이밍 실전 인사이트</p>
          </div>
          <Link href="/guides" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>전체보기 →</Link>
        </div>
        <HomeGuides guides={guides.slice(0, 3)} />
      </section>
    </div>
  );
}
