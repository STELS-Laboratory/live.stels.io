/**
 * Application Storage Keys
 * List of all storage keys used by the application
 * Used to identify which data belongs to the app
 */

/**
 * List of application-specific storage keys
 */
export const APP_STORAGE_KEYS = [
	// Auth & Wallet
	"auth-store",
	"private-store",
	"_g",
	"Wallet-store",
	"gliesereum-Wallet",
	"web3-session",
	"connection-data",
	"network-config",
	"Wallet-data",

	// App State
	"app-store",
	"panel-store",
	"Canvas-ui-store",
	"worker-store",
	"user-preferences",
	"app-settings",
	"accounts-store",
	"open-apps-store",

	// Session & Version
	"app-session-id",
	"app-last-version",
	"schemas-cache-version",
	"app-build-version",

	// Theme
	"theme-store",

	// Token Builder
	"token-builder-store",
] as const;

/**
 * List of application-specific IndexedDB database names
 */
export const APP_INDEXEDDB_DATABASES = [
	"auth-store",
	"private-store",
	"Wallet-store",
	"gliesereum-Wallet",
	"web3-app",
	"zustand-store",
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
] as const;

/**
 * Check if a storage key belongs to the application
 */
export function isAppStorageKey(key: string): boolean {
	return APP_STORAGE_KEYS.includes(key as (typeof APP_STORAGE_KEYS)[number]);
}

/**
 * Check if an IndexedDB database belongs to the application
 */
export function isAppIndexedDBDatabase(dbName: string): boolean {
	return APP_INDEXEDDB_DATABASES.includes(
		dbName as (typeof APP_INDEXEDDB_DATABASES)[number],
	);
}

/**
 * Get category for a storage key
 */
export function getStorageKeyCategory(key: string): string {
	if (
		key.includes("auth") ||
		key.includes("private") ||
		key.includes("Wallet") ||
		key.includes("session") ||
		key.includes("connection") ||
		key.includes("network")
	) {
		return "Authentication & Wallet";
	}
	if (
		key.includes("app") ||
		key.includes("panel") ||
		key.includes("Canvas") ||
		key.includes("worker") ||
		key.includes("preferences") ||
		key.includes("settings") ||
		key.includes("accounts") ||
		key.includes("open-apps")
	) {
		return "App State";
	}
	if (
		key.includes("session") ||
		key.includes("version") ||
		key.includes("build")
	) {
		return "Session & Version";
	}
	if (key.includes("theme")) {
		return "Theme";
	}
	if (key.includes("token") || key.includes("builder")) {
		return "Token Builder";
	}
	return "Other";
}
