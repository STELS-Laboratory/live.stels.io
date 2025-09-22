import { useEffect, useState } from 'react';

/**
 * Hook to check if the app has hydrated from localStorage
 */
export function useHydration(): boolean {
	const [hasHydrated, setHasHydrated] = useState(false);

	useEffect(() => {
		// Check if we're in the browser
		if (typeof window !== 'undefined') {
			// Small delay to ensure localStorage is available
			const timer = setTimeout(() => {
				setHasHydrated(true);
			}, 100);

			return () => clearTimeout(timer);
		}
	}, []);

	return hasHydrated;
}
