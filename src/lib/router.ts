import { useAppStore } from '@/stores';

/**
 * Navigate to a specific route and update URL
 * @param route - The route to navigate to
 */
export const navigateTo = (route: string): void => {
	const { setRoute, allowedRoutes } = useAppStore.getState();
	
	if (allowedRoutes.includes(route)) {
		setRoute(route);
		// URL will be updated automatically by useUrlRouter hook
	} else {
		console.warn(`Route "${route}" is not allowed!`);
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
