// ──────────────────────────────────────────────────────────────────
// useKioskScale — recompute --kiosk-scale on window resize.
//
// The kiosk stage renders at native 2160×3840 portrait 4K dimensions, then
// the CSS transform on `.kiosk-stage` scales it down to fit the browser window.
// This hook keeps the CSS custom property in sync.
//
// Production: kiosk runs at native 2160×3840, scale stays at 1.
// Dev / preview: window can be any size; we fit the kiosk inside it
//                with a small 32px margin on each side.
// ──────────────────────────────────────────────────────────────────

import { useEffect } from 'react';

const DESIGN_W = 2160;
const DESIGN_H = 3840;

function compute() {
  if (typeof window === 'undefined') return 1;
  // No artificial margin — at the production 2160×3840 viewport the kiosk
  // fills the screen exactly (scale = 1). On any smaller window we scale
  // down to fit and let the body's dark wash show around.
  return Math.min(1, window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
}

export default function useKioskScale() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.setProperty('--kiosk-scale', String(compute()));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--kiosk-scale');
    };
  }, []);
}
