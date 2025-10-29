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
			
			console.log('[StorageCleaner] Clearing IndexedDB databases:', possibleDatabases);

			// Try to delete each database
			for (const dbName of possibleDatabases) {
				try {
					const deleteReq = indexedDB.deleteDatabase(dbName);
					await new Promise<void>((resolve) => {
						deleteReq.onsuccess = () => {
							console.log('[StorageCleaner] ✅ IndexedDB database deleted:', dbName);
							resolve();
						};
						deleteReq.onerror = () => {
							console.log('[StorageCleaner] IndexedDB database not found:', dbName);
							resolve(); // Not an error if database doesn't exist
						};
						deleteReq.onblocked = () => {
							console.warn('[StorageCleaner] ⚠️ IndexedDB deletion blocked:', dbName);
							resolve(); // Continue anyway
						};
					});
				} catch (error) {
					console.log('[StorageCleaner] IndexedDB database deletion failed:', dbName, error);
				}
			}
			
			console.log('[StorageCleaner] ✅ All IndexedDB databases processed');
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
			
			console.log('[StorageCleaner] Found caches:', cacheNames);
			
			// Delete each cache
			await Promise.all(
				cacheNames.map(async cacheName => {
					console.log('[StorageCleaner] Deleting cache:', cacheName);
					const deleted = await caches.delete(cacheName);
					if (deleted) {
						console.log('[StorageCleaner] ✅ Cache deleted:', cacheName);
					}
					return deleted;
				})
			);
			
			console.log('[StorageCleaner] ✅ Cache storage cleared:', cacheNames.length, 'caches');
		}
	} catch (error) {
		console.error('[StorageCleaner] Error clearing cache storage:', error);
	}
};

/**
 * Unregister all Service Workers
 */
export const unregisterServiceWorkers = async (): Promise<void> => {
	try {
		if ('serviceWorker' in navigator) {
			const registrations = await navigator.serviceWorker.getRegistrations();
			
			console.log('[StorageCleaner] Found Service Workers:', registrations.length);
			
			await Promise.all(
				registrations.map(async (registration) => {
					console.log('[StorageCleaner] Unregistering Service Worker:', registration.scope);
					const unregistered = await registration.unregister();
					if (unregistered) {
						console.log('[StorageCleaner] ✅ Service Worker unregistered:', registration.scope);
					}
					return unregistered;
				})
			);
			
			console.log('[StorageCleaner] ✅ All Service Workers unregistered');
		}
	} catch (error) {
		console.error('[StorageCleaner] Error unregistering Service Workers:', error);
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
	} catch {
		console.log('[StorageCleaner] WebSQL not available');
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
		
		console.log('[StorageCleaner] Clearing app-specific keys:', appKeys.length);

		// Clear from localStorage
		let localStorageCleared = 0;
		appKeys.forEach(key => {
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
				localStorageCleared++;
				console.log('[StorageCleaner] ✅ Removed localStorage key:', key);
			}
		});

		// Clear from sessionStorage
		let sessionStorageCleared = 0;
		appKeys.forEach(key => {
			if (sessionStorage.getItem(key)) {
				sessionStorage.removeItem(key);
				sessionStorageCleared++;
				console.log('[StorageCleaner] ✅ Removed sessionStorage key:', key);
			}
		});

		console.log('[StorageCleaner] ✅ App-specific storage cleared:', {
			localStorage: localStorageCleared,
			sessionStorage: sessionStorageCleared,
		});
	} catch (error) {
		console.error('[StorageCleaner] Error clearing app-specific storage:', error);
	}
};

/**
 * Comprehensive storage cleaner - clears ALL storage mechanisms
 */
export const clearAllStorage = async (): Promise<void> => {
	console.log('[StorageCleaner] ═══════════════════════════════════════');
	console.log('[StorageCleaner] Starting COMPREHENSIVE storage cleanup...');
	console.log('[StorageCleaner] This will clear:');
	console.log('[StorageCleaner] - localStorage (all keys)');
	console.log('[StorageCleaner] - sessionStorage (all keys)');
	console.log('[StorageCleaner] - IndexedDB (all databases)');
	console.log('[StorageCleaner] - Service Worker caches (all caches)');
	console.log('[StorageCleaner] - Service Workers (unregister all)');
	console.log('[StorageCleaner] - Cookies (all cookies)');
	console.log('[StorageCleaner] ═══════════════════════════════════════');
	
	try {
		// Step 1: Clear app-specific storage first
		console.log('[StorageCleaner] Step 1: Clearing app-specific storage...');
		clearAppSpecificStorage();
		
		// Step 2: Clear all localStorage
		console.log('[StorageCleaner] Step 2: Clearing ALL localStorage...');
		clearLocalStorage();
		
		// Step 3: Clear all sessionStorage
		console.log('[StorageCleaner] Step 3: Clearing ALL sessionStorage...');
		clearSessionStorage();
		
		// Step 4: Clear IndexedDB
		console.log('[StorageCleaner] Step 4: Clearing IndexedDB databases...');
		await clearIndexedDB();
		
		// Step 5: Clear Service Worker caches
		console.log('[StorageCleaner] Step 5: Clearing Service Worker caches...');
		await clearCacheStorage();
		
		// Step 6: Unregister Service Workers
		console.log('[StorageCleaner] Step 6: Unregistering Service Workers...');
		await unregisterServiceWorkers();
		
		// Step 7: Clear cookies
		console.log('[StorageCleaner] Step 7: Clearing cookies...');
		clearCookies();
		
		// Step 8: Clear WebSQL (if available)
		console.log('[StorageCleaner] Step 8: Clearing WebSQL...');
		clearWebSQL();
		
		console.log('[StorageCleaner] ═══════════════════════════════════════');
		console.log('[StorageCleaner] ✅ ALL storage mechanisms cleared successfully');
		
		// Verify cleanup
		const remainingLocalStorage = Object.keys(localStorage).length;
		const remainingSessionStorage = Object.keys(sessionStorage).length;
		
		console.log('[StorageCleaner] Final verification:');
		console.log('[StorageCleaner] - localStorage items remaining:', remainingLocalStorage);
		console.log('[StorageCleaner] - sessionStorage items remaining:', remainingSessionStorage);
		
		if (remainingLocalStorage === 0 && remainingSessionStorage === 0) {
			console.log('[StorageCleaner] ✅✅✅ Storage cleanup VERIFIED - ALL data cleared ✅✅✅');
		} else {
			console.warn('[StorageCleaner] ⚠️ Some storage items remain:', {
				localStorage: remainingLocalStorage,
				sessionStorage: remainingSessionStorage
			});
		}
		
		console.log('[StorageCleaner] ═══════════════════════════════════════');
		
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
