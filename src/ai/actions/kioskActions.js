/**
 * kioskActions.js — Kiosk-level Action Handlers
 * Executes safe UI actions dispatched by the AI intent router.
 */

/**
 * Read the main content of the current page aloud.
 * Selects key elements and synthesises them in order.
 * @param {Function} speakFn - TTS speak function
 * @param {string} language
 */
export function readCurrentPage(speakFn, language = 'en') {
  const selectors = [
    'h1', 'h2',
    '[data-voice-read]',
    '.page-description',
    'main p:first-of-type',
    'form label',
  ];

  const texts = [];
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 3 && !texts.includes(text)) {
        texts.push(text);
      }
    });
  }

  const combined = texts.slice(0, 8).join('. ');
  if (combined && speakFn) {
    speakFn(combined || 'No content found on this page.', { language, interrupt: true });
  }
  return combined;
}

/**
 * Scroll the page in a given direction.
 * @param {'up'|'down'|'top'|'bottom'} direction
 */
export function scrollPage(direction = 'down') {
  const actions = {
    down:   () => window.scrollBy({ top: 350, behavior: 'smooth' }),
    up:     () => window.scrollBy({ top: -350, behavior: 'smooth' }),
    top:    () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    bottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
  };
  actions[direction]?.();
}

/**
 * Zoom the browser (adjusts font-size on root element).
 * Used for accessibility — enlarges text for elderly users.
 * @param {'in'|'out'|'reset'} direction
 */
export function zoomContent(direction = 'in') {
  const root = document.documentElement;
  const current = parseFloat(root.style.fontSize) || 16;
  const step = 2;
  const min = 12;
  const max = 26;

  let next = current;
  if (direction === 'in')    next = Math.min(current + step, max);
  if (direction === 'out')   next = Math.max(current - step, min);
  if (direction === 'reset') next = 16;

  root.style.fontSize = `${next}px`;
  sessionStorage.setItem('kioskFontSize', next);
}

/**
 * Apply saved font-size on page load.
 */
export function applySavedZoom() {
  const saved = sessionStorage.getItem('kioskFontSize');
  if (saved) document.documentElement.style.fontSize = `${saved}px`;
}

/**
 * Highlight / focus an element by selector or data-voice-field attribute.
 * @param {string} fieldName
 */
export function focusField(fieldName) {
  const el =
    document.querySelector(`[data-voice-field="${fieldName}"]`) ||
    document.querySelector(`[name="${fieldName}"]`) ||
    document.getElementById(fieldName);
  if (el) {
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.outline = '3px solid #3b82f6';
    setTimeout(() => { el.style.outline = ''; }, 2000);
  }
}

export default { readCurrentPage, scrollPage, zoomContent, applySavedZoom, focusField };
