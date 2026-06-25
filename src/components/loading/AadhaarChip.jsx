import React from 'react';

// Screen 02's pill chip — "AADHAAR ···· {last4}".
export default function AadhaarChip({ last4 }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--indigo-100)', borderRadius: 999, padding: '11px 20px',
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
        letterSpacing: '0.08em', color: 'var(--indigo-700)',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)' }} />
      AADHAAR ···· {last4}
    </div>
  );
}
