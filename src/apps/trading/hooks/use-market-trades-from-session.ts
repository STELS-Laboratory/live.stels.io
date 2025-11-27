/**
 * Hook to get market trades from sessionStorage
 * Market trades are all trades on the exchange, not just account trades
 */

import { useState, useEffect, useMemo } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";
import type { TradingTrade } from "../types";

/**
 * Get market trades channel name
 */
function getMarketTradesChannel(
	symbol: string,
	exchange: string,
): string {
	return `testnet.runtime.trades.${symbol}.${exchange}.spot`;
}

/**
 * Parse market trades data from session
 */
function parseMarketTrades(data: Record<string, unknown> | null): TradingTrade[] {
	if (!data) return [];
	try {
		const raw = (data as { raw?: unknown }).raw as {
			trades?: Array<{
				id: string;
				symbol: string;
				side: "buy" | "sell";
				price: number;
				amount: number;
				cost: number;
				timestamp: number;
				datetime: string;
				fee?: { currency?: string; cost?: number };
				fees?: Array<{ currency?: string; cost?: number }>;
				orderId?: string;
				type?: string;
				info?: Record<string, unknown>;
			}>;
		} | undefined;
		if (!raw?.trades) return [];

		return raw.trades.map((trade) => ({
			id: trade.id,
			symbol: trade.symbol,
			side: trade.side,
			price: trade.price,
			amount: trade.amount,
			cost: trade.cost,
			timestamp: trade.timestamp,
			datetime: trade.datetime,
			fee: trade.fee,
			fees: trade.fees,
			orderId: trade.orderId,
			type: trade.type,
			info: trade.info,
		}));
	} catch {
		return [];
	}
}

/**
 * Hook to get market trades from session
 */
export function useMarketTradesFromSession(
	symbol: string | null,
	exchange: string = "bybit",
	limit: number = 20,
): TradingTrade[] {
	const [trades, setTrades] = useState<TradingTrade[]>([]);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!symbol) return null;
		return getMarketTradesChannel(symbol, exchange);
	}, [symbol, exchange]);

	useEffect(() => {
		if (!channel) {
			setTrades([]);
			return;
		}

		const loadData = (): void => {
			const data = sessionManager.getData(channel, true);
			const parsed = parseMarketTrades(data);
			// Sort by timestamp descending (newest first) and limit
			const sorted = parsed
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, limit);
			if (sorted.length > 0) {
				setTrades(sorted);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseMarketTrades(updatedData);
			const sorted = parsed
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, limit);
			if (sorted.length > 0) {
				setTrades(sorted);
			}
		});

		// Listen to storage events
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === channel || e.key === channel.toLowerCase()) {
				loadData();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - reduced frequency for better performance
		// Optimized to avoid performance violations
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
		}, 2000); // Poll every 2 seconds for better performance

		return () => {
			unsubscribe();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [channel, sessionManager, limit]);

	return trades;
}
