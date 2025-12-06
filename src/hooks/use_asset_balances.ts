/**
 * Hook for getting all asset balances
 * Implements getAssetBalances API method
 * Recommended for getting balances for multiple tokens (more efficient than multiple getAssetBalance calls)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores";
import { useNetworkStore } from "@/stores/modules/network.store";
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
	mined?: string;
	mined_sli?: string;
	total_balance?: string; // Raw total balance (balance + mined)
	total_balance_sli?: string; // Human-readable total balance (balance + mined)
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
 * Staking data structure
 */
export interface StakingData {
	amount: string;
	amount_sli: string;
	locked_until: string;
	locked_until_date: string;
	is_locked: boolean;
	min_stake: string;
	min_stake_sli: string;
	is_notary: boolean;
}

/**
 * Mining reward history item
 */
export interface MiningRewardHistory {
	epoch: number;
	amount: string;
	amount_sli: string;
	operation_count: number;
	rating_score: number;
	vrf_modifier: number;
	timestamp: number;
}

/**
 * Mining data structure
 */
export interface MiningData {
	total_mined: string;
	total_mined_sli: string;
	last_reward_epoch: number;
	rewards_history?: MiningRewardHistory[];
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
	staking?: StakingData;
	mining?: MiningData;
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
	staking: StakingData | null;
	mining: MiningData | null;
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
	
	// Get network from params, connection session, or network store
	const { currentNetworkId } = useNetworkStore();
	const network = params.network || connectionSession?.network || currentNetworkId;
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
	const [staking, setStaking] = useState<StakingData | null>(null);
	const [mining, setMining] = useState<MiningData | null>(null);

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
					balances?: Array<{
						// Channel format (new API format)
						channel?: string;
						module?: string;
						widget?: string;
						raw?: {
							genesis?: {
								token?: {
									id?: string;
									metadata?: {
										symbol?: string;
										decimals?: number;
										[key: string]: unknown;
									};
									[key: string]: unknown;
								};
								[key: string]: unknown;
							};
							balance?: string;
							symbol?: string;
							address?: string;
							timestamp?: number;
							[key: string]: unknown;
						};
						timestamp?: number;
						// Simple format (legacy)
						token_id?: string;
						balance?: string;
						decimals?: number;
						currency?: string;
						symbol?: string;
						initial_balance?: string;
						total_received?: string;
						total_sent?: string;
						total_fees?: string;
						transaction_count?: number;
						mined?: string;
						mined_sli?: string;
						total_balance?: string;
						total_balance_sli?: string;
					}>;
					address?: string;
					network?: string;
					total?: number;
					timestamp?: number;
					accounts?: AccountValue[];
					assets?: AssetRecord[];
					recent_transactions?: RecentTransaction[];
					staking?: StakingData;
					mining?: MiningData;
					[key: string]: unknown;
				};
			} = await response.json();

			if (data.result) {
				// Handle both response formats according to updated API documentation
				// Format 1: {result: {success: true, balances: [{channel, module, raw: {...}}, ...], ...}}
				// Format 2: {result: AssetBalancesResponse} (legacy format)
				if ("success" in data.result && data.result.success) {
					// Format 1: Extract balances from result - handle both channel format and simple format
					const balancesResult = data.result;
					const rawBalances = balancesResult.balances || [];

					const balancesData: AssetBalanceItem[] = rawBalances.map((balance) => {
						// Check if it's channel format (new API format)
						if (balance.channel && balance.raw) {
							const tokenId = balance.raw.genesis?.token?.id || "";
							const symbol = balance.raw.symbol || balance.raw.genesis?.token?.metadata?.symbol || "";
							const decimals = balance.raw.genesis?.token?.metadata?.decimals ?? 6;
							const balanceValue = balance.raw.balance || "0";

							return {
								token_id: tokenId,
								balance: balanceValue,
								decimals,
								currency: symbol,
								symbol,
								initial_balance: "0",
								total_received: "0",
								total_sent: "0",
								total_fees: "0",
								transaction_count: 0,
							};
						}

						// Simple format (legacy)
						return {
							token_id: balance.token_id || "",
							balance: balance.balance || "0",
							decimals: balance.decimals ?? 6,
							currency: balance.currency || "",
							symbol: balance.symbol || "",
							initial_balance: balance.initial_balance || "0",
							total_received: balance.total_received || "0",
							total_sent: balance.total_sent || "0",
							total_fees: balance.total_fees || "0",
							transaction_count: balance.transaction_count || 0,
							mined: balance.mined,
							mined_sli: balance.mined_sli,
							total_balance: (balance as { total_balance?: string }).total_balance,
							total_balance_sli: (balance as { total_balance_sli?: string }).total_balance_sli,
						};
					});

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
					setStaking(balancesResult.staking || null);
					setMining(balancesResult.mining || null);

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
					setStaking(balancesResponse.staking || null);
					setMining(balancesResponse.mining || null);

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
				params.network || connectionSession?.network || currentNetworkId,
			);
			if (cached && cached.length > 0) {
				setBalances(cached);
				setTotal(cached.length);
			}
		}
	}, [params.address, params.network, connectionSession?.network, balances.length, currentNetworkId]);
	
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
		staking,
		mining,
		refetch: fetchBalances,
	};
}
