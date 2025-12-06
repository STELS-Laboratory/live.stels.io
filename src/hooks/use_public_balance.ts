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
	return network ? `${network.api}/` : "http://10.0.0.238:8088/";
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
				// Format 1: {result: {success: true, balance: {balance: "...", currency: "...", ...}, ...}}
				// Format 2: {result: PublicAssetBalance} (legacy format)
				if ("success" in data.result && data.result.success) {
					// Format 1: Extract balance from result.balance object
					const balanceObj = data.result.balance;
					
					if (!balanceObj) {
						throw new Error("Balance object missing in response");
					}

					// Handle both object balance (new format) and direct balance (legacy)
					const balanceData: PublicAssetBalance = typeof balanceObj === "string"
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
