/**
 * Storage Scanner Utility
 * Scans all browser storage mechanisms to identify stored data
 */

export interface StorageItem {
	key: string;
	value: string;
	size: number;
	type: "localStorage" | "sessionStorage";
}

export interface IndexedDBDatabase {
	name: string;
	version: number;
	objectStores: string[];
	estimatedSize: number;
}

export interface CacheInfo {
	name: string;
	estimatedSize: number;
	keys: string[];
}

export interface StorageScanResult {
	localStorage: StorageItem[];
	sessionStorage: StorageItem[];
	indexedDB: IndexedDBDatabase[];
	caches: CacheInfo[];
	cookies: Array<{ name: string; value: string }>;
	totalSize: number;
	hasData: boolean;
}

/**
 * Scan localStorage
 */
export function scanLocalStorage(): StorageItem[] {
	const items: StorageItem[] = [];

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) {
				const value = localStorage.getItem(key) || "";
				items.push({
					key,
					value,
					size: new Blob([value]).size,
					type: "localStorage",
				});
			}
		}
	} catch (error) {
		console.error("[StorageScanner] Error scanning localStorage:", error);
	}

	return items;
}

/**
 * Scan sessionStorage
 */
export function scanSessionStorage(): StorageItem[] {
	const items: StorageItem[] = [];

	try {
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key) {
				const value = sessionStorage.getItem(key) || "";
				items.push({
					key,
					value,
					size: new Blob([value]).size,
					type: "sessionStorage",
				});
			}
		}
	} catch (error) {
		console.error("[StorageScanner] Error scanning sessionStorage:", error);
	}

	return items;
}

/**
 * Scan IndexedDB databases
 */
export async function scanIndexedDB(): Promise<IndexedDBDatabase[]> {
	const databases: IndexedDBDatabase[] = [];

	if (!("indexedDB" in window)) {
		return databases;
	}

	try {
		// List of possible IndexedDB databases used by the app
		const possibleDatabases = [
			"auth-store",
			"private-store",
			"Wallet-store",
			"gliesereum-Wallet",
			"web3-app",
			"zustand-store",
			"vite-plugin-pwa-cache",
			"schemas-db",
			"schemasDB",
			"accounts-store",
			"app-store",
			"panel-store",
			"Canvas-ui-store",
			"worker-store",
			"open-apps-store",
			"market-store",
			"wallet-store",
			"network-store",
		];

		for (const dbName of possibleDatabases) {
			try {
				const db = await new Promise<IDBDatabase | null>((resolve) => {
					const request = indexedDB.open(dbName);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => resolve(null);
					request.onblocked = () => resolve(null);
				});

				if (db) {
					const objectStores: string[] = [];
					for (let i = 0; i < db.objectStoreNames.length; i++) {
						objectStores.push(db.objectStoreNames[i]);
					}

					// Estimate size by counting records (rough estimate)
					let estimatedSize = 0;
					for (const storeName of objectStores) {
						try {
							const transaction = db.transaction([storeName], "readonly");
							const store = transaction.objectStore(storeName);
							const countRequest = store.count();
							await new Promise<void>((resolve) => {
								countRequest.onsuccess = () => {
									// Rough estimate: 1KB per record
									estimatedSize += countRequest.result * 1024;
									resolve();
								};
								countRequest.onerror = () => resolve();
							});
						} catch {
							// Ignore errors for individual stores
						}
					}

					databases.push({
						name: dbName,
						version: db.version,
						objectStores,
						estimatedSize,
					});

					db.close();
				}
			} catch (error) {
				console.log(
					"[StorageScanner] Could not scan IndexedDB database:",
					dbName,
					error,
				);
			}
		}
	} catch (error) {
		console.error("[StorageScanner] Error scanning IndexedDB:", error);
	}

	return databases;
}

/**
 * Scan Cache Storage
 */
export async function scanCacheStorage(): Promise<CacheInfo[]> {
	const caches: CacheInfo[] = [];

	if (!("caches" in window)) {
		return caches;
	}

	try {
		const cacheNames = await caches.keys();

		for (const cacheName of cacheNames) {
			try {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();
				const keyUrls = keys.map((request) => request.url);

				// Estimate size (rough calculation)
				let estimatedSize = 0;
				for (const request of keys) {
					try {
						const response = await cache.match(request);
						if (response) {
							const blob = await response.blob();
							estimatedSize += blob.size;
						}
					} catch {
						// Ignore errors for individual cache entries
					}
				}

				caches.push({
					name: cacheName,
					estimatedSize,
					keys: keyUrls,
				});
			} catch (error) {
				console.log(
					"[StorageScanner] Could not scan cache:",
					cacheName,
					error,
				);
			}
		}
	} catch (error) {
		console.error("[StorageScanner] Error scanning Cache Storage:", error);
	}

	return caches;
}

/**
 * Scan cookies
 */
export function scanCookies(): Array<{ name: string; value: string }> {
	const cookies: Array<{ name: string; value: string }> = [];

	try {
		if (document.cookie) {
			const cookieStrings = document.cookie.split(";");
			for (const cookieString of cookieStrings) {
				const [name, ...valueParts] = cookieString.trim().split("=");
				const value = valueParts.join("=");
				if (name) {
					cookies.push({ name, value });
				}
			}
		}
	} catch (error) {
		console.error("[StorageScanner] Error scanning cookies:", error);
	}

	return cookies;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Comprehensive storage scan
 * Scans all storage mechanisms and returns detailed results
 */
export async function scanAllStorage(): Promise<StorageScanResult> {
	console.log("[StorageScanner] Starting comprehensive storage scan...");

	const localStorageItems = scanLocalStorage();
	const sessionStorageItems = scanSessionStorage();
	const indexedDBDatabases = await scanIndexedDB();
	const caches = await scanCacheStorage();
	const cookies = scanCookies();

	// Calculate total size
	const totalSize =
		localStorageItems.reduce((sum, item) => sum + item.size, 0) +
		sessionStorageItems.reduce((sum, item) => sum + item.size, 0) +
		indexedDBDatabases.reduce((sum, db) => sum + db.estimatedSize, 0) +
		caches.reduce((sum, cache) => sum + cache.estimatedSize, 0);

	const hasData =
		localStorageItems.length > 0 ||
		sessionStorageItems.length > 0 ||
		indexedDBDatabases.length > 0 ||
		caches.length > 0 ||
		cookies.length > 0;

	const result: StorageScanResult = {
		localStorage: localStorageItems,
		sessionStorage: sessionStorageItems,
		indexedDB: indexedDBDatabases,
		caches,
		cookies,
		totalSize,
		hasData,
	};

	console.log("[StorageScanner] Scan complete:", {
		localStorage: localStorageItems.length,
		sessionStorage: sessionStorageItems.length,
		indexedDB: indexedDBDatabases.length,
		caches: caches.length,
		cookies: cookies.length,
		totalSize: formatBytes(totalSize),
		hasData,
	});

	return result;
}

