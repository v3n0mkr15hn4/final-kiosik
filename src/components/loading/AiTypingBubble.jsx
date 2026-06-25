import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../AccessibilityProvider';

// Screen 07's 3-dot typing bubble + "Suvidha is thinking…" caption.
export default function AiTypingBubble() {
  const { t } = useTranslation();
  const { reducedMotion } = useAccessibility();

  const dot = (delay) => ({
    width: 9, height: 9, borderRadius: '50%', background: 'var(--ink-500)',
    animation: reducedMotion ? 'none' : `typingDot 1.3s ease-in-out infinite ${delay}`,
    opacity: reducedMotion ? 0.6 : undefined,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <div
        style={{
          background: 'var(--surface-0)', border: '1px solid var(--line)',
          borderRadius: '18px 18px 18px 4px', padding: '18px 20px',
          display: 'flex', gap: 7, alignItems: 'center',
        }}
      >
        <span style={dot('0s')} />
        <span style={dot('0.2s')} />
        <span style={dot('0.4s')} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-500)', paddingLeft: 6 }}>
        {t('loading.aiThinking', 'Suvidha is thinking…')}
      </div>
    </div>
  );
}
