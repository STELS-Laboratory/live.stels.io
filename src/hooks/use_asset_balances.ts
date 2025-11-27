/**
 * Hook for getting all asset balances
 * Implements getAssetBalances API method
 * Recommended for getting balances for multiple tokens (more efficient than multiple getAssetBalance calls)
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
 * Account value structure from API
 */
export interface AccountValue {
	aid?: string;
	exchange?: string;
	note?: string;
	apiKey?: string;
	secret?: string;
	password?: string;
	channel?: string;
	module?: string;
	widget?: string;
	raw?: {
		wallet?: {
			info?: {
				result?: {
					list?: Array<{
						coin?: Array<{
							usdValue?: string | number;
							coin?: string;
							[key: string]: unknown;
						}>;
						[key: string]: unknown;
					}>;
					[key: string]: unknown;
				};
				[key: string]: unknown;
			};
			[key: string]: unknown;
		};
		connection?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/**
 * Asset record structure from API
 */
export interface AssetRecord {
	channel: string;
	module: string;
	raw: {
		genesis: {
			token?: {
				id?: string;
				metadata?: {
					icon?: string;
					name?: string;
					symbol?: string;
					decimals?: number;
				};
			};
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	timestamp: number;
}

/**
 * Recent transaction structure from API
 */
export interface RecentTransaction {
	transaction: {
		from: string;
		to: string;
		amount: string;
		fee: string;
		token_id: string;
		network: string;
	};
	status: "confirmed" | "pending";
	submitted_at: number;
	tx_hash: string;
	pool_key: string[];
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
	accounts?: AccountValue[];
	assets?: AssetRecord[];
	recent_transactions?: RecentTransaction[];
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
	accounts: AccountValue[];
	assets: AssetRecord[];
	recentTransactions: RecentTransaction[];
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
	const [accounts, setAccounts] = useState<AccountValue[]>([]);
	const [assets, setAssets] = useState<AssetRecord[]>([]);
	const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

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

	const fetchBalances = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSessionRef.current) {

			return;
		}

		const apiUrl = apiUrlRef.current || connectionSessionRef.current.api;
		const network = params.network || networkRef.current || connectionSessionRef.current.network;

		if (!apiUrl || !network) {

			return;
		}

		if (!params.address) {

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

			const session = sessionRef.current || connectionSessionRef.current.session;
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stels-session": session,
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
						accounts?: AccountValue[];
						assets?: AssetRecord[];
						recent_transactions?: RecentTransaction[];
						[key: string]: unknown;
					};

					const balancesData: AssetBalanceItem[] =
						balancesResult.balances?.map((balance) => ({
							token_id: balance.token_id,
							balance: balance.balance,
							decimals: balance.decimals ?? 6,
							currency: balance.currency || "",
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
					
					// Extract and set new fields
					setAccounts(balancesResult.accounts || []);
					setAssets(balancesResult.assets || []);
					setRecentTransactions(balancesResult.recent_transactions || []);

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
					
					// Extract and set new fields
					setAccounts(balancesResponse.accounts || []);
					setAssets(balancesResponse.assets || []);
					setRecentTransactions(balancesResponse.recent_transactions || []);

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
					: "Failed to fetch balances";
			setError(errorMessage);

		} finally {
			setLoading(false);
		}
	}, [
		isAuthenticated,
		isConnected,
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
	}, [params.address, params.network, connectionSession?.network, balances.length]);
	
	// Track last fetch to prevent unnecessary refetches
	const lastFetchRef = useRef<{
		address: string;
		network: string;
		session: string;
		timestamp: number;
	} | null>(null);
	
	useEffect(() => {
		if (!params.address || !isAuthenticated || !isConnected || !connectionSession) {
			return;
		}

		const network = params.network || connectionSession.network;
		const session = connectionSession.session;
		const now = Date.now();
		
		// Check if we already fetched for this address/network/session recently (within 5 seconds)
		const lastFetch = lastFetchRef.current;
		if (
			lastFetch &&
			lastFetch.address === params.address &&
			lastFetch.network === network &&
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
			session,
			timestamp: now,
		};

		fetchBalances();
	}, [
		isAuthenticated,
		isConnected,
		connectionSession,
		params.address,
		params.network,
		fetchBalances,
	]);

	return {
		balances,
		loading,
		error,
		total,
		accounts,
		assets,
		recentTransactions,
		refetch: fetchBalances,
	};
}
