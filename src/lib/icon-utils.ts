/**
 * Icon utilities for coins and exchanges
 * Provides helper functions to get icon paths for currencies and exchanges
 */

/**
 * Get coin icon path
 * Extracts base currency from market pair (e.g., "BTC/USDT" -> "BTC")
 * Uses public assets path for Vite
 */
export function importCoinIcon(coin: string): string | null {
	try {
		const normalizedCoin = coin.toUpperCase();
		if (!normalizedCoin) return null;

		// Use public path - Vite serves files from public/ at root
		return `/assets/icons/coins/${normalizedCoin}.png`;
	} catch {
		return null;
	}
}

/**
 * Get exchange icon path
 * Uses public assets path for Vite
 */
export function importExchangeIcon(exchange: string): string | null {
	try {
		const normalizedExchange = exchange.toUpperCase();
		if (!normalizedExchange) return null;

		// Use public path - Vite serves files from public/ at root
		return `/assets/icons/exchanges/${normalizedExchange}.png`;
	} catch {
		return null;
	}
}

/**
 * Get first letter for fallback icon
 */
export function getFirstLetter(text: string): string {
	if (!text) return "?";
	return text.charAt(0).toUpperCase();
}

