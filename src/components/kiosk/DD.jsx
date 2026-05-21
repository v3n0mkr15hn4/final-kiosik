// Department dot — a coloured icon-block used to mark service categories.
// Source: kiosk design/designs/kiosk-shell.jsx:156-162

import React from 'react';
import { I } from './icons';

export default function DD({ color, glyph, size = 96, isz = 48, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 26,
        background: `color-mix(in oklab, ${color} 22%, white)`,
        color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <I d={glyph} size={isz} />
    </div>
  );
}
