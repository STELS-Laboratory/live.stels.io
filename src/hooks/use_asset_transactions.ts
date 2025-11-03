/**
 * Hook for querying asset transactions
 * Implements getAssetTransactions API method
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores";

/**
 * Asset transaction structure
 */
export interface AssetTransaction {
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
export interface TransactionResult {
	transaction: AssetTransaction;
	status: "pending" | "confirmed" | "failed";
	submitted_at: number;
	tx_hash: string;
	pool_key: string[];
}

/**
 * Get transactions parameters
 */
export interface GetTransactionsParams {
	address: string;
	network?: string;
	token_id?: string;
	status?: "pending" | "confirmed" | "failed" | "all";
	limit?: number;
	offset?: number;
}

/**
 * Get transactions response
 */
interface GetTransactionsResponse {
	success: boolean;
	transactions: TransactionResult[];
	total: number;
	address: string;
}

/**
 * Hook return type
 */
export interface UseAssetTransactionsReturn {
	transactions: TransactionResult[];
	loading: boolean;
	error: string | null;
	total: number;
	refetch: () => Promise<void>;
}

/**
 * Get asset transactions from API
 */
export function useAssetTransactions(
	params: GetTransactionsParams,
): UseAssetTransactionsReturn {
	const [transactions, setTransactions] = useState<TransactionResult[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState<number>(0);

	const { connectionSession, isAuthenticated, isConnected } = useAuthStore();

	const fetchTransactions = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSession) {
			console.log(
				"[useAssetTransactions] Not authenticated or connected, skipping",
			);
			return;
		}

		const apiUrl = connectionSession.api;
		const network = params.network || connectionSession.network;

		if (!apiUrl || !network) {
			console.error("[useAssetTransactions] Missing API URL or network");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getAssetTransactions",
				params: [network],
				body: {
					address: params.address,
					network: params.network || network,
					token_id: params.token_id,
					status: params.status || "all",
					limit: params.limit || 100,
					offset: params.offset || 0,
				},
			};

			console.log("[useAssetTransactions] Fetching transactions", {
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
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: { result?: GetTransactionsResponse } = await response.json();

			if (data.result?.success) {
				setTransactions(data.result.transactions || []);
				setTotal(data.result.total || 0);
				console.log(
					"[useAssetTransactions] Transactions fetched:",
					data.result.transactions.length,
				);
			} else {
				throw new Error("Transaction query failed");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch transactions";
			setError(errorMessage);
			console.error("[useAssetTransactions] Error:", err);
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
		params.status,
		params.limit,
		params.offset,
	]);

	// Don't auto-fetch - let parent component control when to fetch
	// This allows lazy loading when tab is opened
	// useEffect(() => {
	// 	if (params.address) {
	// 		fetchTransactions();
	// 	}
	// }, [fetchTransactions, params.address]);

	return {
		transactions,
		loading,
		error,
		total,
		refetch: fetchTransactions,
	};
}

