// SUVIDHA — Radiant Arch logo.
// Source: kiosk design/designs/kiosk-shell.jsx:7-17

import React from 'react';

export default function Logo({
  size = 44,
  primary = 'var(--cream)',
  accent = 'var(--saffron-500)',
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 78 A30 30 0 0 1 90 78"
        stroke={primary}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 78 A20 20 0 0 1 80 78"
        stroke={primary}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M48 78 A12 12 0 0 1 72 78"
        stroke={primary}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <rect x="28" y="80" width="64" height="4" rx="2" fill={primary} opacity="0.9" />
      <circle cx="60" cy="40" r="4" fill={accent} />
    </svg>
  );
}
