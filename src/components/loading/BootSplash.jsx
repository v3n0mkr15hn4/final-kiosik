import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../AccessibilityProvider';
import RadiantLoader from './RadiantLoader';
import { mockDelayRange } from '../../utils/mockDelay';

const SESSION_KEY = 'suvidha-boot-shown';

// Screen 01 — one-time animated boot splash, dark bg, self-draw arcs.
// Mocked ~2.2-2.8s, gated by sessionStorage so it doesn't replay on
// back-navigation to "/" within the same session.
export default function BootSplash() {
  const { t } = useTranslation();
  const { reducedMotion } = useAccessibility();
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    mockDelayRange(2200, 2800).then(() => {
      if (cancelled) return;
      sessionStorage.setItem(SESSION_KEY, 'true');
      setVisible(false);
    });
    return () => { cancelled = true; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--indigo-900)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      }}
    >
      <RadiantLoader variant="draw" size={86} dark />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--cream)' }}>SUVIDHA</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.26em', color: 'color-mix(in oklab, var(--cream) 58%, transparent)', marginTop: 8 }}>
          SMART SERVICE KIOSK
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 7, height: 7, borderRadius: '50%', background: 'var(--cream)',
                animation: reducedMotion ? 'none' : `barPulse 1.2s ease-in-out infinite ${i * 0.2}s`,
                opacity: reducedMotion ? 0.6 : undefined,
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'color-mix(in oklab, var(--cream) 45%, transparent)' }}>
          {t('loading.startingUp', 'STARTING UP')} · v2.4
        </div>
      </div>
    </div>
  );
}
