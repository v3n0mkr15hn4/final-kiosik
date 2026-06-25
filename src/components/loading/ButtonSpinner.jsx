import React from 'react';

// Inline 20px button spinner — button stays the same size, label swaps.
// variant maps to the README's track/sweep color table.
const VARIANTS = {
  primary: { track: 'color-mix(in oklab, var(--cream) 35%, transparent)', sweep: 'var(--cream)' },
  accent: { track: 'color-mix(in oklab, var(--indigo-900) 25%, transparent)', sweep: 'var(--indigo-900)' },
  ghost: { track: 'var(--line)', sweep: 'var(--ink-500)' },
};

export default function ButtonSpinner({ variant = 'primary', size = 20 }) {
  const { track, sweep } = VARIANTS[variant] || VARIANTS.primary;
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: `3px solid ${track}`, borderTopColor: sweep,
        animation: 'spin 0.7s linear infinite', display: 'inline-block',
      }}
    />
  );
}
