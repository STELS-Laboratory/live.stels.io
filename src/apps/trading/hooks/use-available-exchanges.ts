/**
 * Hook to get available exchanges for a symbol
 * Scans sessionStorage for order book channels
 */

import { useState, useEffect } from "react";

/**
 * Hook to get available exchanges for a symbol
 * Scans for channels like: testnet.runtime.book.{symbol}.{exchange}.spot
 */
export function useAvailableExchanges(symbol: string | null): string[] {
	const [exchanges, setExchanges] = useState<string[]>([]);

	useEffect(() => {
		if (!symbol) {
			setExchanges([]);
			return;
		}

		const loadExchanges = (): void => {
			const exchangeSet = new Set<string>();

			// Pattern: testnet.runtime.book.{symbol}.{exchange}.spot
			// Example: testnet.runtime.book.BCH/USDT.binance.spot
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (!key) continue;

				// Match pattern: testnet.runtime.book.{symbol}.{exchange}.spot
				const match = key.match(
					/^testnet\.runtime\.book\.([^/]+\/[^.]+)\.([^.]+)\.spot$/i,
				);

				if (match) {
					const [, channelSymbol, exchange] = match;

					// Filter by symbol (case-insensitive)
					if (channelSymbol.toUpperCase() === symbol.toUpperCase()) {
						exchangeSet.add(exchange.toLowerCase());
					}
				}
			}

			// Sort exchanges: prioritize bybit, binance, then alphabetical
			const sortedExchanges = Array.from(exchangeSet).sort((a, b) => {
				if (a === "bybit") return -1;
				if (b === "bybit") return 1;
				if (a === "binance") return -1;
				if (b === "binance") return 1;
				return a.localeCompare(b);
			});

			setExchanges(sortedExchanges);
		};

		// Initial load
		loadExchanges();

		// Listen to storage events
		const handleStorageChange = (): void => {
			loadExchanges();
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - optimized to avoid performance violations
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 3000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadExchanges();
			});
		}, 3000); // Poll every 3 seconds

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [symbol]);

	return exchanges;
}

