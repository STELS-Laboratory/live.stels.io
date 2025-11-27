/**
 * Hook for getting asset balance
 * Implements getAssetBalance API method
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores";
import {
	getCachedBalance,
	setCachedBalance,
} from "./balance_cache";

/**
 * Balance response structure
 */
export interface AssetBalance {
	balance: string;
	currency: string;
	decimals: number;
	initial_balance: string;
	total_received: string;
	total_sent: string;
	total_fees: string;
	transaction_count: number;
}

/**
 * Get balance parameters
 */
export interface GetBalanceParams {
	address: string;
	network?: string;
	token_id: string;
}

/**
 * Hook return type
 */
export interface UseAssetBalanceReturn {
	balance: AssetBalance | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Get asset balance from API
 */
export function useAssetBalance(
	params: GetBalanceParams,
): UseAssetBalanceReturn {
	const { connectionSession, isAuthenticated, isConnected } = useAuthStore();
	
	// Initialize from global cache if available
	const network = params.network || connectionSession?.network || "testnet";
	const cachedData = params.address && params.token_id
		? getCachedBalance(params.address, network, params.token_id)
		: null;
	
	const [balance, setBalance] = useState<AssetBalance | null>(
		cachedData ? {
			balance: cachedData.balance,
			currency: cachedData.currency,
			decimals: cachedData.decimals,
			initial_balance: cachedData.initial_balance,
			total_received: cachedData.total_received,
			total_sent: cachedData.total_sent,
			total_fees: cachedData.total_fees,
			transaction_count: cachedData.transaction_count,
		} : null,
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState<number>(0);

	const fetchBalance = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSession) {

			return;
		}

		const apiUrl = connectionSession.api;
		const network = params.network || connectionSession.network;

		if (!apiUrl || !network) {

			return;
		}

		if (!params.token_id) {

			return;
		}

		// Don't clear balance during refetch - keep cached value
		setLoading(true);
		setError(null);
		
		// Use cached balance from global cache if available
		const cached = getCachedBalance(params.address, network, params.token_id);
		if (cached) {
			setBalance({
				balance: cached.balance,
				currency: cached.currency,
				decimals: cached.decimals,
				initial_balance: cached.initial_balance,
				total_received: cached.total_received,
				total_sent: cached.total_sent,
				total_fees: cached.total_fees,
				transaction_count: cached.transaction_count,
			});
		}

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getAssetBalance",
				params: [network],
				body: {
					address: params.address,
					network: params.network || network,
					token_id: params.token_id,
				},
			};

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

				// For 429 errors, don't throw immediately - the delay in useEffect will handle retry
				if (response.status === 429) {
					throw new Error(errorMessage);
				}

				throw new Error(errorMessage);
			}

			const data: { result?: AssetBalance | { success: boolean; [key: string]: unknown } } =
				await response.json();

			if (data.result) {
				// Handle both response formats
				// Format 1: {result: AssetBalance}
				// Format 2: {result: {success: true, balance: ..., currency: ..., ...}}
				if ("success" in data.result && data.result.success) {
					// Format 2: Extract balance fields from result
					const balanceResult = data.result as {
						success: boolean;
						balance: string;
						currency?: string;
						decimals?: number;
						initial_balance?: string;
						total_received?: string;
						total_sent?: string;
						total_fees?: string;
						transaction_count?: number;
						[key: string]: unknown;
					};

					// Validate required fields
					if (!balanceResult.balance) {
						throw new Error("Balance field missing in response");
					}

					const balanceData: AssetBalance = {
						balance: balanceResult.balance,
						currency: balanceResult.currency || "",
						decimals: balanceResult.decimals ?? 6,
						initial_balance: balanceResult.initial_balance || "0",
						total_received: balanceResult.total_received || "0",
						total_sent: balanceResult.total_sent || "0",
						total_fees: balanceResult.total_fees || "0",
						transaction_count: balanceResult.transaction_count || 0,
					};

				// Update global cache and state
				setCachedBalance(params.address, network, params.token_id, {
					balance: balanceData.balance,
					currency: balanceData.currency,
					decimals: balanceData.decimals,
					initial_balance: balanceData.initial_balance,
					total_received: balanceData.total_received,
					total_sent: balanceData.total_sent,
					total_fees: balanceData.total_fees,
					transaction_count: balanceData.transaction_count,
					timestamp: Date.now(),
				});
				setBalance(balanceData);
				setRetryCount(0); // Reset retry count on success

				} else if ("balance" in data.result) {
					// Format 1: Direct AssetBalance
					const balanceData = data.result as AssetBalance;
					// Update global cache and state
					setCachedBalance(params.address, network, params.token_id, {
						balance: balanceData.balance,
						currency: balanceData.currency,
						decimals: balanceData.decimals,
						initial_balance: balanceData.initial_balance,
						total_received: balanceData.total_received,
						total_sent: balanceData.total_sent,
						total_fees: balanceData.total_fees,
						transaction_count: balanceData.transaction_count,
						timestamp: Date.now(),
					});
					setBalance(balanceData);
					setRetryCount(0); // Reset retry count on success

				} else {
					throw new Error("Invalid response format");
				}
			} else {
				throw new Error("Invalid response format");
			}
		} catch {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch balance";

			// Handle 429 errors with retry logic
			if (
				errorMessage.includes("Too many requests") ||
				errorMessage.includes("429")
			) {
				if (retryCount < 3) {
					// Retry after exponential backoff
					const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
					setTimeout(() => {
						setRetryCount((prev) => prev + 1);
						fetchBalance();
					}, retryDelay);
					return; // Don't set error, will retry
				}
			}

			setError(errorMessage);

		} finally {
			setLoading(false);
		}
	}, [
		isAuthenticated,
		isConnected,
		connectionSession,
		params.address,
		params.network,
		params.token_id,
		retryCount,
	]);

	// Initialize from cache on mount if state is empty
	useEffect(() => {
		if (!balance && params.address && params.token_id) {
			const cached = getCachedBalance(
				params.address,
				params.network || connectionSession?.network || "testnet",
				params.token_id,
			);
			if (cached) {
				setBalance({
					balance: cached.balance,
					currency: cached.currency,
					decimals: cached.decimals,
					initial_balance: cached.initial_balance,
					total_received: cached.total_received,
					total_sent: cached.total_sent,
					total_fees: cached.total_fees,
					transaction_count: cached.transaction_count,
				});
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.address, params.network, params.token_id, connectionSession?.network]);
	
	useEffect(() => {
		// Reset retry count when parameters change
		setRetryCount(0);
		setError(null);

		if (params.address && params.token_id) {
			// Add delay to prevent rate limiting (429 errors)
			// Stagger requests by token_id hash to distribute load across time
			// This prevents all tokens from requesting simultaneously
			const hash = params.token_id
				.split("")
				.reduce((acc, char) => acc + char.charCodeAt(0), 0);
			const delay = (hash % 15) * 200; // 0-2800ms delay spread (better distribution)

			const timeoutId = setTimeout(() => {
				fetchBalance();
			}, delay);

			return () => clearTimeout(timeoutId);
		}
	}, [fetchBalance, params.address, params.token_id]);

	return {
		balance,
		loading,
		error,
		refetch: fetchBalance,
	};
}
