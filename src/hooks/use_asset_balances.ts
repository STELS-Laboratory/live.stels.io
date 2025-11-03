/**
 * Hook for getting all asset balances
 * Implements getAssetBalances API method
 * Recommended for getting balances for multiple tokens (more efficient than multiple getAssetBalance calls)
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores";
import {
	getCachedBalances,
	setCachedBalances,
} from "./balance_cache";

/**
 * Balance item in balances array
 */
export interface AssetBalanceItem {
	token_id: string;
	balance: string;
	decimals: number;
	currency: string;
	symbol: string;
	initial_balance: string;
	total_received: string;
	total_sent: string;
	total_fees: string;
	transaction_count: number;
}

/**
 * All balances response structure
 */
export interface AssetBalancesResponse {
	success: boolean;
	address: string;
	network: string;
	balances: AssetBalanceItem[];
	total: number;
	timestamp: number;
}

/**
 * Get all balances parameters
 */
export interface GetBalancesParams {
	address: string;
	network?: string;
}

/**
 * Hook return type
 */
export interface UseAssetBalancesReturn {
	balances: AssetBalanceItem[];
	loading: boolean;
	error: string | null;
	total: number;
	refetch: () => Promise<void>;
}

/**
 * Get all asset balances from API
 * This is more efficient than making multiple getAssetBalance calls
 */
export function useAssetBalances(
	params: GetBalancesParams,
): UseAssetBalancesReturn {
	const { connectionSession, isAuthenticated, isConnected } = useAuthStore();
	
	// Initialize from global cache if available
	const network = params.network || connectionSession?.network || "testnet";
	const cacheKey = params.address ? `${params.address}-${network}` : "";
	const cachedData = cacheKey ? getCachedBalances(params.address, network) : null;
	
	const [balances, setBalances] = useState<AssetBalanceItem[]>(
		cachedData || [],
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState<number>(cachedData?.length || 0);

	const fetchBalances = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSession) {
			console.log(
				"[useAssetBalances] Not authenticated or connected, skipping",
			);
			return;
		}

		const apiUrl = connectionSession.api;
		const network = params.network || connectionSession.network;

		if (!apiUrl || !network) {
			console.error("[useAssetBalances] Missing API URL or network");
			return;
		}

		if (!params.address) {
			console.error("[useAssetBalances] Missing address");
			return;
		}

		// Don't clear balances during refetch - keep cached values
		setLoading(true);
		setError(null);
		
		// Use cached balances from global cache if available
		const cached = getCachedBalances(params.address, network);
		if (cached && cached.length > 0) {
			setBalances(cached);
			setTotal(cached.length);
		}

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getAssetBalances",
				params: [network],
				body: {
					address: params.address,
					network: params.network || network,
				},
			};

			console.log("[useAssetBalances] Fetching balances", {
				apiUrl,
				network,
				address: params.address,
			});

			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stels-session": connectionSession.session,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage =
					errorData.error?.message ||
					(response.status === 429
						? "Too many requests. Please wait before making another request."
						: `HTTP error! status: ${response.status}`);

				throw new Error(errorMessage);
			}

			const data: {
				result?: AssetBalancesResponse | {
					success: boolean;
					[key: string]: unknown;
				};
			} = await response.json();

			if (data.result) {
				// Handle both response formats
				// Format 1: {result: AssetBalancesResponse}
				// Format 2: {result: {success: true, balances: ..., total: ..., ...}}
				if ("success" in data.result && data.result.success) {
					// Format 2: Extract balances from result
					const balancesResult = data.result as {
						success: boolean;
						address: string;
						network: string;
						balances?: Array<{
							token_id: string;
							balance: string;
							decimals?: number;
							currency?: string;
							symbol?: string;
							initial_balance?: string;
							total_received?: string;
							total_sent?: string;
							total_fees?: string;
							transaction_count?: number;
						}>;
						total?: number;
						timestamp?: number;
						[key: string]: unknown;
					};

					const balancesData: AssetBalanceItem[] =
						balancesResult.balances?.map((balance) => ({
							token_id: balance.token_id,
							balance: balance.balance,
							decimals: balance.decimals ?? 6,
							currency: balance.currency || "TST",
							symbol: balance.symbol || "",
							initial_balance: balance.initial_balance || "0",
							total_received: balance.total_received || "0",
							total_sent: balance.total_sent || "0",
							total_fees: balance.total_fees || "0",
							transaction_count: balance.transaction_count || 0,
						})) || [];

					// Update global cache and state
					// Add timestamp to cached items
					const cachedBalances: Array<typeof balancesData[0] & { timestamp: number }> = 
						balancesData.map((balance) => ({
							...balance,
							timestamp: Date.now(),
						}));
					setCachedBalances(params.address, network, cachedBalances);
					setBalances(balancesData);
					setTotal(balancesResult.total || balancesData.length);
					console.log(
						`[useAssetBalances] Balances fetched: ${balancesData.length} tokens`,
					);
				} else if ("balances" in data.result) {
					// Format 1: Direct AssetBalancesResponse
					const balancesResponse = data.result as AssetBalancesResponse;
					// Update global cache and state
					// Add timestamp to cached items
					const cachedBalances: Array<typeof balancesResponse.balances[0] & { timestamp: number }> = 
						balancesResponse.balances.map((balance) => ({
							...balance,
							timestamp: Date.now(),
						}));
					setCachedBalances(params.address, network, cachedBalances);
					setBalances(balancesResponse.balances);
					setTotal(balancesResponse.total);
					console.log(
						`[useAssetBalances] Balances fetched: ${balancesResponse.balances.length} tokens`,
					);
				} else {
					throw new Error("Invalid response format");
				}
			} else {
				throw new Error("Invalid response format");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch balances";
			setError(errorMessage);
			console.error("[useAssetBalances] Error:", err);
		} finally {
			setLoading(false);
		}
	}, [
		isAuthenticated,
		isConnected,
		connectionSession,
		params.address,
		params.network,
	]);

	// Initialize from cache on mount if state is empty
	useEffect(() => {
		if (balances.length === 0 && params.address) {
			const cached = getCachedBalances(
				params.address,
				params.network || connectionSession?.network || "testnet",
			);
			if (cached && cached.length > 0) {
				setBalances(cached);
				setTotal(cached.length);
			}
		}
	}, [params.address, params.network, connectionSession?.network]);
	
	useEffect(() => {
		if (params.address) {
			fetchBalances();
		}
	}, [fetchBalances, params.address]);

	return {
		balances,
		loading,
		error,
		total,
		refetch: fetchBalances,
	};
}

