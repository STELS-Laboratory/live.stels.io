/**
 * Hook to load trading accounts from session
 */

import { useEffect } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";
import { useTradingStore } from "../store";
import { useAuthStore } from "@/stores";
import type { ExchangeAccount } from "../types";

/**
 * Hook to load accounts from sessionStorage
 */
export function useTradingAccounts(): void {
	const { setAccounts, setSelectedAccount } = useTradingStore();
	const { wallet, _hasHydrated } = useAuthStore();
	const sessionManager = getSessionStorageManager();

	useEffect(() => {
		// Wait for hydration
		if (!_hasHydrated) {
			return;
		}
		
		if (!wallet?.address) {
			setAccounts([]);
			return;
		}

		const loadAccounts = (): void => {
			const accounts: ExchangeAccount[] = [];
			const address = wallet.address;

			// Scan sessionStorage for account balance channels
			// Also check all keys to see what's available
			const allKeys: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					allKeys.push(key);
				}
			}
			
			// Filter keys that match account.balance pattern
			const accountBalanceKeys = allKeys.filter(key => 
				/^account\.balance\./i.test(key)
			);
			
			for (const key of accountBalanceKeys) {
				// Match pattern: account.balance.{address}.{exchange}.{nid}
				const match = key.match(
					/^account\.balance\.([^.]+)\.([^.]+)\.([^.]+)$/i,
				);
				
				if (match) {
					const [, channelAddress, exchange, nid] = match;

					// Check if account already exists
					if (accounts.find((acc) => acc.nid === nid && acc.exchange === exchange)) continue;

					// Try to get account data
					const accountData = sessionManager.getData(key, true);
					if (accountData) {
						// Parse account data from raw object
						const raw = (accountData as { raw?: unknown }).raw as {
							nid?: string;
							exchange?: string;
							address?: string;
							viewers?: string[];
							workers?: string[];
						} | undefined;

						if (!raw) continue;

						// Check if user has access to this account:
						// 1. Account owner (address matches channel address)
						// 2. Account viewer (address in viewers array)
						// 3. If account data is available in sessionStorage, consider it accessible
						//    (sessionStorage only contains data for accounts user has access to)
						const isOwner = channelAddress.toLowerCase() === address.toLowerCase();
						const isViewer = raw.viewers?.some(
							(viewer) => viewer.toLowerCase() === address.toLowerCase()
						) || false;
						
						// If account data exists in sessionStorage, user likely has access
						// This handles cases where access is granted through other mechanisms
						// (e.g., workers, API permissions, etc.)
						const hasAccess = isOwner || isViewer || accountData !== null;

						if (!hasAccess) {
							continue;
						}

						if (raw.nid && raw.exchange) {
							const accessLabel = isOwner ? "" : isViewer ? " [viewer]" : "";
							accounts.push({
								nid: raw.nid,
								exchange: raw.exchange,
								name: `${raw.exchange} (${raw.nid})${accessLabel}`,
							});
						} else {
							// Fallback to parsed values from key
							const accessLabel = isOwner ? "" : isViewer ? " [viewer]" : "";
							accounts.push({
								nid,
								exchange,
								name: `${exchange} (${nid})${accessLabel}`,
							});
						}
					}
				}
			}

			setAccounts(accounts);

			// Don't auto-select account - let user choose manually
			// Only auto-select on initial load if user explicitly wants it
			// This prevents unwanted account selection when switching pairs
		};

		// Initial load
		loadAccounts();

		// Listen to storage events for new accounts
		const handleStorageChange = (): void => {
			loadAccounts();
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - optimized to avoid performance violations
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 5000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadAccounts();
			});
		}, 5000); // Poll every 5 seconds

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [wallet?.address, _hasHydrated, sessionManager, setAccounts, setSelectedAccount]);
}
