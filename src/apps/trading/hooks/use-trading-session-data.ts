/**
 * Trading Session Data Hooks
 * Get real-time trading data from sessionStorage
 */

import { useState, useEffect, useMemo } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";
import type { OrderBook, Ticker, AccountBalance, ExchangeAccount } from "../types";

/**
 * Get order book channel name
 */
function getOrderBookChannel(symbol: string, exchange: string): string {
	return `testnet.runtime.book.${symbol}.${exchange}.spot`;
}

/**
 * Get ticker channel name
 */
function getTickerChannel(symbol: string, exchange: string): string {
	return `testnet.runtime.ticker.${symbol}.${exchange}.spot`;
}

/**
 * Get account balance channel name
 */
function getAccountBalanceChannel(address: string, exchange: string, nid: string): string {
	return `account.balance.${address}.${exchange}.${nid}`;
}

/**
 * Parse order book data from session
 */
function parseOrderBook(data: Record<string, unknown> | null): OrderBook | null {
	if (!data) return null;

	try {
		const raw = (data as { raw?: unknown }).raw as {
			bids?: number[][];
			asks?: number[][];
			timestamp?: number;
		} | undefined;

		if (!raw || !raw.bids || !raw.asks) return null;

		const bids: Array<{ price: number; amount: number }> = raw.bids
			.slice(0, 20)
			.map(([price, amount]) => ({
				price: Number(price) || 0,
				amount: Number(amount) || 0,
			}));

		const asks: Array<{ price: number; amount: number }> = raw.asks
			.slice(0, 20)
			.map(([price, amount]) => ({
				price: Number(price) || 0,
				amount: Number(amount) || 0,
			}));

		return {
			bids,
			asks,
			timestamp: raw.timestamp || Date.now(),
			datetime: new Date(raw.timestamp || Date.now()).toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Parse ticker data from session
 */
function parseTicker(data: Record<string, unknown> | null, symbol: string): Ticker | null {
	if (!data) return null;

	try {
		const raw = (data as { raw?: unknown }).raw as {
			exchange?: string;
			market?: string;
			last?: number;
			bid?: number;
			ask?: number;
			change?: number;
			percentage?: number;
			baseVolume?: number;
			quoteVolume?: number;
			timestamp?: number;
		} | undefined;

		if (!raw || raw.last === undefined) return null;

		return {
			symbol: raw.market || symbol,
			bid: raw.bid || raw.last,
			ask: raw.ask || raw.last,
			last: raw.last,
			high: raw.last,
			low: raw.last,
			vwap: raw.last,
			open: raw.last,
			close: raw.last,
			change: raw.change || 0,
			percentage: raw.percentage || 0,
			average: raw.last,
			baseVolume: raw.baseVolume || 0,
			quoteVolume: raw.quoteVolume || 0,
			timestamp: raw.timestamp || Date.now(),
			datetime: new Date(raw.timestamp || Date.now()).toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Parse account balance data from session
 * Supports multiple data formats:
 * 1. Direct format: raw.BTC, raw.SOL, etc. with free/used/total
 * 2. Wallet format: raw.wallet.info.result.list with coin array
 */
function parseAccountBalance(data: Record<string, unknown> | null): AccountBalance | null {
	if (!data) return null;

	try {
		const raw = (data as { raw?: unknown }).raw as {
			// Direct balance format
			BTC?: { free?: number; used?: number; total?: number; debt?: number };
			ETH?: { free?: number; used?: number; total?: number; debt?: number };
			USDT?: { free?: number; used?: number; total?: number; debt?: number };
			SOL?: { free?: number; used?: number; total?: number; debt?: number };
			BNB?: { free?: number; used?: number; total?: number; debt?: number };
			// Wallet format
			wallet?: {
				info?: {
					result?: {
						list?: Array<{
							coin?: string;
							walletBalance?: string | number;
							equity?: string | number;
							availableToWithdraw?: string | number;
							locked?: string | number;
						}>;
					};
				};
			};
			// Free/used/total objects (alternative format)
			free?: Record<string, number>;
			used?: Record<string, number>;
			total?: Record<string, number>;
			timestamp?: number;
			datetime?: string;
			[key: string]: unknown;
		} | undefined;

		if (!raw) return null;

		const balances: Record<string, { free: number; used: number; total: number }> = {};

		// Method 1: Try wallet.info.result.list format (Bybit format) - most accurate
		// Parse this first as it has the most complete data
		// Structure: raw.wallet.info.result.list[0].coin[] - coin is an array of coin objects
		if (raw.wallet?.info?.result?.list && Array.isArray(raw.wallet.info.result.list) && raw.wallet.info.result.list.length > 0) {
			const firstAccount = raw.wallet.info.result.list[0];
			const coins = firstAccount.coin;
			
			if (Array.isArray(coins)) {
				coins.forEach((coin) => {
					if (!coin.coin) {
						return;
					}

					const currency = String(coin.coin).toUpperCase(); // Ensure uppercase for consistency (USDT, not usdt)
					const walletBalance = Number(coin.walletBalance) || 0;
					const equity = Number(coin.equity) || 0;
					const locked = Number(coin.locked) || 0;
					// For Bybit, availableToWithdraw might be empty, use walletBalance - locked
					const available = Number(coin.availableToWithdraw) || (walletBalance > locked ? walletBalance - locked : walletBalance);

					// Always use wallet format data as it's more accurate
					balances[currency] = {
						free: available > 0 ? available : (equity > 0 ? equity : walletBalance),
						used: locked,
						total: equity > 0 ? equity : walletBalance,
					};
				});
			}
		}

		// Method 2: Try free/used/total objects format
		if (raw.free && typeof raw.free === "object" && !Array.isArray(raw.free)) {
			Object.keys(raw.free).forEach((currency) => {
				// Only add if not already parsed from wallet format
				if (!balances[currency]) {
					balances[currency] = {
						free: Number(raw.free?.[currency]) || 0,
						used: Number(raw.used?.[currency]) || 0,
						total: Number(raw.total?.[currency]) || 0,
					};
				}
			});
		}

		// Method 3: Try direct format (raw.BTC, raw.SOL, etc.) - fallback
		const directCurrencyKeys = Object.keys(raw).filter(
			(key) =>
				key !== "wallet" &&
				key !== "free" &&
				key !== "used" &&
				key !== "total" &&
				key !== "timestamp" &&
				key !== "datetime" &&
				key !== "nid" &&
				key !== "address" &&
				key !== "signature" &&
				key !== "publicKey" &&
				key !== "exchange" &&
				key !== "viewers" &&
				key !== "workers" &&
				key !== "protocol" &&
				typeof raw[key] === "object" &&
				raw[key] !== null &&
				!Array.isArray(raw[key]),
		);

		directCurrencyKeys.forEach((key) => {
			// Only add if not already parsed
			if (!balances[key]) {
				const balance = raw[key] as { free?: number; used?: number; total?: number } | undefined;
				if (balance && (balance.free !== undefined || balance.used !== undefined || balance.total !== undefined)) {
					balances[key] = {
						free: Number(balance.free) || 0,
						used: Number(balance.used) || 0,
						total: Number(balance.total) || 0,
					};
				}
			}
		});

		// If no balances found, return null
		if (Object.keys(balances).length === 0) {
			return null;
		}

		return {
			balances,
			timestamp: raw.timestamp || Date.now(),
			datetime: raw.datetime || new Date().toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Hook to get order book from session
 */
export function useOrderBookFromSession(
	symbol: string | null,
	exchange: string = "bybit",
): OrderBook | null {
	const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!symbol) return null;
		return getOrderBookChannel(symbol, exchange);
	}, [symbol, exchange]);

	useEffect(() => {
		if (!channel) {
			setOrderBook(null);
			return;
		}

		const loadData = (): void => {
			const data = sessionManager.getData(channel, true);
			const parsed = parseOrderBook(data);
			if (parsed) {
				setOrderBook(parsed);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseOrderBook(updatedData);
			if (parsed) {
				setOrderBook(parsed);
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
		// Use requestAnimationFrame to batch operations
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 1000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadData();
			});
		}, 1000); // Poll every second for real-time updates

		return () => {
			unsubscribe();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [channel, sessionManager]);

	return orderBook;
}

/**
 * Hook to get ticker from session
 */
export function useTickerFromSession(
	symbol: string | null,
	exchange: string = "bybit",
): Ticker | null {
	const [ticker, setTicker] = useState<Ticker | null>(null);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!symbol) return null;
		return getTickerChannel(symbol, exchange);
	}, [symbol, exchange]);

	useEffect(() => {
		if (!channel) {
			setTicker(null);
			return;
		}

		const loadData = (): void => {
			const data = sessionManager.getData(channel, true);
			const parsed = parseTicker(data, symbol || "");
			if (parsed) {
				setTicker(parsed);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseTicker(updatedData, symbol || "");
			if (parsed) {
				setTicker(parsed);
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
	}, [channel, symbol, sessionManager]);

	return ticker;
}

/**
 * Hook to get account balance from session
 * Finds the correct channel by searching for matching exchange.nid pattern
 * This handles cases where user is a viewer and data is stored under owner's address
 */
export function useAccountBalanceFromSession(
	account: ExchangeAccount | null,
	walletAddress: string | null,
): AccountBalance | null {
	const [balance, setBalance] = useState<AccountBalance | null>(null);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!account) return null;

		// Find the correct channel by searching sessionStorage for matching nid and exchange
		// The address in the channel might differ from walletAddress (e.g., for viewer accounts)
		if (typeof window !== "undefined") {
			const searchPattern = `.${account.exchange || "bybit"}.${account.nid}`;
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && key.startsWith("account.balance.") && key.endsWith(searchPattern)) {
					return key;
				}
			}
		}

		// Fallback: try with wallet address if available
		if (walletAddress) {
			return getAccountBalanceChannel(walletAddress, account.exchange || "bybit", account.nid);
		}

		return null;
	}, [account, walletAddress]);

	useEffect(() => {
		if (!channel) {
			setBalance(null);
			return;
		}

		const loadData = (): void => {
			const data = sessionManager.getData(channel, true);
			const parsed = parseAccountBalance(data);
			if (parsed) {
				setBalance(parsed);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseAccountBalance(updatedData);
			if (parsed) {
				setBalance(parsed);
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
			if (now - lastPollTime < 3000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadData();
			});
		}, 3000); // Poll every 3 seconds for balance (less critical)

		return () => {
			unsubscribe();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [channel, sessionManager]);

	return balance;
}
