// ──────────────────────────────────────────────────────────────────
// VoiceModeSelection — onboarding Step 3 (after language is chosen)
// Uses the shared 2160×3840 portrait kiosk shell.
// Voice is opt-in: only "Enable Voice Mode" sets voiceEnabled = true.
// The first TTS prompt + STT loop start on the dashboard (one place, guarded).
// ──────────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { VK } from '../components/kiosk';

export default function VoiceModeSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setVoiceEnabled } = useSession();

  const enableVoice = () => {
    setVoiceEnabled(true);   // dashboard mount speaks the single welcome + starts STT
    navigate('/home');
  };

  const continueSilent = () => {
    setVoiceEnabled(false);  // no speak(), no STT for the rest of the session
    navigate('/home');
  };

  return (
    <VK bg="var(--cream)" showStatus={false}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <h1 className="h2" style={styles.title}>{t('voiceMode.title', 'Would you like voice assistance?')}</h1>
          <p className="body-l" style={styles.subtitle}>{t('voiceMode.subtitle', 'You can listen and speak, or continue using touch only.')}</p>
        </header>

        <div style={styles.cards}>
          <button type="button" onClick={enableVoice} style={{ ...styles.card, ...styles.cardEnable }} aria-label={t('voiceMode.enable', 'Enable Voice Mode')}>
            <Volume2 size={160} />
            <span style={styles.cardLabel}>{t('voiceMode.enable', 'Enable Voice Mode')}</span>
            <span style={styles.cardDesc}>{t('voiceMode.enableDesc', 'Hear prompts and speak your requests')}</span>
          </button>

          <button type="button" onClick={continueSilent} style={{ ...styles.card, ...styles.cardSilent }} aria-label={t('voiceMode.silent', 'Continue Without Voice')}>
            <VolumeX size={160} />
            <span style={styles.cardLabel}>{t('voiceMode.silent', 'Continue Without Voice')}</span>
            <span style={styles.cardDesc}>{t('voiceMode.silentDesc', 'Use touch and on-screen options only')}</span>
          </button>
        </div>
      </div>
    </VK>
  );
}

const styles = {
  inner: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    padding: '220px 0 120px', boxSizing: 'border-box',
  },
  header: { textAlign: 'center', marginBottom: 140, flexShrink: 0 },
  title: { color: 'var(--indigo-900, #1e1b4b)', margin: 0 },
  subtitle: { color: 'var(--ink-700, #374151)', marginTop: 28 },
  cards: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, minHeight: 0 },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 48, minHeight: 900, borderRadius: 40, cursor: 'pointer',
    border: '4px solid transparent', boxShadow: 'var(--shadow-2, 0 20px 60px rgba(0,0,0,0.12))',
    touchAction: 'manipulation', padding: 72,
  },
  cardEnable: { background: 'var(--indigo-700, #4338ca)', color: 'white' },
  cardSilent: { background: 'white', color: 'var(--indigo-900, #1e1b4b)', borderColor: 'var(--indigo-300, #a5b4fc)' },
  cardLabel: { fontSize: 64, fontWeight: 800, textAlign: 'center' },
  cardDesc: { fontSize: 36, lineHeight: 1.4, opacity: 0.85, textAlign: 'center' },
};
