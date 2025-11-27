/**
 * Hook to get candles from sessionStorage
 * Pattern: testnet.runtime.candles.{SYMBOL}.{EXCHANGE}.spot.{TIMEFRAME}
 */

import { useState, useEffect, useMemo } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";

export interface Candle {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

/**
 * Get candles channel name
 */
function getCandlesChannel(
	symbol: string,
	exchange: string,
	timeframe: Timeframe,
): string {
	return `testnet.runtime.candles.${symbol}.${exchange}.spot.${timeframe}`;
}

/**
 * Parse candles data from session
 */
function parseCandles(data: Record<string, unknown> | null): Candle[] {
	if (!data) return [];

	try {
		const raw = (data as { raw?: unknown }).raw as {
			candles?: number[][];
		} | undefined;

		if (!raw || !raw.candles || !Array.isArray(raw.candles)) return [];

		return raw.candles.map((candle) => {
			// Format: [timestamp, open, high, low, close, volume]
			return {
				timestamp: candle[0] || 0,
				open: Number(candle[1]) || 0,
				high: Number(candle[2]) || 0,
				low: Number(candle[3]) || 0,
				close: Number(candle[4]) || 0,
				volume: Number(candle[5]) || 0,
			};
		});
	} catch {

		return [];
	}
}

/**
 * Hook to get candles from session
 */
export function useCandlesFromSession(
	symbol: string | null,
	exchange: string = "bybit",
	timeframe: Timeframe = "15m",
): Candle[] {
	const [candles, setCandles] = useState<Candle[]>([]);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!symbol) return null;
		return getCandlesChannel(symbol, exchange, timeframe);
	}, [symbol, exchange, timeframe]);

	useEffect(() => {
		if (!channel) {
			setCandles([]);
			return;
		}

		const loadData = (): void => {
			const data = sessionManager.getData(channel, true);
			const parsed = parseCandles(data);
			if (parsed.length > 0) {
				setCandles(parsed);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseCandles(updatedData);
			if (parsed.length > 0) {
				setCandles(parsed);
			}
		});

		// Listen to storage events
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === channel || e.key === channel.toLowerCase()) {
				loadData();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - optimized to avoid performance violations
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 2000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadData();
			});
		}, 2000); // Poll every 2 seconds

		return () => {
			unsubscribe();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [channel, sessionManager]);

	return candles;
}
