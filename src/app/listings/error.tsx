'use client';

import { ErrorRetry } from '@/components/ErrorRetry';

export default function ListingsError({ error, reset }: { error: Error; reset: () => void }) {
  const message = process.env.NODE_ENV === 'development' ? `매물을 불러오지 못했어요. (${error.message})` : '매물을 불러오지 못했어요.';
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      <ErrorRetry reset={reset} message={message} />
    </div>
  );
}
