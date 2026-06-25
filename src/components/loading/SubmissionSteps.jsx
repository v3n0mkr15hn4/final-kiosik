import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../AccessibilityProvider';

// Screen 04's 3-row done/active/todo step list. Elderly mode collapses to a
// single large-text line per the spec ("remove the step list... just show
// 'Your request is being submitted' in large text").
export default function SubmissionSteps({ step, labels }) {
  const { t } = useTranslation();
  const { userMode } = useAccessibility();

  if (userMode === 'elderly') {
    return (
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', textAlign: 'center' }}>
        {t('loading.submittingElderly', 'Your request is being submitted')}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
      {labels.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isDone && (
              <span
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: 'var(--ok)',
                  color: 'white', display: 'grid', placeItems: 'center', fontSize: 14,
                  fontWeight: 700, flexShrink: 0,
                }}
              >
                ✓
              </span>
            )}
            {isActive && (
              <span
                style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  border: '3px solid var(--indigo-100)', borderTopColor: 'var(--indigo-700)',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            )}
            {!isDone && !isActive && (
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--line)', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 15, color: 'var(--ink-700)' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
