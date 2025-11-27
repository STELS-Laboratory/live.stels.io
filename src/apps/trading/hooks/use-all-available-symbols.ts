/**
 * Hook to get all available symbols for viewing
 * Scans all exchanges for all available trading pairs
 */

import { useState, useEffect } from "react";
import { useTradingStore } from "../store";

/**
 * Hook to get all available symbols from all exchanges
 * Returns all symbols that can be viewed (from ticker channels)
 */
export function useAllAvailableSymbols(): string[] {
	const [symbols, setSymbols] = useState<string[]>([]);
	const { selectedExchange } = useTradingStore();

	useEffect(() => {
		const loadSymbols = (): void => {
			const symbolSet = new Set<string>();

			// Pattern: testnet.runtime.ticker.{symbol}.{exchange}.spot
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (!key) continue;

				// Match pattern: testnet.runtime.ticker.{symbol}.{exchange}.spot
				const match = key.match(
					/^testnet\.runtime\.ticker\.([^/]+)\/([^.]+)\.([^.]+)\.spot$/i,
				);

				if (match) {
					const [, base, quote, channelExchange] = match;
					const symbol = `${base}/${quote}`;

					// If exchange is selected, filter by it, otherwise show all
					if (selectedExchange) {
						if (channelExchange.toLowerCase() === selectedExchange.toLowerCase()) {
							symbolSet.add(symbol);
						}
					} else {
						// Show all symbols from all exchanges
						symbolSet.add(symbol);
					}
				}
			}

			const sortedSymbols = Array.from(symbolSet).sort((a, b) => {
				// Prioritize BTC/USDT, ETH/USDT, then alphabetical
				if (a === "BTC/USDT") return -1;
				if (b === "BTC/USDT") return 1;
				if (a === "ETH/USDT") return -1;
				if (b === "ETH/USDT") return 1;
				return a.localeCompare(b);
			});

			setSymbols(sortedSymbols);
		};

		// Initial load
		loadSymbols();

		// Listen to storage events
		const handleStorageChange = (): void => {
			loadSymbols();
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
				loadSymbols();
			});
		}, 3000); // Poll every 3 seconds

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [selectedExchange]);

	return symbols;
}

