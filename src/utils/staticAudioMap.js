/**
 * staticAudioMap.js — Pre-recorded MP3 registry for offline TTS Tier 0.
 *
 * Files live at public/audio/{lang}/{category}/{key}.mp3
 * Supported langs: 'en', 'as' (others fall back to 'en')
 *
 * Key naming: flat string matching the filename stem, e.g.
 *   'form_success' → 'form/form_success.mp3'
 */

export const STATIC_AUDIO_LANGS = new Set(['en', 'as']);

export const STATIC_AUDIO_MAP = {
  // ── Aadhaar ───────────────────────────────────────────────────────────────
  aadhaar_camera_denied:    'aadhar/aadhaar_camera_denied.mp3',
  aadhaar_camera_open:      'aadhar/aadhaar_camera_open.mp3',
  aadhaar_camera_ready:     'aadhar/aadhaar_camera_ready.mp3',
  aadhaar_consent_ok:       'aadhar/aadhaar_consent_ok.mp3',
  aadhaar_detected:         'aadhar/aadhaar_detected.mp3',
  aadhaar_ocr_failed:       'aadhar/aadhaar_ocr_failed.mp3',
  aadhaar_qr_fallback:      'aadhar/aadhaar_qr_fallback.mp3',
  // AS-only (no EN equivalent recorded yet — fallback to en will skip these)
  aadhaar_ocr_success:      'aadhar/aadhaar_ocr_success.mp3',
  aadhaar_welcome_fallback: 'aadhar/aadhaar_welcome_fallback.mp3',
  aadhaar_welcome_name:     'aadhar/aadhaar_welcome_name.mp3',

  // ── Actions ───────────────────────────────────────────────────────────────
  action_cancelled_1:       'action/action_cancelled_1.mp3',
  action_cancelled_2:       'action/action_cancelled_2.mp3',
  action_confirmed:         'action/action_confirmed.mp3',

  // ── Ask / Form field prompts ──────────────────────────────────────────────
  ask_shared_address:       'ask-shared/ask_shared_address.mp3',
  ask_shared_city:          'ask-shared/ask_shared_city.mp3',
  ask_shared_confirm:       'ask-shared/ask_shared_confirm.mp3',
  ask_shared_description:   'ask-shared/ask_shared_description.mp3',
  ask_shared_invalid:       'ask-shared/ask_shared_invalid.mp3',
  ask_shared_repeat:        'ask-shared/ask_shared_repeat.mp3',
  ask_shared_skip_ack:      'ask-shared/ask_shared_skip_ack.mp3',
  ask_shared_state:         'ask-shared/ask_shared_state.mp3',
  ask_shared_upload:        'ask-shared/ask_shared_upload.mp3',
  ask_shared_ward:          'ask-shared/ask_shared_ward.mp3',

  // ── Errors ────────────────────────────────────────────────────────────────
  err_ai_unavailable:       'errors/err_ai_unavailable.mp3',
  err_general_1:            'errors/err_general_1.mp3',
  err_general_2:            'errors/err_general_2.mp3',
  err_processing:           'errors/err_processing.mp3',
  err_service_degraded:     'errors/err_service_degraded.mp3',
  fallback_generic_help:    'errors/fallback_generic_help.mp3',

  // ── Form events ───────────────────────────────────────────────────────────
  form_error:               'form/form_error.mp3',
  form_submitting:          'form/form_submitting.mp3',
  form_success:             'form/form_success.mp3',

  // ── Greetings ─────────────────────────────────────────────────────────────
  greet_ai_intro:           'greet/greet_ai_intro.mp3',
  greet_dashboard:          'greet/greet_dashboard.mp3',
  greet_help_hint:          'greet/greet_help_hint.mp3',
  greet_wake:               'greet/greet_wake.mp3',

  // ── Login / Auth ──────────────────────────────────────────────────────────
  login_aadhaar_verified:   'login/login_aadhaar_verified.mp3',
  login_id_not_found:       'login/login_id_not_found.mp3',
  login_invalid_aadhaar:    'login/login_invalid_aadhaar.mp3',
  login_otp_sent:           'login/login_otp_sent.mp3',
  login_otp_sent_full:      'login/login_otp_sent_full.mp3',
  login_success:            'login/login_success.mp3',

  // ── Mode selection ────────────────────────────────────────────────────────
  mode_admin_select:        'mode/mode_admin_select.mp3',
  mode_blind:               'mode/mode_blind.mp3',
  mode_blind_login_hint:    'mode/mode_blind_login_hint.mp3',
  mode_elderly:             'mode/mode_elderly.mp3',
  mode_elderly_select:      'mode/mode_elderly_select.mp3',
  mode_normal:              'mode/mode_normal.mp3',
  mode_normal_select:       'mode/mode_normal_select.mp3',

  // ── Navigation ────────────────────────────────────────────────────────────
  nav_back:                 'nav/nav_back.mp3',
  nav_complaints:           'nav/nav_complaints.mp3',
  nav_electricity:          'nav/nav_electricity.mp3',
  nav_fallback:             'nav/nav_fallback.mp3',
  nav_gas:                  'nav/nav_gas.mp3',
  nav_home:                 'nav/nav_home.mp3',
  nav_login:                'nav/nav_login.mp3',
  nav_municipal:            'nav/nav_municipal.mp3',
  nav_office_locator:       'nav/nav_office_locator.mp3',
  nav_schemes:              'nav/nav_schemes.mp3',
  nav_track:                'nav/nav_track.mp3',
  nav_water:                'nav/nav_water.mp3',

  // ── Network ───────────────────────────────────────────────────────────────
  net_offline:              'network/net_offline.mp3',
  net_restored:             'network/net_restored.mp3',

  // ── Page announcements ────────────────────────────────────────────────────
  page_complaints:          'page/page_complaints.mp3',
  page_electricity:         'page/page_electricity.mp3',
  page_family_profile:      'page/page_family_profile.mp3',
  page_gas:                 'page/page_gas.mp3',
  page_healthcare:          'page/page_healthcare.mp3',
  page_home:                'page/page_home.mp3',
  page_landing:             'page/page_landing.mp3',
  page_login:               'page/page_login.mp3',
  page_mode_select:         'page/page_mode_select.mp3',
  page_municipal:           'page/page_municipal.mp3',
  page_office_locator:      'page/page_office_locator.mp3',
  page_receipt:             'page/page_receipt.mp3',
  page_sanitation:          'page/page_sanitation.mp3',
  page_schemes:             'page/page_schemes.mp3',
  page_track_status:        'page/page_track_status.mp3',
  page_transport:           'page/page_transport.mp3',
  page_water:               'page/page_water.mp3',
};

// Route pathname → static audio key for page announcement
export const ROUTE_STATIC_KEYS = {
  '/':               'page_landing',
  '/login':          'page_login',
  '/mode-select':    'page_mode_select',
  '/home':           'page_home',
  '/electricity':    'page_electricity',
  '/gas':            'page_gas',
  '/water':          'page_water',
  '/sanitation':     'page_sanitation',
  '/municipal':      'page_municipal',
  '/transport':      'page_transport',
  '/healthcare':     'page_healthcare',
  '/complaints':     'page_complaints',
  '/track-status':   'page_track_status',
  '/schemes':        'page_schemes',
  '/office-locator': 'page_office_locator',
  '/family-profile': 'page_family_profile',
  '/receipt':        'page_receipt',
};

/**
 * Resolve a static audio URL for a given language + key.
 * Falls back to 'en' if lang has no pre-recorded files.
 * Returns null if key is unknown.
 *
 * @param {string} lang   - base language code ('en', 'as', 'hi', …)
 * @param {string} key    - key from STATIC_AUDIO_MAP
 * @returns {string|null}
 */
export function getStaticAudioUrl(lang, key) {
  const path = STATIC_AUDIO_MAP[key];
  if (!path) return null;

  const baseLang = (lang || 'en').toLowerCase().split('-')[0];
  const resolvedLang = STATIC_AUDIO_LANGS.has(baseLang) ? baseLang : 'en';

  // AS-only files don't exist in EN — skip rather than 404
  const asOnlyKeys = new Set(['aadhaar_ocr_success', 'aadhaar_welcome_fallback', 'aadhaar_welcome_name']);
  if (resolvedLang === 'en' && asOnlyKeys.has(key)) return null;

  return `/audio/${resolvedLang}/${path}`;
}
