import React from 'react';

const bone = (delayMs) => ({
  background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-1) 50%, var(--surface-2) 75%)',
  backgroundSize: '200% 100%',
  animation: `shimmer 1.4s ease-in-out infinite ${delayMs}ms`,
});

// Home screen service-tile skeleton — icon + title + subtitle bones.
export default function SkeletonTile({ delayMs = 0, height }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, height }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, ...bone(delayMs) }} />
      <div style={{ width: '75%', height: 16, borderRadius: 6, ...bone(delayMs + 100) }} />
      <div style={{ width: '50%', height: 12, borderRadius: 6, ...bone(delayMs + 150) }} />
    </div>
  );
}
