/**
 * Hook for getting token price from session ticker data
 * Reads price from sessionStorage ticker channels
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores";
import useSessionStoreSync from "@/hooks/use_session_store_sync";

/**
 * Ticker data structure from session
 */
interface TickerData {
	channel: string;
	module: string;
	widget: string;
	raw: {
		exchange: string;
		market: string;
		data: {
			last: number;
			bid: number;
			ask: number;
			change: number;
			percentage: number;
			baseVolume: number;
			quoteVolume: number;
		};
		timestamp: number;
		latency: number;
	};
	active: boolean;
	timestamp: number;
}

/**
 * Get token price parameters
 */
export interface GetTokenPriceParams {
	symbol: string; // Token symbol (e.g., "BTC", "ETH", "SOL", "XRP", "BNB")
	network?: string;
}

/**
 * Hook return type
 */
export interface UseTokenPriceReturn {
	price: number | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

/**
 * Get token price from session ticker data
 * Looks for ticker channel: {network}.runtime.ticker.{SYMBOL}/USDT.bybit.spot
 */
export function useTokenPrice(
	params: GetTokenPriceParams,
): UseTokenPriceReturn {
	const [price, setPrice] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const { connectionSession } = useAuthStore();
	const session = useSessionStoreSync() as Record<string, unknown> | null;

	const fetchPrice = useCallback((): void => {
		if (!params.symbol) {
			setPrice(null);
			return;
		}

		const network = params.network || connectionSession?.network || "testnet";
		const symbol = params.symbol.toUpperCase();

		// Build ticker channel key
		// Format: testnet.runtime.ticker.BTC/USDT.bybit.spot
		const channelKey = `${network}.runtime.ticker.${symbol}/USDT.bybit.spot`;

		try {
			// Try to get from session store first (it polls sessionStorage)
			let tickerData: TickerData | null = null;

			if (session && session[channelKey]) {
				tickerData = session[channelKey] as TickerData;
			} else {
				// Fallback: read directly from sessionStorage
				const stored = sessionStorage.getItem(channelKey) ||
					sessionStorage.getItem(channelKey.toLowerCase());

				if (stored) {
					tickerData = JSON.parse(stored) as TickerData;
				}
			}

			if (tickerData && tickerData.raw?.data?.last) {
				const lastPrice = tickerData.raw.data.last;
				setPrice(lastPrice);
				setError(null);
				setLoading(false);
			} else {
				setPrice(null);
				setError(`Ticker not found for ${symbol}`);
				setLoading(false);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to get token price";
			setError(errorMessage);
			setPrice(null);
			setLoading(false);
			console.error("[useTokenPrice] Error:", err);
		}
	}, [params.symbol, params.network, connectionSession?.network, session]);

	useEffect(() => {
		setLoading(true);
		fetchPrice();
	}, [fetchPrice]);

	// Also listen to session updates
	useEffect(() => {
		if (session && params.symbol) {
			fetchPrice();
		}
	}, [session, params.symbol, fetchPrice]);

	return {
		price,
		loading,
		error,
		refetch: fetchPrice,
	};
}

/**
 * Get all token prices from session
 * Returns a map of symbol -> price
 * Uses debouncing and memoization to prevent excessive re-renders
 */
export function useAllTokenPrices(
	network?: string,
): Map<string, number> {
	const { connectionSession } = useAuthStore();
	const session = useSessionStoreSync() as Record<string, unknown> | null;
	const [prices, setPrices] = useState<Map<string, number>>(new Map());
	const pricesRef = React.useRef<Map<string, number>>(new Map());
	const stablePricesRef = React.useRef<Map<string, number>>(new Map());
	const lastUpdateRef = React.useRef<number>(0);
	const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Use useMemo to debounce and only update when prices actually change
	const pricesMap = React.useMemo(() => {
		const networkName = network || connectionSession?.network || "testnet";
		const priceMap = new Map<string, number>();

		// Common token symbols to check
		const symbols = ["BTC", "ETH", "SOL", "XRP", "BNB", "USDT"];

		for (const symbol of symbols) {
			const channelKey = `${networkName}.runtime.ticker.${symbol}/USDT.bybit.spot`;

			try {
				let tickerData: TickerData | null = null;

				if (session && session[channelKey]) {
					tickerData = session[channelKey] as TickerData;
				} else {
					const stored = sessionStorage.getItem(channelKey) ||
						sessionStorage.getItem(channelKey.toLowerCase());

					if (stored) {
						tickerData = JSON.parse(stored) as TickerData;
					}
				}

				if (tickerData?.raw?.data?.last) {
					const newPrice = tickerData.raw.data.last;
					const oldPrice = pricesRef.current.get(symbol);
					
					// Only update if price actually changed significantly (> 0.1% or > 0.01 absolute)
					if (oldPrice === undefined) {
						priceMap.set(symbol, newPrice);
					} else {
						const changePercent = Math.abs((newPrice - oldPrice) / oldPrice);
						const changeAbsolute = Math.abs(newPrice - oldPrice);
						
						// Only update if change is significant (> 0.1% or > 0.01)
						if (changePercent > 0.001 || changeAbsolute > 0.01) {
							priceMap.set(symbol, newPrice);
						} else {
							// Keep old price if change is minimal
							priceMap.set(symbol, oldPrice);
						}
					}
				} else if (pricesRef.current.has(symbol)) {
					// Keep old price if new data is not available
					priceMap.set(symbol, pricesRef.current.get(symbol)!);
				}
			} catch (err) {
				// On error, keep old price if available
				if (pricesRef.current.has(symbol)) {
					priceMap.set(symbol, pricesRef.current.get(symbol)!);
				}
				console.error(`[useAllTokenPrices] Error getting price for ${symbol}:`, err);
			}
		}

		// Update ref with new prices
		pricesRef.current = priceMap;
		
		return priceMap;
	}, [session, network, connectionSession?.network]);

	// Throttle state updates - only update every 500ms max
	React.useEffect(() => {
		// Compare maps to see if anything actually changed
		let hasChanges = false;
		
		if (stablePricesRef.current.size !== pricesMap.size) {
			hasChanges = true;
		} else {
			for (const [symbol, price] of pricesMap) {
				const stablePrice = stablePricesRef.current.get(symbol);
				if (stablePrice !== price) {
					hasChanges = true;
					break;
				}
			}
		}

		if (hasChanges) {
			const now = Date.now();
			const timeSinceLastUpdate = now - lastUpdateRef.current;
			const throttleDelay = 500; // Minimum 500ms between updates

			// Clear existing timeout
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}

			// Update immediately if enough time has passed, otherwise throttle
			if (timeSinceLastUpdate >= throttleDelay) {
				const newPricesMap = new Map(pricesMap);
				stablePricesRef.current = newPricesMap;
				setPrices(newPricesMap);
				lastUpdateRef.current = now;
			} else {
				// Schedule update after throttle delay
				const delay = throttleDelay - timeSinceLastUpdate;
				updateTimeoutRef.current = setTimeout(() => {
					const newPricesMap = new Map(pricesMap);
					stablePricesRef.current = newPricesMap;
					setPrices(newPricesMap);
					lastUpdateRef.current = Date.now();
					updateTimeoutRef.current = null;
				}, delay);
			}
		}

		return () => {
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
				updateTimeoutRef.current = null;
			}
		};
	}, [pricesMap]);

	// Return stable reference - use ref to prevent unnecessary re-renders
	return stablePricesRef.current.size > 0 ? stablePricesRef.current : prices;
}

