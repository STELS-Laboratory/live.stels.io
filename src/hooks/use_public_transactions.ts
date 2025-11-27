/**
 * Hook for querying asset transactions (public, no auth required)
 * Implements getAssetTransactions API method
 */

import { useState, useCallback } from "react";

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
 * Get transactions parameters
 */
export interface GetPublicTransactionsParams {
	address: string;
	network?: string; // Not used, kept for compatibility
	token_id?: string;
	status?: "pending" | "confirmed" | "failed" | "all";
	limit?: number;
	offset?: number;
	nodeType?: string; // "local" or "testnet" - determines API URL
}

/**
 * Get transactions response
 */
interface GetPublicTransactionsResponse {
	success: boolean;
	transactions: PublicTransactionResult[];
	total: number;
	address: string;
}

/**
 * Hook return type
 */
export interface UsePublicTransactionsReturn {
	transactions: PublicTransactionResult[];
	loading: boolean;
	error: string | null;
	total: number;
	hasSearched: boolean; // Track if a search has been performed
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
function getApiUrl(_network: string, nodeType?: string): string {
	// Check localStorage for node type if not provided
	if (typeof window !== "undefined" && !nodeType) {
		nodeType = localStorage.getItem("explorer_node") || "testnet";
	}
	
	if (nodeType === "local") {
		return "http://10.0.0.238:8088/";
	}
	return "https://beta.stels.dev/";
}

/**
 * Get asset transactions from API (public, no auth required)
 */
export function usePublicTransactions(
	params: GetPublicTransactionsParams,
): UsePublicTransactionsReturn {
	const [transactions, setTransactions] = useState<PublicTransactionResult[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState<number>(0);
	const [hasSearched, setHasSearched] = useState<boolean>(false);

	const fetchTransactions = useCallback(async (): Promise<void> => {
		if (!params.address || params.address.trim().length === 0) {
			setError("Address is required");
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
				method: "getAssetTransactions",
				params: [network],
				body: {
					address: params.address.trim(),
					network: network,
					token_id: params.token_id,
					status: params.status || "all",
					limit: params.limit || 100,
					offset: params.offset || 0,
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
					throw new Error("No transactions found");
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: { result?: GetPublicTransactionsResponse } = await response.json();

			if (data.result?.success) {
				const transactionsList = data.result.transactions || [];
				setTransactions(transactionsList);
				setTotal(data.result.total || 0);
				setHasSearched(true);

			} else {
				setHasSearched(true);
				throw new Error("Transaction query failed");
			}
		} catch {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch transactions";
			setError(errorMessage);
			setHasSearched(true);

			setTransactions([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [
		params.address,
		params.token_id,
		params.status,
		params.limit,
		params.offset,
		params.nodeType,
	]);

	return {
		transactions,
		loading,
		error,
		total,
		hasSearched,
		refetch: fetchTransactions,
	};
}
