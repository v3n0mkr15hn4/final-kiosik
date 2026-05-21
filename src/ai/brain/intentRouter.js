/**
 * intentRouter.js — Intent-to-Action Router
 *
 * Takes the parsed AI response JSON and routes it to the correct
 * action handler. The frontend executes these actions safely —
 * the LLM never directly mutates state.
 *
 * Supported action types:
 *   NAVIGATE_PAGE, START_NAVIGATION, SHOW_NEARBY, FILL_FORM,
 *   SUBMIT_FORM, SWITCH_LANGUAGE, READ_PAGE, SCROLL_PAGE,
 *   ZOOM_MAP, SEARCH_OFFICES
 */

// ── Sensitive actions that require extra confirmation ─────────────────────

const REQUIRES_CONFIRMATION = new Set([
  'NAVIGATE_PAGE',
  'START_NAVIGATION',
  'SHOW_NEARBY',
  'SEARCH_OFFICES',
  'FILL_FORM',
  'SUBMIT_FORM',
  'SWITCH_LANGUAGE',
  'READ_PAGE',
  'SCROLL_PAGE',
  'ZOOM_MAP',
  'PAY_BILL',
  'DELETE_DATA',
  'ADMIN_ACTION',
]);

// ── Intent-to-page mapping (for navigation fallback) ─────────────────────

const INTENT_TO_PATH = {
  navigate_electricity:    '/electricity-menu',
  navigate_gas:            '/gas-menu',
  navigate_water:          '/water',
  navigate_sanitation:     '/sanitation',
  navigate_municipal:      '/municipal-menu',
  navigate_transport:      '/transport',
  navigate_healthcare:     '/healthcare',
  navigate_complaints:     '/complaints',
  navigate_schemes:        '/schemes',
  navigate_track:          '/track-status',
  navigate_home:           '/home',
  navigate_login:          '/login',
  navigate_office_locator: '/office-locator',
  navigate_dashboard:      '/dashboard',
};

// ── Route the AI response ─────────────────────────────────────────────────

/**
 * Route an AI response to an executable action object.
 *
 * @param {Object} aiResponse   - parsed JSON from NVIDIA NIM
 * @param {Object} routerContext
 * @param {Function} routerContext.navigate      - react-router navigate
 * @param {Function} routerContext.onFormFill    - fill a form field
 * @param {Function} routerContext.onFormSubmit  - submit a form
 * @param {Function} routerContext.onMapAction   - map control
 * @param {Function} routerContext.onLanguageSwitch - switch UI language
 * @param {Function} routerContext.onReadPage    - read page content aloud
 * @param {Function} routerContext.onNearbySearch - show nearby offices
 * @param {Function} routerContext.onConfirmRequired - request confirmation
 * @returns {{ handled: boolean, actionType: string }}
 */
export function routeAction(aiResponse, routerContext) {
  const { action, intent } = aiResponse;
  const ctx = routerContext || {};

  // ── No explicit action — try to infer from intent ────────────────────
  if (!action) {
    // Never auto-navigate from intent inference.
    return { handled: false, actionType: 'NONE' };
  }

  const { type } = action;

  // ── Security gate for sensitive actions ──────────────────────────────
  if (REQUIRES_CONFIRMATION.has(type)) {
    if (ctx.onConfirmRequired) {
      const confirmMessage = aiResponse.response || 'Would you like me to proceed?';
      ctx.onConfirmRequired(action, confirmMessage);
      return { handled: false, actionType: `${type}_PENDING_CONFIRM` };
    }
  }

  // ── Route by action type ─────────────────────────────────────────────
  switch (type) {

    case 'NAVIGATE_PAGE':
      if (action.path && ctx.navigate) {
        ctx.navigate(action.path);
      }
      return { handled: true, actionType: type };

    case 'START_NAVIGATION':
      if (ctx.onMapAction) {
        ctx.navigate?.('/office-locator');
        ctx.onMapAction({
          type: 'START_NAVIGATION',
          category: action.destinationCategory,
          destination: action.destination,
        });
      }
      return { handled: true, actionType: type };

    case 'SHOW_NEARBY':
      if (ctx.onNearbySearch) {
        ctx.navigate?.('/office-locator');
        ctx.onNearbySearch(action.category);
      } else if (ctx.navigate) {
        ctx.navigate('/office-locator');
      }
      return { handled: true, actionType: type };

    case 'SEARCH_OFFICES':
      if (ctx.onNearbySearch) {
        ctx.onNearbySearch(action.query || action.category);
      }
      return { handled: true, actionType: type };

    case 'FILL_FORM':
      if (ctx.onFormFill && action.fieldName && action.value !== undefined) {
        ctx.onFormFill(action.fieldName, action.value);
      }
      return { handled: true, actionType: type };

    case 'SUBMIT_FORM':
      if (ctx.onFormSubmit) {
        ctx.onFormSubmit(action.formId);
      }
      return { handled: true, actionType: type };

    case 'SWITCH_LANGUAGE':
      if (ctx.onLanguageSwitch && action.language) {
        ctx.onLanguageSwitch(action.language);
      }
      return { handled: true, actionType: type };

    case 'READ_PAGE':
      if (ctx.onReadPage) {
        ctx.onReadPage();
      }
      return { handled: true, actionType: type };

    case 'SCROLL_PAGE':
      handleScrollPage(action.direction);
      return { handled: true, actionType: type };

    case 'ZOOM_MAP':
      if (ctx.onMapAction) {
        ctx.onMapAction({ type: 'ZOOM', direction: action.direction });
      }
      return { handled: true, actionType: type };

    default:
      console.warn('[IntentRouter] Unknown action type:', type);
      return { handled: false, actionType: type };
  }
}

// ── Scroll helper ─────────────────────────────────────────────────────────

function handleScrollPage(direction) {
  const scrollMap = {
    down: () => window.scrollBy({ top: 300, behavior: 'smooth' }),
    up:   () => window.scrollBy({ top: -300, behavior: 'smooth' }),
    top:  () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    bottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
  };
  const fn = scrollMap[direction || 'down'];
  if (fn) fn();
}

// ── Intent classification helpers ─────────────────────────────────────────

/**
 * Check if an intent is related to navigation.
 */
export function isNavigationIntent(intent) {
  return intent?.startsWith('navigate_') || intent === 'find_location';
}

/**
 * Check if an intent requires real-time LLM (vs. local handling).
 */
export function requiresLLM(intent) {
  const localIntents = new Set([
    'navigate_home', 'navigate_electricity', 'navigate_gas',
    'navigate_water', 'navigate_municipal', 'navigate_transport',
    'navigate_healthcare', 'navigate_schemes', 'navigate_complaints',
  ]);
  return !localIntents.has(intent);
}

export default { routeAction, isNavigationIntent, requiresLLM, INTENT_TO_PATH };
