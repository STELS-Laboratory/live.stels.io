/**
 * Hook for getting asset balance (public, no auth required)
 * Implements getAssetBalance API method
 */

import { useState, useCallback } from "react";
import { useNetworkStore } from "@/stores/modules/network.store";

/**
 * Balance response structure
 */
export interface PublicAssetBalance {
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
export interface GetPublicBalanceParams {
	address: string;
	network?: string; // Not used, kept for compatibility
	token_id: string;
	nodeType?: string; // "local" or "testnet" - determines API URL
}

/**
 * Hook return type
 */
export interface UsePublicBalanceReturn {
	balance: PublicAssetBalance | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Get API URL from network store
 */
function getApiUrl(networkId: string): string {
	const networkStore = useNetworkStore.getState();
	const network = networkStore.getNetwork(networkId);
	return network ? `${network.api}/` : "http://10.0.0.206:8088/";
}

/**
 * Get asset balance from API (public, no auth required)
 */
export function usePublicBalance(
	params: GetPublicBalanceParams,
): UsePublicBalanceReturn {
	const [balance, setBalance] = useState<PublicAssetBalance | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const { currentNetworkId } = useNetworkStore();

	const fetchBalance = useCallback(async (): Promise<void> => {
		if (!params.address || params.address.trim().length === 0) {
			setError("Address is required");
			return;
		}

		if (!params.token_id || params.token_id.trim().length === 0) {
			setError("Token ID is required");
			return;
		}

		// Use network from params or current network from store
		const network = params.network || currentNetworkId;
		const apiUrl = getApiUrl(network);

		setLoading(true);
		setError(null);

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getAssetBalance",
				params: [network],
				body: {
					address: params.address.trim(),
					network: network,
					token_id: params.token_id.trim(),
				},
			};

			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Balance not found");
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: { 
				result?: {
					success: boolean;
					balance?: PublicAssetBalance | {
						balance: string;
						currency?: string;
						decimals?: number;
						initial_balance?: string;
						total_received?: string;
						total_sent?: string;
						total_fees?: string;
						transaction_count?: number;
					};
					token_id?: string;
					address?: string;
					[key: string]: unknown;
				} | PublicAssetBalance;
			} = await response.json();

			if (data.result) {
				// Handle response formats according to updated API documentation
				// Format 1: {result: {success: true, balance: "...", currency: "...", ...}} (balance fields directly in result)
				// Format 2: {result: {success: true, balance: {balance: "...", currency: "...", ...}, ...}} (nested balance object)
				// Format 3: {result: PublicAssetBalance} (legacy format)
				if ("success" in data.result && data.result.success) {
					// Check if balance fields are directly in result (Format 1)
					const hasDirectBalanceFields = "balance" in data.result && 
						typeof data.result.balance === "string" &&
						("currency" in data.result || "decimals" in data.result);
					
					// Check if balance is nested in result.balance (Format 2)
					const balanceObj = data.result.balance;
					
					let balanceData: PublicAssetBalance;
					
					if (hasDirectBalanceFields) {
						// Format 1: Balance fields directly in result
						balanceData = {
							balance: (data.result.balance as string) || "0",
							currency: (data.result.currency as string) || "",
							decimals: (data.result.decimals as number) ?? 6,
							initial_balance: (data.result.initial_balance as string) || "0",
							total_received: (data.result.total_received as string) || "0",
							total_sent: (data.result.total_sent as string) || "0",
							total_fees: (data.result.total_fees as string) || "0",
							transaction_count: (data.result.transaction_count as number) || 0,
						};
					} else if (balanceObj) {
						// Format 2: Balance nested in result.balance object
						// Handle both string balance (legacy) and object balance (new format)
						balanceData = typeof balanceObj === "string"
							? {
								balance: balanceObj,
								currency: "",
								decimals: 6,
								initial_balance: "0",
								total_received: "0",
								total_sent: "0",
								total_fees: "0",
								transaction_count: 0,
							}
							: {
								balance: balanceObj.balance,
								currency: balanceObj.currency || "",
								decimals: balanceObj.decimals ?? 6,
								initial_balance: balanceObj.initial_balance || "0",
								total_received: balanceObj.total_received || "0",
								total_sent: balanceObj.total_sent || "0",
								total_fees: balanceObj.total_fees || "0",
								transaction_count: balanceObj.transaction_count || 0,
							};
					} else {
						throw new Error("Balance data missing in response");
					}
					setBalance(balanceData);

				} else if ("balance" in data.result && typeof data.result.balance === "string") {
					// Format 2: Legacy direct PublicAssetBalance format
					const balanceData = data.result as PublicAssetBalance;
					setBalance(balanceData);

				} else {
					throw new Error("Invalid response format");
				}
			} else {
				throw new Error("Invalid response format");
			}
		} catch(err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch balance";
			setError(errorMessage);

			setBalance(null);
		} finally {
			setLoading(false);
		}
	}, [params.address, params.token_id, params.network, currentNetworkId]);

	return {
		balance,
		loading,
		error,
		refetch: fetchBalance,
	};
}
