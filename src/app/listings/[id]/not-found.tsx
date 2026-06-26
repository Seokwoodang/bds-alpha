import Link from 'next/link';

export default function ListingNotFound() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: '#9AACC2' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🏠</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>매물을 찾을 수 없어요</h1>
      <p style={{ fontSize: 15, marginBottom: 20 }}>존재하지 않거나 삭제된 매물입니다. (404)</p>
      <Link href="/listings" style={{ display: 'inline-block', background: 'var(--primary)', borderRadius: 11, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 700 }}>매물 목록으로</Link>
    </div>
  );
}
