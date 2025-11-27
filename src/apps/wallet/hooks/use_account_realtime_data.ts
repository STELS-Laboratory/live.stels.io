/**
 * Hook for getting real-time account data from sessionStorage
 * Subscribes to account balance channel updates
 */

import { useState, useEffect } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";
import type { StoredAccount } from "@/stores/modules/accounts.store";

interface AccountBalanceData {
	channel: string;
	module: string;
	widget: string;
	raw: {
		nid: string;
		address: string;
		exchange: string;
		wallet?: {
			info?: {
				result?: {
					list?: Array<{
						totalEquity?: string | number;
						totalWalletBalance?: string | number;
						coin?: Array<{
							coin?: string;
							usdValue?: string | number;
							equity?: string | number;
							walletBalance?: string | number;
							[key: string]: unknown;
						}>;
						[key: string]: unknown;
					}>;
					[key: string]: unknown;
				};
				[key: string]: unknown;
			};
			[key: string]: unknown;
		};
		connection?: boolean;
		[key: string]: unknown;
	};
	timestamp?: number;
	[key: string]: unknown;
}

interface AccountRealtimeData {
	totalEquity: number;
	totalWalletBalance: number;
	totalUsdValue: number;
	coins: Array<{
		coin: string;
		usdValue: number;
		equity: number;
		walletBalance: number;
	}>;
	isConnected: boolean;
	lastUpdate: number | null;
}

/**
 * Get account channel name from account data
 */
function getAccountChannel(account: StoredAccount): string {
	const address = account.address || "";
	const exchange = account.account.exchange || "";
	const nid = account.account.nid || "";
	return `account.balance.${address}.${exchange}.${nid}`;
}

/**
 * Parse account balance data from sessionStorage
 */
function parseAccountData(data: Record<string, unknown> | null): AccountRealtimeData | null {
	if (!data) return null;

	try {
		const accountData = data as AccountBalanceData;
		const wallet = accountData.raw?.wallet;
		const list = wallet?.info?.result?.list?.[0];

		if (!list) return null;

		const coins = list.coin || [];
		let totalUsdValue = 0;
		const parsedCoins = coins
			.filter((coin) => coin.coin && coin.usdValue)
			.map((coin) => {
				const usdValue = parseFloat(String(coin.usdValue || 0));
				totalUsdValue += usdValue;
				return {
					coin: String(coin.coin || ""),
					usdValue,
					equity: parseFloat(String(coin.equity || 0)),
					walletBalance: parseFloat(String(coin.walletBalance || 0)),
				};
			});

		return {
			totalEquity: parseFloat(String(list.totalEquity || 0)),
			totalWalletBalance: parseFloat(String(list.totalWalletBalance || 0)),
			totalUsdValue,
			coins: parsedCoins,
			isConnected: accountData.raw?.connection !== false,
			lastUpdate: accountData.timestamp || Date.now(),
		};
	} catch {

		return null;
	}
}

/**
 * Hook for real-time account data from sessionStorage
 */
export function useAccountRealtimeData(
	account: StoredAccount | null,
): AccountRealtimeData | null {
	const [data, setData] = useState<AccountRealtimeData | null>(null);
	const sessionManager = getSessionStorageManager();

	useEffect(() => {
		if (!account) {
			setData(null);
			return;
		}

		const channel = getAccountChannel(account);

		// Function to load and parse data
		const loadData = (): void => {
			const accountData = sessionManager.getData(channel, true); // Skip cache for fresh data
			const parsed = parseAccountData(accountData);
			if (parsed) {
				setData(parsed);
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates via SessionStorageManager
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			const parsed = parseAccountData(updatedData);
			if (parsed) {
				setData(parsed);
			}
		});

		// Listen to storage events (for cross-tab updates)
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === channel || e.key === channel.toLowerCase()) {
				loadData();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback (in case subscription doesn't work)
		// Reduced frequency to avoid performance issues
		const pollInterval = setInterval(() => {
			loadData();
		}, 3000); // Poll every 3 seconds

		return () => {
			unsubscribe();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [account, sessionManager]);

	return data;
}
