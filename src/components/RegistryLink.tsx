'use client';

import { useState } from 'react';

/**
 * 등기열람 안내 — 인터넷등기소(iros.go.kr)로 연결.
 * 인터넷등기소는 주소 딥링크/공개 API가 없어 특정 호(號) 등기로 바로 이동할 수 없으므로,
 * 등기열람 입구로 연결 + 매물 주소 복사만 제공(발급·결제는 사용자가 직접).
 */
const IROS_URL = 'https://www.iros.go.kr/';

export function RegistryLink({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(address).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1800); },
      () => {},
    );
  }

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>
      <a
        href={IROS_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 13, color: 'var(--navy)', fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}
      >
        📄 등기열람 (인터넷등기소)
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={address}>{address}</span>
        <button onClick={copy} style={{ flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
          {copied ? '복사됨 ✓' : '주소 복사'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 7, lineHeight: 1.5 }}>
        인터넷등기소에서 주소 입력 후 <strong>동·호수 선택 → 700원 결제</strong>로 열람. 권리관계(근저당·대출)는 <strong>을구(乙區)</strong>에서 확인하세요.
      </div>
    </div>
  );
}
