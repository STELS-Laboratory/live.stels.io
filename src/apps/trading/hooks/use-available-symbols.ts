/**
 * Hook to get available trading symbols from account protocol
 * Uses protocol.markets from account data, falls back to ticker scan
 */

import { useState, useEffect } from "react";
import { useNetworkStore } from "@/stores/modules/network.store";
import { getSessionStorageManager } from "@/lib/gui/ui";
import type { ExchangeAccount } from "../types";

/**
 * Get account balance channel name
 * Tries to find the channel by scanning sessionStorage for matching account
 */
function getAccountBalanceChannel(account: ExchangeAccount): string | null {
	// Scan sessionStorage to find the account balance channel
	// Pattern: account.balance.{address}.{exchange}.{nid}
	for (let i = 0; i < sessionStorage.length; i++) {
		const key = sessionStorage.key(i);
		if (!key) continue;

		const match = key.match(/^account\.balance\.([^.]+)\.([^.]+)\.([^.]+)$/i);
		if (match) {
			const [, , channelExchange, channelNid] = match;
			if (
				channelExchange.toLowerCase() === account.exchange.toLowerCase() &&
				channelNid === account.nid
			) {
				return key;
			}
		}
	}
	return null;
}

/**
 * Parse protocol markets from account data
 */
function parseProtocolMarkets(data: Record<string, unknown> | null): string[] {
	if (!data) return [];

	try {
		const raw = (data as { raw?: unknown }).raw as {
			protocol?: {
				markets?: string[];
			};
		} | undefined;

		if (raw?.protocol?.markets && Array.isArray(raw.protocol.markets)) {
			return raw.protocol.markets;
		}
	} catch {
		// Failed to parse symbols
	}

	return [];
}

/**
 * Hook to get available symbols from account protocol
 * Falls back to scanning tickers if protocol markets are not available
 */
export function useAvailableSymbols(
	account: ExchangeAccount | null,
): string[] {
	const [symbols, setSymbols] = useState<string[]>([]);
	const { currentNetworkId } = useNetworkStore();
	const sessionManager = getSessionStorageManager();

	useEffect(() => {
		const loadSymbols = (): void => {
			// In view-only mode (no account), scan for default exchange symbols
			if (!account) {
				const symbolSet = new Set<string>();
				const defaultExchange = "bybit";
				const networkPrefix = currentNetworkId;

				// Pattern: {network}.runtime.ticker.{symbol}.{exchange}.spot
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					if (!key) continue;

					// Match pattern: {network}.runtime.ticker.{symbol}.{exchange}.spot
					const match = key.match(
						new RegExp(`^${networkPrefix}\\.runtime\\.ticker\\.([^/]+)\\/([^.]+)\\.([^.]+)\\.spot$`, "i"),
					);

					if (match) {
						const [, base, quote, channelExchange] = match;
						const symbol = `${base}/${quote}`;

						// Filter by default exchange
						if (channelExchange.toLowerCase() === defaultExchange.toLowerCase()) {
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
				return;
			}

			// First, try to get markets from account protocol
			const accountChannel = getAccountBalanceChannel(account);
			if (accountChannel) {
				const accountData = sessionManager.getData(accountChannel, true);
				const protocolMarkets = parseProtocolMarkets(accountData);

				if (protocolMarkets.length > 0) {
					// Use protocol markets, sorted
					const sortedSymbols = protocolMarkets.sort((a, b) => {
						// Prioritize BTC/USDT, ETH/USDT, then alphabetical
						if (a === "BTC/USDT") return -1;
						if (b === "BTC/USDT") return 1;
						if (a === "ETH/USDT") return -1;
						if (b === "ETH/USDT") return 1;
						return a.localeCompare(b);
					});
					setSymbols(sortedSymbols);
					return;
				}
			}

			// Fallback: scan sessionStorage for ticker channels
			const symbolSet = new Set<string>();
			const exchange = account.exchange;
			const networkPrefix = currentNetworkId;

			// Pattern: {network}.runtime.ticker.{symbol}.{exchange}.spot
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (!key) continue;

				// Match pattern: {network}.runtime.ticker.{symbol}.{exchange}.spot
				const match = key.match(
					new RegExp(`^${networkPrefix}\\.runtime\\.ticker\\.([^/]+)\\/([^.]+)\\.([^.]+)\\.spot$`, "i"),
				);

				if (match) {
					const [, base, quote, channelExchange] = match;
					const symbol = `${base}/${quote}`;

					// Filter by exchange
					if (channelExchange.toLowerCase() === exchange.toLowerCase()) {
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

		// Subscribe to account data changes
		let unsubscribe: (() => void) | null = null;
		const accountChannel = account ? getAccountBalanceChannel(account) : null;
		if (accountChannel) {
			unsubscribe = sessionManager.subscribe(accountChannel, () => {
				loadSymbols();
			});
		}

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
			if (unsubscribe) {
				unsubscribe();
			}
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [account, sessionManager, currentNetworkId]);

	return symbols;
}
