import React from 'react';
import { useAccessibility } from '../AccessibilityProvider';

// Screen 03's fingerprint container — 3 concentric circles + animated scan line.
export default function BiometricScanner() {
  const { reducedMotion } = useAccessibility();
  return (
    <div
      style={{
        position: 'relative', width: 128, height: 128, borderRadius: 30,
        background: 'var(--indigo-100)', border: '2px solid var(--indigo-300)',
        overflow: 'hidden', display: 'grid', placeItems: 'center',
      }}
    >
      <svg width={76} height={76} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="12" stroke="var(--indigo-500)" strokeWidth="4" fill="none" />
        <circle cx="50" cy="50" r="26" stroke="var(--indigo-500)" strokeWidth="4" fill="none" opacity="0.55" />
        <circle cx="50" cy="50" r="40" stroke="var(--indigo-500)" strokeWidth="4" fill="none" opacity="0.28" />
      </svg>
      <div
        style={{
          position: 'absolute', left: 12, right: 12, height: 3, borderRadius: 2,
          background: 'var(--saffron-500)', boxShadow: '0 0 14px var(--saffron-500)',
          animation: reducedMotion ? 'none' : 'scanY 2s ease-in-out infinite',
          opacity: reducedMotion ? 0.6 : 1,
        }}
      />
    </div>
  );
}
