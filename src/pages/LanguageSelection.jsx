// ──────────────────────────────────────────────────────────────────
// LanguageSelection — onboarding Step 2 (runs right after citizen login)
// Uses the shared 2160×3840 portrait kiosk shell.
// Sets the session language (immutable for the rest of the session).
// Plays NO voice — voice is opt-in on the next step.
// ──────────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguageSafe } from '../i18n';
import { useSession } from '../context/SessionContext';
import { VK } from '../components/kiosk';
import { INDIAN_LANGUAGES } from '../i18n/languageCodes';
import { getSarvamLangCode } from '../utils/languageConfig';

const RTL_LANGS = ['ur', 'ks', 'sd'];

// ui = i18next code, sarvam = Sarvam language code stored in session, native = label
const LANGS = INDIAN_LANGUAGES.map((l) => ({
  ui: l.code,
  sarvam: getSarvamLangCode(l.code),
  native: l.native,
  rtl: l.rtl,
}));

export default function LanguageSelection() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setLanguage } = useSession();
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().split('-')[0];
  const headingDirection = RTL_LANGS.includes(activeLanguage) ? 'rtl' : 'ltr';

  const handlePick = async (lang) => {
    setLanguage(lang.sarvam);           // session language (drives TTS speaker + STT)
    try { await changeLanguageSafe(lang.ui); } catch { /* UI strings best-effort */ }
    sessionStorage.setItem('userLanguage', lang.ui);
    document.documentElement.lang = lang.ui;
    navigate('/voice-select');
  };

  return (
    <VK bg="var(--cream)" showStatus={false}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <h1 className="h2" style={{ ...styles.title, direction: headingDirection }}>
            {t('language.selectionTitle')}
          </h1>
        </header>

        <div style={styles.grid}>
          {LANGS.map((lang) => (
            <button
              key={lang.sarvam}
              type="button"
              onClick={() => handlePick(lang)}
              style={{ ...styles.card, direction: lang.rtl ? 'rtl' : 'ltr' }}
              aria-label={`Select ${lang.native}`}
            >
              {lang.native}
            </button>
          ))}
        </div>
      </div>
    </VK>
  );
}

const styles = {
  inner: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    padding: '120px 0 40px', boxSizing: 'border-box',
  },
  header: { textAlign: 'center', marginBottom: 96, flexShrink: 0 },
  title: { color: 'var(--indigo-900, #1e1b4b)', margin: 0, fontFamily: 'var(--font-multi, inherit)' },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridAutoRows: 'minmax(180px, auto)',
    gap: 28,
    minHeight: 0,
    overflowY: 'auto',
  },
  card: {
    minHeight: 180,
    border: '2px solid var(--indigo-300, #a5b4fc)',
    borderRadius: 32,
    background: 'white',
    color: 'var(--indigo-900, #1e1b4b)',
    fontSize: 48,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-multi, inherit)',
    boxShadow: 'var(--shadow-1, 0 10px 30px rgba(0,0,0,0.08))',
    touchAction: 'manipulation',
  },
};
