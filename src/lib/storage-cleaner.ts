/**
 * Comprehensive storage cleaner utility
 * Clears all possible storage mechanisms used by the application
 */

/**
 * Clear all localStorage data
 */
export const clearLocalStorage = (): void => {
	try {
		// Get all keys
		const keys = Object.keys(localStorage);
		
		// Clear all keys
		keys.forEach(key => {
			localStorage.removeItem(key);
		});

	} catch {
			// Error handled silently
		}
};

/**
 * Clear all sessionStorage data
 */
export const clearSessionStorage = (): void => {
	try {
		// Get all keys
		const keys = Object.keys(sessionStorage);
		
		// Clear all keys
		keys.forEach(key => {
			sessionStorage.removeItem(key);
		});

	} catch {
			// Error handled silently
		}
};

/**
 * Clear IndexedDB data (if available)
 */
export const clearIndexedDB = async (): Promise<void> => {
	try {
		if ('indexedDB' in window) {
			// List of possible IndexedDB databases used by the app
			const possibleDatabases = [
				'auth-store',
				'private-store',
				'Wallet-store',
				'gliesereum-Wallet',
				'web3-app',
				'zustand-store',
				'vite-plugin-pwa-cache',
				'schemas-db', // Schemas application database
				'schemasDB', // Alternative schemas database name
				'accounts-store',
				'app-store',
				'panel-store',
				'Canvas-ui-store',
				'worker-store',
				'open-apps-store',
				'market-store',
				'wallet-store',
				'network-store',
			];

			// Try to delete each database
			for (const dbName of possibleDatabases) {
				try {
					const deleteReq = indexedDB.deleteDatabase(dbName);
					await new Promise<void>((resolve) => {
						deleteReq.onsuccess = () => {

							resolve();
						};
						deleteReq.onerror = () => {

							resolve(); // Not an error if database doesn't exist
						};
						deleteReq.onblocked = () => {

							resolve(); // Continue anyway
						};
					});
				} catch {
			// Error handled silently
		}
			}

		}
	} catch {
			// Error handled silently
		}
};

/**
 * Clear all cookies (if possible)
 */
export const clearCookies = (): void => {
	try {
		// Get all cookies
		const cookies = document.cookie.split(';');
		
		// Clear each cookie
		cookies.forEach(cookie => {
			const eqPos = cookie.indexOf('=');
			const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
			
			// Clear cookie for current domain
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
		});

	} catch {
			// Error handled silently
		}
};

/**
 * Clear cache storage (Service Worker cache)
 */
export const clearCacheStorage = async (): Promise<void> => {
	try {
		if ('caches' in window) {
			// Get all cache names
			const cacheNames = await caches.keys();

			// Delete each cache
			await Promise.all(
				cacheNames.map(async cacheName => {

					const deleted = await caches.delete(cacheName);
					if (deleted) {
						// Cache deleted
					}
					return deleted;
				})
			);

		}
	} catch {
			// Error handled silently
		}
};

/**
 * Unregister all Service Workers
 */
export const unregisterServiceWorkers = async (): Promise<void> => {
	try {
		if ('serviceWorker' in navigator) {
			const registrations = await navigator.serviceWorker.getRegistrations();

			await Promise.all(
				registrations.map(async (registration) => {

					const unregistered = await registration.unregister();
					if (unregistered) {
						// Service worker unregistered
					}
					return unregistered;
				})
			);

		}
	} catch {
			// Error handled silently
		}
};

/**
 * Clear WebSQL (legacy, but just in case)
 */
export const clearWebSQL = (): void => {
	try {
		if ('openDatabase' in window) {
			// WebSQL is deprecated but some old browsers might still have it

		}
	} catch {
			// Error handled silently
		}
};

/**
 * Clear application-specific storage keys
 */
export const clearAppSpecificStorage = (): void => {
	try {
		const appKeys = [
			// Auth & Wallet
			'auth-store',
			'private-store',
			'_g',
			'Wallet-store',
			'gliesereum-Wallet',
			'web3-session',
			'connection-data',
			'network-config',
			'Wallet-data',
			
			// App State
			'app-store',
			'panel-store',
			'Canvas-ui-store',
			'worker-store',
			'user-preferences',
			'app-settings',
			'accounts-store',
			'open-apps-store',
			
			// Session & Version
			'app-session-id',
			'app-last-version',
			'schemas-cache-version',
			
			// Theme
			'theme-store',
			
			// Token Builder
			'token-builder-store',
		];

		// Clear from localStorage
		appKeys.forEach(key => {
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
			}
		});

		// Clear from sessionStorage
		appKeys.forEach(key => {
			if (sessionStorage.getItem(key)) {
				sessionStorage.removeItem(key);
			}
		});

	} catch {
			// Error handled silently
		}
};

/**
 * Comprehensive storage cleaner - clears ALL storage mechanisms
 */
export const clearAllStorage = async (): Promise<void> => {

	try {
		// Step 1: Clear app-specific storage first

		clearAppSpecificStorage();
		
		// Step 2: Clear all localStorage

		clearLocalStorage();
		
		// Step 3: Clear all sessionStorage

		clearSessionStorage();
		
		// Step 4: Clear IndexedDB

		await clearIndexedDB();
		
		// Step 5: Clear Service Worker caches

		await clearCacheStorage();
		
		// Step 6: Unregister Service Workers

		await unregisterServiceWorkers();
		
		// Step 7: Clear cookies

		clearCookies();
		
		// Step 8: Clear WebSQL (if available)

		clearWebSQL();

		// Verify cleanup
		const remainingLocalStorage = Object.keys(localStorage).length;
		const remainingSessionStorage = Object.keys(sessionStorage).length;

		if (remainingLocalStorage === 0 && remainingSessionStorage === 0) {
			// All storage cleared
		} else {
			// Empty block
		}

	} catch {

		throw error;
	}
};

/**
 * Quick storage cleaner - clears only app-specific data
 */
export const clearAppStorage = (): void => {

	try {
		clearAppSpecificStorage();
		clearLocalStorage();
		clearSessionStorage();

	} catch {

		throw error;
	}
};
