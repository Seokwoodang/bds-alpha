import { SkeletonChart } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ height: 28, width: 160, background: '#EEF2F8', borderRadius: 8, marginBottom: 24 }} />
      <SkeletonChart />
    </div>
  );
}
