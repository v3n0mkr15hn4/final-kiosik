// OTP cell row — renders N cells, fills from a string value.
// Layout from kiosk design/designs/vertical-pages-v1.jsx:248

import React from 'react';

export default function OTPInput({ value = '', length = 6, cellStyle = {} }) {
  const cells = Array.from({ length }, (_, i) => value[i] ?? '');
  const activeIndex = value.length; // next empty cell
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
      {cells.map((digit, i) => (
        <div
          key={i}
          className={`otp-cell ${i < activeIndex ? 'act' : ''}`}
          style={cellStyle}
        >
          {digit || (i === activeIndex ? '·' : '')}
        </div>
      ))}
    </div>
  );
}

// Aadhaar entry — 12-digit display row.
export function AadhaarCells({ value = '' }) {
  const cells = Array.from({ length: 12 }, (_, i) => value[i] ?? '');
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 32,
      flexWrap: 'wrap',
    }}>
      {cells.map((digit, i) => (
        <div
          key={i}
          className="otp-cell"
          style={{ width: 64, height: 88, fontSize: 36 }}
        >
          {digit}
        </div>
      ))}
    </div>
  );
}
