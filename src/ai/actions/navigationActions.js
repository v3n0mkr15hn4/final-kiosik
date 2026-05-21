/**
 * navigationActions.js — Voice Navigation Action Handler
 * Routes the AI NAVIGATE_PAGE action to react-router.
 */

export const PAGE_ROUTES = {
  home:           '/home',
  electricity:    '/electricity-menu',
  gas:            '/gas-menu',
  water:          '/water',
  sanitation:     '/sanitation',
  municipal:      '/municipal-menu',
  transport:      '/transport',
  healthcare:     '/healthcare',
  complaints:     '/complaints',
  'track-status': '/track-status',
  schemes:        '/schemes',
  dashboard:      '/dashboard',
  login:          '/login',
  'office-locator': '/office-locator',
};

/**
 * Navigate to a service page by name or path.
 * @param {Function} navigate   - react-router navigate()
 * @param {string}   target     - route path or service name
 */
export function navigateToPage(navigate, target) {
  if (!navigate || !target) return;
  const path = target.startsWith('/') ? target : (PAGE_ROUTES[target] || '/home');
  navigate(path);
}

/**
 * Navigate back.
 */
export function navigateBack(navigate) {
  navigate?.(-1);
}

/**
 * Navigate to office locator with a pre-selected category.
 * Dispatches a custom event that the OfficeLocator page listens to.
 */
export function navigateToOfficeLocator(navigate, category) {
  navigate?.('/office-locator');
  if (category) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('suvidha:ai-office-search', {
        detail: { category },
      }));
    }, 600);
  }
}

export default { navigateToPage, navigateBack, navigateToOfficeLocator, PAGE_ROUTES };
