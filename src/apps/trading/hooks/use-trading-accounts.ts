/**
 * Hook to load trading accounts from session
 */

import { useEffect } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui";
import { useTradingStore } from "../store";
import { useAuthStore, useAccountsStore } from "@/stores";
import type { ExchangeAccount } from "../types";

/**
 * Hook to load accounts from sessionStorage
 */
export function useTradingAccounts(): void {
	const { setAccounts, setSelectedAccount } = useTradingStore();
	const { wallet, _hasHydrated } = useAuthStore();
	const { accounts: storedAccounts } = useAccountsStore();
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

			// First, check accounts from accounts store (from listAccounts API response)
			// If server returns an account, user has access to it (server already filtered by access)
			const accountsFromStore = new Map<string, ExchangeAccount>();
			for (const storedAccount of storedAccounts) {
				const nid = storedAccount.account.nid;
				const exchange = storedAccount.account.exchange;
				const key = `${exchange}.${nid}`;
				
				if (nid && exchange) {
					const isOwner = storedAccount.address.toLowerCase() === address.toLowerCase();
					const isViewer = storedAccount.account.viewers?.some(
						(viewer) => viewer.toLowerCase() === address.toLowerCase()
					) || false;
					
					// If account is in store, server returned it, so user has access
					// Server already filtered accounts by access, so we trust it
					const accessLabel = isOwner ? "" : isViewer ? " [viewer]" : "";
					accountsFromStore.set(key, {
						nid,
						exchange,
						name: `${exchange} (${nid})${accessLabel}`,
					});
				}
			}

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
					const accountKey = `${exchange}.${nid}`;

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
						// 3. Account is in accounts store (server returned it, so user has access)
						// Note: workers array contains module names (e.g., "balance"), not user addresses
						const isOwner = channelAddress.toLowerCase() === address.toLowerCase();
						const isViewer = raw.viewers?.some(
							(viewer) => viewer.toLowerCase() === address.toLowerCase()
						) || false;
						const isInStore = accountsFromStore.has(accountKey);
						
						// Show accounts where user has explicit access OR account is in store (server returned it)
						const hasAccess = isOwner || isViewer || isInStore;

						if (!hasAccess) {
							continue;
						}

						// Use account from store if available (has correct access label), otherwise use sessionStorage data
						if (isInStore && accountsFromStore.has(accountKey)) {
							const accountFromStore = accountsFromStore.get(accountKey);
							if (accountFromStore) {
								accounts.push(accountFromStore);
								continue;
							}
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

			// Also add accounts from store that might not be in sessionStorage yet
			for (const account of accountsFromStore.values()) {
				if (!accounts.find((acc) => acc.nid === account.nid && acc.exchange === account.exchange)) {
					accounts.push(account);
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
	}, [wallet?.address, _hasHydrated, sessionManager, setAccounts, setSelectedAccount, storedAccounts]);
}
