import { useEffect } from 'react';
import { useAppStore } from '@/stores';

/**
 * Hook for synchronizing application routing with URL query parameters
 * Reads the 'router' query parameter and syncs it with the app store
 */
export const useUrlRouter = (): void => {
	const { currentRoute, setRoute, allowedRoutes } = useAppStore();

	useEffect(() => {
		// Function to get router parameter from URL
		const getRouterFromUrl = (): string | null => {
			const urlParams = new URLSearchParams(window.location.search);
			return urlParams.get('router');
		};

		// Function to update URL with router parameter
		const updateUrl = (route: string): void => {
			const url = new URL(window.location.href);
			url.searchParams.set('router', route);
			window.history.replaceState({}, '', url.toString());
		};

		// Initialize route from URL on mount
		const urlRouter = getRouterFromUrl();
		if (urlRouter && allowedRoutes.includes(urlRouter)) {
			setRoute(urlRouter);
		} else if (urlRouter && !allowedRoutes.includes(urlRouter)) {
			// If invalid route in URL, redirect to welcome
			updateUrl('welcome');
			setRoute('welcome');
		} else if (!urlRouter && currentRoute !== 'welcome') {
			// If no router parameter but we have a route, update URL
			updateUrl(currentRoute);
		}

		// Listen for popstate events (browser back/forward)
		const handlePopState = (): void => {
			const urlRouter = getRouterFromUrl();
			if (urlRouter && allowedRoutes.includes(urlRouter)) {
				setRoute(urlRouter);
			} else if (urlRouter && !allowedRoutes.includes(urlRouter)) {
				updateUrl('welcome');
				setRoute('welcome');
			}
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [allowedRoutes, setRoute]);

	// Update URL when route changes in store
	useEffect(() => {
		const updateUrl = (route: string): void => {
			const url = new URL(window.location.href);
			url.searchParams.set('router', route);
			window.history.replaceState({}, '', url.toString());
		};

		updateUrl(currentRoute);
	}, [currentRoute]);
};
