/**
 * accessibilityActions.js — Accessibility-specific AI Actions
 * Handles actions for elderly, visually impaired, and illiterate users.
 */

/**
 * Activate high-contrast mode for visually impaired users.
 */
export function activateHighContrast() {
  document.documentElement.classList.add('high-contrast');
  sessionStorage.setItem('highContrast', 'true');
}

export function deactivateHighContrast() {
  document.documentElement.classList.remove('high-contrast');
  sessionStorage.removeItem('highContrast');
}

/**
 * Increase / decrease font size for elderly users.
 * @param {'increase'|'decrease'|'reset'} action
 */
export function adjustFontSize(action = 'increase') {
  const root = document.documentElement;
  const current = parseFloat(root.style.fontSize) || 16;
  const step = 2;
  let next = current;
  if (action === 'increase') next = Math.min(current + step, 26);
  if (action === 'decrease') next = Math.max(current - step, 12);
  if (action === 'reset')    next = 16;
  root.style.fontSize = `${next}px`;
  sessionStorage.setItem('kioskFontSize', next);
}

/**
 * Apply saved accessibility settings on page load.
 */
export function applyAccessibilitySettings() {
  const fontSize = sessionStorage.getItem('kioskFontSize');
  if (fontSize) document.documentElement.style.fontSize = `${fontSize}px`;
  if (sessionStorage.getItem('highContrast') === 'true') {
    document.documentElement.classList.add('high-contrast');
  }
}

/**
 * Announce a message to screen readers via the ARIA live region.
 * @param {string} message
 * @param {'polite'|'assertive'} priority
 */
export function announceToScreenReader(message, priority = 'polite') {
  let region = document.getElementById('suvidha-aria-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'suvidha-aria-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(region);
  }
  region.setAttribute('aria-live', priority);
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

/**
 * Enable hands-free / always-on voice mode (for blind users).
 */
export function enableHandsFreeMode() {
  sessionStorage.setItem('voiceNavAlwaysOn', 'true');
  sessionStorage.setItem('userMode', 'blind');
  window.dispatchEvent(new CustomEvent('suvidha:hands-free-enabled'));
}

export function disableHandsFreeMode() {
  sessionStorage.removeItem('voiceNavAlwaysOn');
  sessionStorage.setItem('userMode', 'normal');
  window.dispatchEvent(new CustomEvent('suvidha:hands-free-disabled'));
}

export function isHandsFreeMode() {
  return sessionStorage.getItem('voiceNavAlwaysOn') === 'true';
}

export default {
  activateHighContrast, deactivateHighContrast,
  adjustFontSize, applyAccessibilitySettings,
  announceToScreenReader, enableHandsFreeMode,
  disableHandsFreeMode, isHandsFreeMode,
};
