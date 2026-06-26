import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: '부동산알파 — 데이터 기반 부동산 투자 플랫폼',
  description: '실거래 시세, 예상 수익률, 지역별 흐름까지. 부동산 투자에 필요한 모든 데이터.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // 이중 getUser 방지: 이미 가져온 user로 직접 count 조회.
  let savedCount = 0;
  if (user) {
    const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id);
    savedCount = data?.length ?? 0;
  }

  return (
    <html lang="ko">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
          <Header isAuthed={!!user} savedCount={savedCount} />
          <main style={{ flex: 1, width: '100%' }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
