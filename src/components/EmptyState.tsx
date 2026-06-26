import Link from 'next/link';

export function EmptyState({
  icon, title, desc, cta,
}: { icon: string; title: string; desc: string; cta?: { label: string; href: string } }) {
  return (
    <div style={{ textAlign: 'center', padding: cta ? '70px 20px' : '80px 20px', background: cta ? '#fff' : 'transparent', border: cta ? '1px solid var(--line)' : 'none', borderRadius: cta ? 18 : 0, color: '#9AACC2' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, marginBottom: cta ? 20 : 0 }}>{desc}</div>
      {cta && (
        <Link href={cta.href} style={{ display: 'inline-block', background: 'var(--primary)', borderRadius: 11, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 700 }}>{cta.label}</Link>
      )}
    </div>
  );
}
