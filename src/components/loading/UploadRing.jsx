import React from 'react';

const R = 40;
const CIRC = 2 * Math.PI * R;

// Circular % progress ring — screen 05. `progress` is 0-1.
export default function UploadRing({ progress = 0, filename, loadedLabel }) {
  const dashOffset = CIRC * (1 - progress);
  const pct = Math.round(progress * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 132, height: 132, display: 'grid', placeItems: 'center' }}>
        <svg width={132} height={132} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={R} fill="none" stroke="var(--indigo-700)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 60ms linear' }}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: 'var(--indigo-900)', lineHeight: 1 }}>{pct}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-500)' }}>PERCENT</span>
        </div>
      </div>
      {filename && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--indigo-700)' }}>{filename}</div>}
      {loadedLabel && <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{loadedLabel}</div>}
    </div>
  );
}
