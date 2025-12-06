/**
 * Hook for querying asset transactions
 * Implements getAllMyTransactions API method
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
	consensus_status?: "pending" | "confirmed" | "not_found";
	finalized?: boolean;
}

/**
 * Get transactions parameters
 * Note: address is optional for getAllMyTransactions (uses session)
 * Kept for backward compatibility but not sent to API
 */
export interface GetTransactionsParams {
	address?: string; // Optional - not used in getAllMyTransactions (uses session)
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
	network?: string;
	limit?: number;
	offset?: number;
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

	// Use refs to track stable values for connectionSession
	const connectionSessionRef = useRef(connectionSession);
	const apiUrlRef = useRef<string | null>(null);
	const networkRef = useRef<string | null>(null);
	const sessionRef = useRef<string | null>(null);

	// Update refs when connectionSession changes
	useEffect(() => {
		if (connectionSession) {
			connectionSessionRef.current = connectionSession;
			apiUrlRef.current = connectionSession.api;
			networkRef.current = connectionSession.network;
			sessionRef.current = connectionSession.session;
		}
	}, [connectionSession]);

	// Track last fetch to prevent unnecessary refetches
	const lastFetchRef = useRef<{
		address: string;
		network: string;
		token_id?: string;
		status?: string;
		session: string;
		timestamp: number;
	} | null>(null);

	const fetchTransactions = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSessionRef.current) {

			return;
		}

		const apiUrl = apiUrlRef.current || connectionSessionRef.current.api;
		const network = params.network || networkRef.current || connectionSessionRef.current.network;

		if (!apiUrl || !network) {
			return;
		}

		// Note: address is not required for getAllMyTransactions (uses session)
		// But we keep the check for backward compatibility
		if (!params.address && !connectionSessionRef.current.session) {
			return;
		}

		const session = sessionRef.current || connectionSessionRef.current.session;
		const now = Date.now();

		// Check if we already fetched for this address/network/session recently (within 5 seconds)
		const lastFetch = lastFetchRef.current;
		if (
			lastFetch &&
			lastFetch.address === params.address &&
			lastFetch.network === network &&
			lastFetch.token_id === params.token_id &&
			lastFetch.status === (params.status || "all") &&
			lastFetch.session === session &&
			now - lastFetch.timestamp < 5000
		) {
			// Skip if recently fetched with same parameters

			return;
		}

		// Update last fetch info
		lastFetchRef.current = {
			address: params.address,
			network,
			token_id: params.token_id,
			status: params.status || "all",
			session,
			timestamp: now,
		};

		setLoading(true);
		setError(null);

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getAllMyTransactions",
				params: [network],
				body: {
					network: params.network || network,
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
					"stels-session": session,
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

			} else {
				throw new Error("Transaction query failed");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch transactions";
			setError(errorMessage);

		} finally {
			setLoading(false);
		}
	}, [
		isAuthenticated,
		isConnected,
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
