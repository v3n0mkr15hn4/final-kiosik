// ──────────────────────────────────────────────────────────────────
// LanguageSelection — onboarding Step 2 (runs right after citizen login)
// Uses the shared 2160×3840 portrait kiosk shell.
// Sets the session language (immutable for the rest of the session).
// Plays NO voice — voice is opt-in on the next step.
// ──────────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { changeLanguageSafe } from '../i18n';
import { useSession } from '../context/SessionContext';
import { VK } from '../components/kiosk';

// ui = i18next code, sarvam = Sarvam language code stored in session, native = label
const LANGS = [
  { ui: 'en', sarvam: 'en-IN', native: 'English' },
  { ui: 'hi', sarvam: 'hi-IN', native: 'हिन्दी' },
  { ui: 'ta', sarvam: 'ta-IN', native: 'தமிழ்' },
  { ui: 'te', sarvam: 'te-IN', native: 'తెలుగు' },
  { ui: 'kn', sarvam: 'kn-IN', native: 'ಕನ್ನಡ' },
  { ui: 'ml', sarvam: 'ml-IN', native: 'മലയാളം' },
  { ui: 'bn', sarvam: 'bn-IN', native: 'বাংলা' },
  { ui: 'mr', sarvam: 'mr-IN', native: 'मराठी' },
  { ui: 'gu', sarvam: 'gu-IN', native: 'ગુજરાતી' },
  { ui: 'pa', sarvam: 'pa-IN', native: 'ਪੰਜਾਬੀ' },
  { ui: 'or', sarvam: 'or-IN', native: 'ଓଡ଼ିଆ' },
  { ui: 'as', sarvam: 'as-IN', native: 'অসমীয়া' },
];

export default function LanguageSelection() {
  const navigate = useNavigate();
  const { setLanguage } = useSession();

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
          <h1 className="h2" style={styles.title}>Select Your Language</h1>
          <p className="body-l" style={styles.subtitle}>अपनी भाषा चुनें · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
        </header>

        <div style={styles.grid}>
          {LANGS.map((lang) => (
            <button
              key={lang.sarvam}
              type="button"
              onClick={() => handlePick(lang)}
              style={styles.card}
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
  title: { color: 'var(--indigo-900, #1e1b4b)', margin: 0 },
  subtitle: { color: 'var(--ink-700, #374151)', marginTop: 24 },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(4, minmax(260px, 1fr))',
    gap: 36,
    minHeight: 0,
  },
  card: {
    minHeight: 260,
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
