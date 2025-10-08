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
		
		console.log('[StorageCleaner] localStorage cleared:', keys.length, 'items');
	} catch (error) {
		console.error('[StorageCleaner] Error clearing localStorage:', error);
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
		
		console.log('[StorageCleaner] sessionStorage cleared:', keys.length, 'items');
	} catch (error) {
		console.error('[StorageCleaner] Error clearing sessionStorage:', error);
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
				'wallet-store',
				'gliesereum-wallet',
				'web3-app',
				'zustand-store',
				'vite-plugin-pwa-cache'
			];

			// Try to delete each database
			for (const dbName of possibleDatabases) {
				try {
					const deleteReq = indexedDB.deleteDatabase(dbName);
					await new Promise<void>((resolve) => {
						deleteReq.onsuccess = () => {
							console.log('[StorageCleaner] IndexedDB database deleted:', dbName);
							resolve();
						};
						deleteReq.onerror = () => {
							console.log('[StorageCleaner] IndexedDB database not found:', dbName);
							resolve(); // Not an error if database doesn't exist
						};
						deleteReq.onblocked = () => {
							console.warn('[StorageCleaner] IndexedDB deletion blocked:', dbName);
							resolve(); // Continue anyway
						};
					});
				} catch (error) {
					console.log('[StorageCleaner] IndexedDB database deletion failed:', dbName, error);
				}
			}
		}
	} catch (error) {
		console.error('[StorageCleaner] Error clearing IndexedDB:', error);
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
		
		console.log('[StorageCleaner] Cookies cleared:', cookies.length, 'items');
	} catch (error) {
		console.error('[StorageCleaner] Error clearing cookies:', error);
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
				cacheNames.map(cacheName => {
					console.log('[StorageCleaner] Deleting cache:', cacheName);
					return caches.delete(cacheName);
				})
			);
			
			console.log('[StorageCleaner] Cache storage cleared:', cacheNames.length, 'caches');
		}
	} catch (error) {
		console.error('[StorageCleaner] Error clearing cache storage:', error);
	}
};

/**
 * Clear WebSQL (legacy, but just in case)
 */
export const clearWebSQL = (): void => {
	try {
		if ('openDatabase' in window) {
			// WebSQL is deprecated but some old browsers might still have it
			console.log('[StorageCleaner] WebSQL detected but not cleared (deprecated)');
		}
	} catch (error) {
		console.log('[StorageCleaner] WebSQL not available');
	}
};

/**
 * Clear application-specific storage keys
 */
export const clearAppSpecificStorage = (): void => {
	try {
		const appKeys = [
			'auth-store',
			'private-store',
			'_g',
			'wallet-store',
			'app-store',
			'panel-store',
			'Canvas-ui-store',
			'worker-store',
			'gliesereum-wallet',
			'web3-session',
			'user-preferences',
			'app-settings',
			'connection-data',
			'network-config',
			'wallet-data'
		];

		// Clear from localStorage
		appKeys.forEach(key => {
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
				console.log('[StorageCleaner] Removed localStorage key:', key);
			}
		});

		// Clear from sessionStorage
		appKeys.forEach(key => {
			if (sessionStorage.getItem(key)) {
				sessionStorage.removeItem(key);
				console.log('[StorageCleaner] Removed sessionStorage key:', key);
			}
		});

		console.log('[StorageCleaner] App-specific storage cleared');
	} catch (error) {
		console.error('[StorageCleaner] Error clearing app-specific storage:', error);
	}
};

/**
 * Comprehensive storage cleaner - clears ALL storage mechanisms
 */
export const clearAllStorage = async (): Promise<void> => {
	console.log('[StorageCleaner] Starting comprehensive storage cleanup...');
	
	try {
		// Clear all storage mechanisms in parallel
		await Promise.all([
			// Clear traditional storage
			Promise.resolve(clearLocalStorage()),
			Promise.resolve(clearSessionStorage()),
			Promise.resolve(clearAppSpecificStorage()),
			
			// Clear modern storage
			clearIndexedDB(),
			clearCacheStorage(),
			
			// Clear cookies
			Promise.resolve(clearCookies()),
			Promise.resolve(clearWebSQL())
		]);
		
		console.log('[StorageCleaner] ✅ All storage mechanisms cleared successfully');
		
		// Verify cleanup
		const remainingLocalStorage = Object.keys(localStorage).length;
		const remainingSessionStorage = Object.keys(sessionStorage).length;
		
		console.log('[StorageCleaner] Verification:');
		console.log('- localStorage items remaining:', remainingLocalStorage);
		console.log('- sessionStorage items remaining:', remainingSessionStorage);
		
		if (remainingLocalStorage === 0 && remainingSessionStorage === 0) {
			console.log('[StorageCleaner] ✅ Storage cleanup verified - all data cleared');
		} else {
			console.warn('[StorageCleaner] ⚠️ Some storage items remain:', {
				localStorage: remainingLocalStorage,
				sessionStorage: remainingSessionStorage
			});
		}
		
	} catch (error) {
		console.error('[StorageCleaner] ❌ Error during storage cleanup:', error);
		throw error;
	}
};

/**
 * Quick storage cleaner - clears only app-specific data
 */
export const clearAppStorage = (): void => {
	console.log('[StorageCleaner] Starting app-specific storage cleanup...');
	
	try {
		clearAppSpecificStorage();
		clearLocalStorage();
		clearSessionStorage();
		
		console.log('[StorageCleaner] ✅ App storage cleared');
	} catch (error) {
		console.error('[StorageCleaner] ❌ Error clearing app storage:', error);
		throw error;
	}
};
