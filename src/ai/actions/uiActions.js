/**
 * uiActions.js — UI State Actions
 * Handles UI-level AI actions: language switching, toast notifications, highlights.
 */

/**
 * Switch the kiosk UI language.
 * Fires a custom event that i18n and the language selector listens to.
 * @param {string} langCode - 'hi', 'ta', 'en', etc.
 */
export function switchLanguage(langCode) {
  if (!langCode) return;
  const base = langCode.split('-')[0].toLowerCase();
  window.dispatchEvent(new CustomEvent('suvidha:switch-language', { detail: { language: base } }));
  localStorage.setItem('i18nextLng', base);
  sessionStorage.setItem('suvidha_language', base);
}

/**
 * Show a toast notification (uses the app's ToastContext via custom event).
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 */
export function showToast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('suvidha:toast', { detail: { message, type } }));
}

/**
 * Highlight a section of the UI to draw user attention.
 * @param {string} selector - CSS selector for the element
 */
export function highlightElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.outline = '3px solid #6366f1';
  el.style.boxShadow = '0 0 0 6px rgba(99,102,241,0.2)';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    el.style.outline = '';
    el.style.boxShadow = '';
  }, 3000);
}

/**
 * Enter/exit fullscreen mode (for kiosk accessibility).
 */
export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export default { switchLanguage, showToast, highlightElement, toggleFullscreen };
