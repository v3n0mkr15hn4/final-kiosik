import React from 'react';

const bone = (delayMs) => ({
  background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-1) 50%, var(--surface-2) 75%)',
  backgroundSize: '200% 100%',
  animation: `shimmer 1.4s ease-in-out infinite ${delayMs}ms`,
});

// Track Status result-row skeleton — avatar + title/subtitle + badge pill.
export default function SkeletonRow({ delayMs = 0 }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, ...bone(delayMs) }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '60%', height: 15, borderRadius: 6, ...bone(delayMs + 100) }} />
        <div style={{ width: '40%', height: 12, borderRadius: 6, ...bone(delayMs + 150) }} />
      </div>
      <div style={{ width: 70, height: 30, borderRadius: 999, ...bone(delayMs + 200) }} />
    </div>
  );
}
