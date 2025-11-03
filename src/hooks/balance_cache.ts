/**
 * Global balance cache to persist balances across component remounts
 * This prevents showing "..." when switching tabs
 */

interface CachedBalance {
	balance: string;
	currency: string;
	decimals: number;
	initial_balance: string;
	total_received: string;
	total_sent: string;
	total_fees: string;
	transaction_count: number;
	timestamp: number;
}

export interface CachedBalanceItem {
	token_id: string;
	balance: string;
	decimals: number;
	currency: string;
	symbol: string;
	initial_balance: string;
	total_received: string;
	total_sent: string;
	total_fees: string;
	transaction_count: number;
	timestamp: number;
}

// Global cache stores
const balanceCache = new Map<string, CachedBalance>(); // Key: address-network-token_id
const balancesCache = new Map<string, CachedBalanceItem[]>(); // Key: address-network
const cacheTimestamps = new Map<string, number>(); // Key: address-network or address-network-token_id

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached balance for a specific token
 */
export function getCachedBalance(
	address: string,
	network: string,
	tokenId: string,
): CachedBalance | null {
	const key = `${address}-${network}-${tokenId}`;
	const cached = balanceCache.get(key);
	const timestamp = cacheTimestamps.get(key);

	if (!cached || !timestamp) {
		return null;
	}

	// Check if cache is expired
	if (Date.now() - timestamp > CACHE_TTL) {
		balanceCache.delete(key);
		cacheTimestamps.delete(key);
		return null;
	}

	return cached;
}

/**
 * Set cached balance for a specific token
 */
export function setCachedBalance(
	address: string,
	network: string,
	tokenId: string,
	balance: CachedBalance,
): void {
	const key = `${address}-${network}-${tokenId}`;
	balanceCache.set(key, balance);
	cacheTimestamps.set(key, Date.now());
}

/**
 * Get cached balances for an address
 */
export function getCachedBalances(
	address: string,
	network: string,
): CachedBalanceItem[] | null {
	const key = `${address}-${network}`;
	const cached = balancesCache.get(key);
	const timestamp = cacheTimestamps.get(key);

	if (!cached || !timestamp) {
		return null;
	}

	// Check if cache is expired
	if (Date.now() - timestamp > CACHE_TTL) {
		balancesCache.delete(key);
		cacheTimestamps.delete(key);
		return null;
	}

	return cached;
}

/**
 * Set cached balances for an address
 */
export function setCachedBalances(
	address: string,
	network: string,
	balances: CachedBalanceItem[],
): void {
	const key = `${address}-${network}`;
	balancesCache.set(key, balances);
	cacheTimestamps.set(key, Date.now());
}

/**
 * Clear cache for a specific address and network
 */
export function clearCache(address: string, network: string): void {
	const key = `${address}-${network}`;
	balancesCache.delete(key);
	cacheTimestamps.delete(key);

	// Clear all individual balances for this address-network
	for (const [cacheKey] of balanceCache) {
		if (cacheKey.startsWith(`${address}-${network}-`)) {
			balanceCache.delete(cacheKey);
		}
	}
	for (const [cacheKey] of cacheTimestamps) {
		if (cacheKey.startsWith(`${address}-${network}-`)) {
			cacheTimestamps.delete(cacheKey);
		}
	}
}

/**
 * Clear all caches (useful for logout)
 */
export function clearAllCaches(): void {
	balanceCache.clear();
	balancesCache.clear();
	cacheTimestamps.clear();
}

