import { useAppStore } from '@/stores';

/**
 * Navigate to a specific route and update URL
 * @param route - The route to navigate to
 */
export const navigateTo = (route: string): void => {
	const { setRoute, allowedRoutes } = useAppStore.getState();
	
	if (allowedRoutes.includes(route)) {
		console.log(`[Router] Navigating to: ${route}`);
		setRoute(route);
		// URL will be updated automatically by useUrlRouter hook
	} else {
		console.warn(`[Router] Route "${route}" is not allowed!`);
	}
};

/**
 * Get current route from URL query parameters
 * @returns The current route from URL or null if not found
 */
export const getCurrentRouteFromUrl = (): string | null => {
	if (typeof window === 'undefined') return null;
	
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('router');
};

/**
 * Check if a route is valid (exists in allowed routes)
 * @param route - The route to validate
 * @returns True if route is valid, false otherwise
 */
export const isValidRoute = (route: string): boolean => {
	const { allowedRoutes } = useAppStore.getState();
	return allowedRoutes.includes(route);
};

/**
 * Force sync URL with current store route
 * Useful for direct link navigation scenarios
 */
export const syncUrlWithStore = (): void => {
	const { currentRoute } = useAppStore.getState();
	const urlRoute = getCurrentRouteFromUrl();
	
	if (urlRoute !== currentRoute) {
		console.log(`[Router] Syncing URL with store: ${currentRoute}`);
		const url = new URL(window.location.href);
		url.searchParams.set('router', currentRoute);
		window.history.replaceState({}, '', url.toString());
	}
};

/**
 * Initialize routing from URL on app startup
 * Should be called once when the app loads
 */
export const initializeFromUrl = (): void => {
	const urlRoute = getCurrentRouteFromUrl();
	const { setRoute, allowedRoutes } = useAppStore.getState();
	
	console.log(`[Router] Initializing from URL: ${urlRoute}, allowedRoutes:`, allowedRoutes);
	
	// Wait for store to be fully initialized
	if (!allowedRoutes || allowedRoutes.length === 0) {
		console.log('[Router] Store not ready yet, retrying...');
		setTimeout(() => initializeFromUrl(), 100);
		return;
	}
	
	if (urlRoute && allowedRoutes.includes(urlRoute)) {
		console.log(`[Router] Initializing from URL: ${urlRoute}`);
		setRoute(urlRoute);
	} else if (urlRoute && !allowedRoutes.includes(urlRoute)) {
		console.warn(`[Router] Invalid route in URL: ${urlRoute} - redirecting to welcome`);
		const url = new URL(window.location.href);
		url.searchParams.set('router', 'welcome');
		window.history.replaceState({}, '', url.toString());
		setRoute('welcome');
	}
};
