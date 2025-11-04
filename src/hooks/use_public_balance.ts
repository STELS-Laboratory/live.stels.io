/**
 * Hook for getting asset balance (public, no auth required)
 * Implements getAssetBalance API method
 */

import { useState, useCallback } from "react";

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
 * Default API URL for public requests
 */
const DEFAULT_NETWORK = "testnet";

/**
 * Get API URL based on node type selection
 * Network parameter is always "testnet" as per API requirements
 */
function getApiUrl(network: string, nodeType?: string): string {
	// Check localStorage for node type if not provided
	if (typeof window !== "undefined" && !nodeType) {
		nodeType = localStorage.getItem("explorer_node") || "testnet";
	}
	
	if (nodeType === "local") {
		return "http://10.0.0.238:8088/";
	}
	return "https://live.stels.dev/";
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

	const fetchBalance = useCallback(async (): Promise<void> => {
		if (!params.address || params.address.trim().length === 0) {
			setError("Address is required");
			return;
		}

		if (!params.token_id || params.token_id.trim().length === 0) {
			setError("Token ID is required");
			return;
		}

		// Network parameter is always "testnet" as per API requirements
		const network = DEFAULT_NETWORK;
		
		// Get node type from localStorage or params
		const nodeType = params.nodeType || (typeof window !== "undefined" ? localStorage.getItem("explorer_node") || "testnet" : "testnet");
		const apiUrl = getApiUrl(network, nodeType);

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

			console.log("[usePublicBalance] Fetching balance", {
				apiUrl,
				network,
				address: params.address,
				token_id: params.token_id,
			});

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

			const data: { result?: { success?: boolean; balance?: PublicAssetBalance; } | PublicAssetBalance } = await response.json();

			if (data.result) {
				if ("success" in data.result && data.result.success && data.result.balance) {
					const balanceData: PublicAssetBalance = {
						balance: data.result.balance.balance,
						currency: data.result.balance.currency || "",
						decimals: data.result.balance.decimals ?? 6,
						initial_balance: data.result.balance.initial_balance || "0",
						total_received: data.result.balance.total_received || "0",
						total_sent: data.result.balance.total_sent || "0",
						total_fees: data.result.balance.total_fees || "0",
						transaction_count: data.result.balance.transaction_count || 0,
					};
					setBalance(balanceData);
					console.log("[usePublicBalance] Balance fetched:", balanceData);
				} else if ("balance" in data.result) {
					const balanceData = data.result as PublicAssetBalance;
					setBalance(balanceData);
					console.log("[usePublicBalance] Balance fetched:", balanceData);
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
					: "Failed to fetch balance";
			setError(errorMessage);
			console.error("[usePublicBalance] Error:", err);
			setBalance(null);
		} finally {
			setLoading(false);
		}
	}, [params.address, params.network, params.token_id]);

	return {
		balance,
		loading,
		error,
		refetch: fetchBalance,
	};
}

