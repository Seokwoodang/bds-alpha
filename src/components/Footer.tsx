const COLS = [
  { title: '서비스', links: ['매물 검색', '시세 분석', '투자 가이드', '지도 탐색'] },
  { title: '회사', links: ['소개', '채용', '블로그', '제휴 문의'] },
  { title: '고객지원', links: ['공지사항', '자주 묻는 질문', '이용약관', '개인정보처리방침'] },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--navy)', color: '#B7C7DE', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
        <div style={{ maxWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>α</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>부동산알파</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8FA6C4', margin: 0 }}>
            데이터 기반 부동산 투자 플랫폼. 모든 정보는 투자 참고용이며, 투자 판단과 책임은 이용자 본인에게 있습니다.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{c.title}</div>
            {c.links.map((l) => (
              <div key={l} style={{ fontSize: 13, color: '#8FA6C4', padding: '5px 0', cursor: 'pointer' }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 24px', fontSize: 12, color: '#6F89A8' }}>
          © 2026 부동산알파 (bds-alpha). 본 서비스는 디자인 프로토타입입니다.
        </div>
      </div>
    </footer>
  );
}
