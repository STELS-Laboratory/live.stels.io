/**
 * Hook for querying transaction by hash (public, no auth required)
 * Implements getAssetTransactionByHash API method
 */

import { useState, useCallback } from "react";
import { useNetworkStore } from "@/stores/modules/network.store";

/**
 * Asset transaction structure
 */
export interface PublicAssetTransaction {
	type: "asset.transfer";
	version: string;
	network: {
		id: string;
		chain_id: number;
	};
	token_id: string;
	from: string;
	to: string;
	amount: string;
	fee: string;
	currency: string;
	timestamp: number;
	prev_hash: string | null;
	memo?: string;
	signatures: Array<{
		kid: string;
		alg: "ecdsa-secp256k1";
		sig: string;
	}>;
}

/**
 * Transaction query result
 */
export interface PublicTransactionResult {
	transaction: PublicAssetTransaction;
	status: "pending" | "confirmed" | "failed";
	submitted_at: number;
	tx_hash: string;
	pool_key: string[];
}

/**
 * Get transaction by hash parameters
 */
export interface GetTransactionByHashParams {
	tx_hash: string;
	network?: string; // Not used, kept for compatibility
	token_id?: string;
	nodeType?: string; // "local" or "testnet" - determines API URL
}

/**
 * Hook return type
 */
export interface UsePublicTransactionReturn {
	transaction: PublicTransactionResult | null;
	loading: boolean;
	error: string | null;
	hasSearched: boolean; // Track if a search has been performed
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
 * Get transaction by hash from API (public, no auth required)
 */
export function usePublicTransaction(
	params: GetTransactionByHashParams,
): UsePublicTransactionReturn {
	const [transaction, setTransaction] = useState<PublicTransactionResult | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState<boolean>(false);
	const { currentNetworkId } = useNetworkStore();

	const fetchTransaction = useCallback(async (): Promise<void> => {
		if (!params.tx_hash || params.tx_hash.trim().length === 0) {
			setError("Transaction hash is required");
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
				method: "getAssetTransactionByHash",
				params: [network],
				body: {
					tx_hash: params.tx_hash.trim(),
					network: network,
					...(params.token_id && { token_id: params.token_id }),
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
					throw new Error("Transaction not found");
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: { 
				result?: { 
					success?: boolean;
					transaction?: PublicAssetTransaction;
					status?: "pending" | "confirmed" | "failed";
					submitted_at?: number;
					tx_hash?: string;
					pool_key?: string[];
					submitted_by?: string;
					validation_result?: unknown;
				} | PublicTransactionResult 
			} = await response.json();

			if (data.result) {
				// Handle API response format according to documentation
				// Format: { success: true, transaction: {...}, status: "...", tx_hash: "...", ... }
				if ("success" in data.result && data.result.success && data.result.transaction) {
					const txResult: PublicTransactionResult = {
						transaction: data.result.transaction,
						status: data.result.status || "pending",
						submitted_at: data.result.submitted_at || Date.now(),
						tx_hash: data.result.tx_hash || "",
						pool_key: data.result.pool_key || [],
					};
					setTransaction(txResult);
					setHasSearched(true);

				} else if ("transaction" in data.result && "tx_hash" in data.result) {
					// Direct transaction result format
					setTransaction(data.result as PublicTransactionResult);
					setHasSearched(true);

				} else {
					setHasSearched(true);
					throw new Error("Transaction not found or invalid response");
				}
			} else {
				setHasSearched(true);
				throw new Error("Transaction not found or invalid response");
			}
		} catch(err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch transaction";
			setError(errorMessage);
			setHasSearched(true);

			setTransaction(null);
		} finally {
			setLoading(false);
		}
	}, [params.tx_hash, params.token_id, params.nodeType]);

	return {
		transaction,
		loading,
		error,
		hasSearched,
		refetch: fetchTransaction,
	};
}
