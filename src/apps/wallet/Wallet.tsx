/**
 * Wallet Application
 * Full-featured wallet with balance, tokens, and transaction management
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores";
import { useAssetList } from "@/hooks/use_asset_list";
import { useAssetBalance } from "@/hooks/use_asset_balance";
import { useAssetBalances } from "@/hooks/use_asset_balances";
import { useAllTokenPrices } from "@/hooks/use_token_price";
import { useMobile } from "@/hooks/use_mobile";
import {
	type StoredAccount,
	useAccountsStore,
} from "@/stores/modules/accounts.store";
import { WalletCard } from "./components/wallet_card";
import { TokenList } from "./components/token_list";
import { AccountList } from "./components/account_list";
import { AddAccountDialog } from "./components/add_account_dialog";
import { AccountDetailsDialog } from "./components/account_details_dialog";
import { TransactionList } from "./components/transaction_list";
import { SendTransactionDialog } from "./components/send_transaction_dialog";
import { SmartTransactionDialog } from "./components/smart_transaction_dialog";
import { StakingMiningStats } from "./components/staking_mining_stats";
import {
	AccountListSkeleton,
	StakingMiningStatsSkeleton,
	TokenListSkeleton,
	TransactionListSkeleton,
	WalletCardSkeleton,
	WalletHeaderSkeleton,
} from "./components/wallet_skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Database, History, PlusIcon, Send, Zap } from "lucide-react";
import { useAssetTransactions } from "@/hooks/use_asset_transactions";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Format card number with spaces (XXXX XXXX XXXX XXXX)
 */
function formatCardNumber(cardNum: string): string {
	const digits = cardNum.replace(/\D/g, "");
	const groups = digits.match(/.{1,4}/g) || [];
	return groups.join(" ");
}

/**
 * Wallet Application Component
 */
function Wallet(): React.ReactElement {
	const mobile = useMobile();
	const { wallet, connectionSession, isAuthenticated, isConnected } =
		useAuthStore();
	const { assets, loading: assetsLoading } = useAssetList();

	// Find native token (SLI) for main balance
	// Priority: find SLI token from assets, or use native token from balances
	const nativeToken = useMemo(() => {
		if (!assets || assets.length === 0) return null;

		// Filter out genesis network documents and find SLI token (native token)
		return assets.find((asset) => {
			// Skip genesis network documents
			const isGenesisDoc = asset.channel?.includes(".genesis:") ||
				(asset.raw?.genesis && !asset.raw.genesis.token &&
					asset.raw.genesis.genesis);

			if (isGenesisDoc) return false;

			// Support both formats: legacy (token.raw.genesis.token) and new (metadata directly)
			const symbol = asset.raw?.genesis?.token?.metadata?.symbol ||
				asset.metadata?.symbol ||
				"";

			// Look for SLI (native token) or TST (legacy)
			return symbol.toUpperCase() === "SLI" || symbol.toUpperCase() === "TST";
		});
	}, [assets]);

	// Get native token balance using getAssetBalance API (only if nativeToken is found)
	const {
		balance: nativeBalance,
		loading: balanceLoading,
		refetch: refetchBalance,
	} = useAssetBalance({
		address: wallet?.address || "",
		token_id: nativeToken?.raw?.genesis?.token?.id ||
			nativeToken?.id ||
			"",
		network: connectionSession?.network,
	});

	// Only show loading if we're actually fetching native token balance
	const isNativeLoading = nativeToken ? balanceLoading : false;
	const { accounts, fetchAccountsFromServer } = useAccountsStore();
	const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState<boolean>(
		false,
	);
	const [activeTab, setActiveTab] = useState<string>("tokens");
	const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
	const [selectedAccount, setSelectedAccount] = useState<StoredAccount | null>(
		null,
	);
	const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState<boolean>(
		false,
	);
	const [isSendTransactionOpen, setIsSendTransactionOpen] = useState<boolean>(
		false,
	);
	const [isSmartTransactionOpen, setIsSmartTransactionOpen] = useState<boolean>(
		false,
	);
	const [showStakingMining, setShowStakingMining] = useState<boolean>(false);

	// Fetch transactions for transaction history
	// Don't fetch immediately - only when transactions tab is opened
	const {
		transactions,
		loading: transactionsLoading,
		refetch: refetchTransactions,
	} = useAssetTransactions({
		address: wallet?.address || "",
		status: "all",
	});

	// Check if wallet exists
	const hasWallet = wallet !== null;

	// Check biometric verification
	const isVerified = useMemo(() => {
		return wallet?.biometric !== null && wallet?.biometric !== undefined;
	}, [wallet?.biometric]);

	// Get all balances for USD calculation
	const {
		balances: allBalances,
		loading: balancesLoading,
		refetch: refetchAllBalances,
		accounts: accountsFromBalances,
		staking,
		mining,
	} = useAssetBalances({
		address: wallet?.address || "",
		network: connectionSession?.network,
	});

	// Get all token prices from session ticker data
	const tokenPrices = useAllTokenPrices(connectionSession?.network);

	// Find native token balance from allBalances (SLI or native:testnet)
	const nativeBalanceFromAll = useMemo(() => {
		if (!allBalances || allBalances.length === 0) return null;
		// First try to find SLI token
		let balance = allBalances.find(
			(b) =>
				b.symbol?.toUpperCase() === "SLI" ||
				b.currency?.toUpperCase() === "SLI",
		);
		// If not found, try native:testnet token_id
		if (!balance) {
			balance = allBalances.find(
				(b) =>
					b.token_id?.toLowerCase() === "native:testnet" ||
					b.token_id?.toLowerCase().startsWith("native:"),
			);
		}
		// Fallback to TST (legacy)
		if (!balance) {
			balance = allBalances.find(
				(b) =>
					b.symbol?.toUpperCase() === "TST" ||
					b.currency?.toUpperCase() === "TST",
			);
		}
		return balance;
	}, [allBalances]);

	// Get native token symbol and decimals for display
	const nativeTokenSymbol = useMemo(() => {
		if (nativeBalanceFromAll?.symbol) {
			return nativeBalanceFromAll.symbol.toUpperCase();
		}
		if (nativeToken) {
			const symbol = nativeToken.raw?.genesis?.token?.metadata?.symbol ||
				nativeToken.metadata?.symbol ||
				"";
			return symbol.toUpperCase() || "SLI";
		}
		return "SLI"; // Default to SLI
	}, [nativeBalanceFromAll, nativeToken]);

	// Get native token decimals for formatting
	// Priority: genesis document parameters.currency.decimals > balance decimals > token metadata decimals > default (8)
	const nativeTokenDecimals = useMemo(() => {
		// First, try to get decimals from genesis document (parameters.currency.decimals)
		// This is the authoritative source according to genesis.json schema
		if (assets && assets.length > 0) {
			const genesisDoc = assets.find((asset) => {
				const isGenesisDoc = asset.channel?.includes(".genesis:") ||
					(asset.raw?.genesis && !asset.raw.genesis.token &&
						asset.raw.genesis.genesis);
				return isGenesisDoc;
			});

			if (
				genesisDoc?.raw?.genesis?.parameters?.currency?.decimals !== undefined
			) {
				return genesisDoc.raw.genesis.parameters.currency.decimals;
			}
		}

		// Fallback to balance decimals
		if (nativeBalanceFromAll?.decimals !== undefined) {
			return nativeBalanceFromAll.decimals;
		}

		// Fallback to token metadata decimals
		if (nativeToken) {
			const decimals = nativeToken.raw?.genesis?.token?.metadata?.decimals ||
				nativeToken.metadata?.decimals;
			return decimals ?? 8; // Default to 8 for SLI
		}

		// Default to 8 decimals for SLI (as per genesis.json parameters.currency.decimals)
		return 8;
	}, [nativeBalanceFromAll, nativeToken, assets]);

	// Use native token balance from allBalances if available, otherwise from useAssetBalance
	// Priority: total_balance_sli from API > nativeBalance (from useAssetBalance) > nativeBalanceFromAll (from allBalances)
	// Note: API may return total_balance_sli which is already the total (balance + mined)
	const mainBalance = useMemo(() => {
		// First, try to use total_balance_sli from API if available (most accurate)
		if (nativeBalanceFromAll?.total_balance_sli) {
			const total = Number.parseFloat(nativeBalanceFromAll.total_balance_sli);
			if (!Number.isNaN(total)) {
				return total;
			}
		}

		const decimals = nativeTokenDecimals;
		let baseBalance = 0;
		let minedBalance = 0;

		// Get base balance
		if (nativeBalance && nativeBalance.balance) {
			// Balance comes as string in raw format (e.g., "4496000000000" = 44,960 SLI with decimals=8)
			// Convert from raw to human-readable: divide by 10^decimals
			const rawBalance = Number.parseFloat(nativeBalance.balance);
			if (!Number.isNaN(rawBalance)) {
				baseBalance = rawBalance / Math.pow(10, decimals);
			}
		} else if (nativeBalanceFromAll && nativeBalanceFromAll.balance) {
			// Balance comes as string in raw format
			const rawBalance = Number.parseFloat(nativeBalanceFromAll.balance);
			if (!Number.isNaN(rawBalance)) {
				baseBalance = rawBalance / Math.pow(10, decimals);
			}
		}

		// Add mined tokens from balance item (mined_sli is already in human-readable format)
		if (nativeBalanceFromAll?.mined_sli) {
			const mined = Number.parseFloat(nativeBalanceFromAll.mined_sli);
			if (!Number.isNaN(mined) && mined > 0) {
				minedBalance += mined;
			}
		}

		return baseBalance + minedBalance;
	}, [nativeBalance, nativeBalanceFromAll, nativeTokenDecimals]);

	// Calculate total USD value from all token balances and prices
	const totalUSDValue = useMemo((): number => {
		if (!allBalances || allBalances.length === 0) return 0;

		let total = 0;

		for (const balance of allBalances) {
			// Try to get price by symbol from balance data
			// The balance response includes symbol field
			const symbol = balance.symbol?.toUpperCase();
			if (!symbol) continue;

			// For USDT, use fixed price of 1 USD (stablecoin)
			const price = symbol === "USDT" ? 1 : tokenPrices.get(symbol);
			if (!price) continue;

			const balanceNum = Number.parseFloat(balance.balance);
			if (!Number.isNaN(balanceNum) && balanceNum > 0) {
				total += balanceNum * price;
			}
		}

		return total;
	}, [allBalances, tokenPrices]);

	// Calculate total liquidity from connected accounts
	// Priority: accounts from getAssetBalances (available immediately) > accounts from store
	const totalLiquidity = useMemo((): number => {
		let total = 0;

		// Helper function to calculate liquidity from account wallet data
		const calculateAccountLiquidity = (wallet: unknown): number => {
			if (!wallet || typeof wallet !== "object") return 0;

			let accountTotal = 0;
			const walletObj = wallet as Record<string, unknown>;

			// Check if wallet has info.result.list with coin data
			if (
				walletObj.info &&
				typeof walletObj.info === "object" &&
				walletObj.info !== null &&
				"result" in walletObj.info &&
				walletObj.info.result &&
				typeof walletObj.info.result === "object" &&
				"list" in walletObj.info.result &&
				Array.isArray(walletObj.info.result.list) &&
				walletObj.info.result.list[0] &&
				typeof walletObj.info.result.list[0] === "object" &&
				"coin" in walletObj.info.result.list[0] &&
				Array.isArray(walletObj.info.result.list[0].coin)
			) {
				const coins = walletObj.info.result.list[0].coin as Array<
					Record<string, unknown>
				>;
				coins.forEach((coin) => {
					if (
						coin &&
						typeof coin === "object" &&
						"usdValue" in coin
					) {
						const usdValue = typeof coin.usdValue === "string"
							? Number.parseFloat(coin.usdValue)
							: typeof coin.usdValue === "number"
							? coin.usdValue
							: 0;
						if (!Number.isNaN(usdValue) && usdValue > 0) {
							accountTotal += usdValue;
						}
					}
				});
			}

			// Also check direct coin properties (fallback)
			Object.keys(walletObj).forEach((key) => {
				if (
					key !== "info" &&
					key !== "timestamp" &&
					key !== "datetime" &&
					key !== "free" &&
					key !== "used" &&
					key !== "total" &&
					key !== "debt" &&
					typeof walletObj[key] === "object" &&
					walletObj[key] !== null &&
					walletObj[key] &&
					"usdValue" in walletObj[key]
				) {
					const coinData = walletObj[key] as { usdValue?: string | number };
					if (coinData.usdValue) {
						const usdValue = typeof coinData.usdValue === "string"
							? Number.parseFloat(coinData.usdValue)
							: coinData.usdValue;
						if (!Number.isNaN(usdValue) && usdValue > 0) {
							accountTotal += usdValue;
						}
					}
				}
			});

			return accountTotal;
		};

		// First, try to use accounts from getAssetBalances (available immediately)
		if (accountsFromBalances && accountsFromBalances.length > 0) {
			accountsFromBalances.forEach((account) => {
				// AccountValue from API has raw property with wallet data
				// Check if account has connection status (default to true if not specified)
				const accountRaw = account as {
					raw?: { wallet?: unknown; connection?: boolean };
				};
				const isConnected = accountRaw.raw?.connection !== false;
				if (!isConnected) return;

				// Calculate liquidity from wallet data
				if (accountRaw.raw?.wallet) {
					total += calculateAccountLiquidity(accountRaw.raw.wallet);
				}
			});
		}

		// Fallback to accounts from store (if available and no data from API)
		if (total === 0 && accounts && accounts.length > 0) {
			accounts.forEach((account) => {
				// Only count connected accounts
				if (!account.account.connection) return;

				const rawData = account.rawData;
				if (!rawData?.wallet) return;

				total += calculateAccountLiquidity(rawData.wallet);
			});
		}

		return total;
	}, [accountsFromBalances, accounts]);

	// Calculate total portfolio value: tokens + liquidity
	const totalPortfolioValue = useMemo((): number => {
		return totalUSDValue + totalLiquidity;
	}, [totalUSDValue, totalLiquidity]);

	// Determine if we're in initial loading state
	const isInitialLoading = useMemo((): boolean => {
		return (isNativeLoading || balancesLoading) && mainBalance === 0;
	}, [isNativeLoading, balancesLoading, mainBalance]);

	// Track last fetch times to prevent unnecessary refetches
	const lastTransactionsFetchRef = useRef<
		{
			address: string;
			session: string;
			timestamp: number;
		} | null
	>(null);

	const lastAccountsFetchRef = useRef<
		{
			address: string;
			session: string;
			timestamp: number;
		} | null
	>(null);

	// Fetch transactions when transactions tab is opened
	useEffect(() => {
		if (
			activeTab === "transactions" &&
			isAuthenticated &&
			isConnected &&
			connectionSession &&
			wallet &&
			wallet.address
		) {
			const now = Date.now();
			const lastFetch = lastTransactionsFetchRef.current;

			// Check if we already fetched recently (within 5 seconds)
			if (
				lastFetch &&
				lastFetch.address === wallet.address &&
				lastFetch.session === connectionSession.session &&
				now - lastFetch.timestamp < 5000
			) {
				return;
			}

			// Update last fetch info
			lastTransactionsFetchRef.current = {
				address: wallet.address,
				session: connectionSession.session,
				timestamp: now,
			};

			refetchTransactions();
		}
	}, [
		activeTab,
		isAuthenticated,
		isConnected,
		connectionSession,
		wallet,
		refetchTransactions,
	]);

	// Fetch accounts from server when accounts tab is opened
	useEffect(() => {
		if (
			activeTab === "accounts" &&
			isAuthenticated &&
			isConnected &&
			connectionSession &&
			wallet
		) {
			const now = Date.now();
			const lastFetch = lastAccountsFetchRef.current;

			// Check if we already fetched recently (within 5 seconds)
			if (
				lastFetch &&
				lastFetch.address === wallet.address &&
				lastFetch.session === connectionSession.session &&
				now - lastFetch.timestamp < 5000
			) {
				return;
			}

			// Update last fetch info
			lastAccountsFetchRef.current = {
				address: wallet.address,
				session: connectionSession.session,
				timestamp: now,
			};

			setAccountsLoading(true);
			fetchAccountsFromServer(
				wallet.address,
				connectionSession.session,
				connectionSession.api,
			)
				.catch(() => {
					// Failed to fetch accounts
				})
				.finally(() => {
					setAccountsLoading(false);
				});
		}
	}, [
		activeTab,
		isAuthenticated,
		isConnected,
		connectionSession,
		wallet,
		fetchAccountsFromServer,
	]);

	// No wallet state
	if (!hasWallet) {
		return (
			<div className="container p-8 h-full bg-background flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-4 mx-auto">
						<svg
							className="w-10 h-10 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-foreground mb-2">
						No Wallet Found
					</h2>
					<p className="text-muted-foreground">
						Please create or import a wallet to view your balance and tokens.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container p-4 m-auto h-full bg-background overflow-hidden flex flex-col">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
				className={cn(
					"container-responsive flex-1 overflow-y-auto",
					mobile ? "space-y-4 p-4" : "p-8 space-y-6",
				)}
			>
				{/* Header */}
				{isInitialLoading ? <WalletHeaderSkeleton mobile={mobile} /> : (
					<div
						className={cn(
							"flex items-start justify-between",
							mobile ? "flex-col gap-2" : "flex-row",
						)}
					>
						<div className={cn(mobile ? "space-y-1" : "space-y-2")}>
							<h1
								className={cn(
									"font-semibold text-foreground",
									mobile ? "text-xl" : "text-2xl",
								)}
							>
								Wallet
							</h1>
							<p
								className={cn(
									"text-muted-foreground",
									mobile ? "text-xs" : "text-sm",
								)}
							>
								Manage your balances, tokens, and trading accounts
							</p>
						</div>
						<div className={cn("flex gap-2", mobile && "w-full flex-col")}>
							<Button
								onClick={() => setIsSendTransactionOpen(true)}
								variant="default"
								className={cn(mobile ? "w-full" : "")}
							>
								<Send className="size-4 mr-2" />
								Send
							</Button>
							<Button
								onClick={() => setIsSmartTransactionOpen(true)}
								variant="default"
								className={cn(mobile ? "w-full" : "")}
							>
								<Zap className="size-4 mr-2" />
								Smart
							</Button>
							<Button
								onClick={() => setIsAddAccountDialogOpen(true)}
								variant="outline"
								className={cn(mobile ? "w-full" : "")}
							>
								<PlusIcon className="size-4 mr-2" />
								Add Account
							</Button>
						</div>
					</div>
				)}

				<div className="grid min-h-[280px] grid-cols-1 md:grid-cols-2 gap-4">
					{/* Wallet Card */}
					{mobile && showStakingMining ? null : (
						isInitialLoading
							? <WalletCardSkeleton mobile={mobile} />
							: (
								<WalletCard
									cardNumber={wallet.number
										? formatCardNumber(wallet.number)
										: ""}
									balance={mainBalance}
									balanceSymbol={nativeTokenSymbol}
									balanceDecimals={nativeTokenDecimals}
									usdValue={totalPortfolioValue}
									liquidity={totalLiquidity}
									tokensValue={totalUSDValue}
									isVerified={isVerified}
									loading={isNativeLoading || balancesLoading}
									onRefresh={async () => {
										if (nativeToken) {
											await refetchBalance();
										}
										await refetchAllBalances();
									}}
									walletAddress={wallet.address}
									mobile={mobile}
									onClick={mobile
										? () => setShowStakingMining(true)
										: undefined}
								/>
							)
					)}

					{/* Staking/Mining Stats - Desktop always visible, Mobile only when showStakingMining is true */}
					{(!mobile || showStakingMining) && (
						isInitialLoading
							? <StakingMiningStatsSkeleton mobile={mobile} />
							: (
								<StakingMiningStats
									staking={staking}
									mining={mining}
									mobile={mobile}
									onBack={mobile
										? () => setShowStakingMining(false)
										: undefined}
									onAddStaking={() => {
										// TODO: Implement staking dialog or navigation
										// For now, we can show a toast or navigate to staking page
										// This will be implemented when staking functionality is added
									}}
								/>
							)
					)}
				</div>

				{/* Tabs for Tokens, Transactions, and Accounts */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className={cn("w-full", mobile && "mt-2")}
				>
					<TabsList className={cn("w-full", mobile && "h-12")}>
						<TabsTrigger
							value="tokens"
							className={cn("flex-1 gap-2", mobile && "text-sm")}
						>
							<Coins className="size-4" />
							<span>Tokens</span>
						</TabsTrigger>
						<TabsTrigger
							value="transactions"
							className={cn("flex-1 gap-2", mobile && "text-sm")}
						>
							<History className="size-4" />
							<span>Transactions</span>
						</TabsTrigger>
						<TabsTrigger
							value="accounts"
							className={cn("flex-1 gap-2", mobile && "text-sm")}
						>
							<Database className="size-4" />
							<span>Accounts</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="tokens" className="mt-4">
						{assetsLoading ? <TokenListSkeleton mobile={mobile} /> : (
							<TokenList
								assets={assets}
								loading={assetsLoading}
								mobile={mobile}
								address={wallet?.address}
							/>
						)}
					</TabsContent>

					<TabsContent value="transactions" className="mt-4">
						{transactionsLoading
							? <TransactionListSkeleton mobile={mobile} />
							: (
								<TransactionList
									transactions={transactions}
									loading={transactionsLoading}
									address={wallet?.address || ""}
									mobile={mobile}
								/>
							)}
					</TabsContent>

					<TabsContent value="accounts" className="mt-4">
						{accountsLoading
							? <AccountListSkeleton mobile={mobile} />
							: (
								<AccountList
									accounts={accounts}
									loading={accountsLoading}
									mobile={mobile}
									onAccountClick={(account) => {
										setSelectedAccount(account);
										setIsAccountDetailsOpen(true);
									}}
								/>
							)}
					</TabsContent>
				</Tabs>
			</motion.div>

			{/* Add Account Dialog */}
			<AddAccountDialog
				open={isAddAccountDialogOpen}
				onOpenChange={setIsAddAccountDialogOpen}
			/>

			{/* Account Details Dialog */}
			<AccountDetailsDialog
				open={isAccountDetailsOpen}
				onOpenChange={setIsAccountDetailsOpen}
				account={selectedAccount}
				mobile={mobile}
			/>

			{/* Send Transaction Dialog */}
			<SendTransactionDialog
				open={isSendTransactionOpen}
				onOpenChange={setIsSendTransactionOpen}
				mobile={mobile}
				onTransactionSent={() => {
					// Refresh all data after transaction
					refetchTransactions();
					refetchBalance();
					// TokenList components will auto-refresh their balances via useAssetBalance
				}}
			/>

			{/* Smart Transaction Dialog */}
			<SmartTransactionDialog
				open={isSmartTransactionOpen}
				onOpenChange={setIsSmartTransactionOpen}
				mobile={mobile}
				onTransactionSent={() => {
					// Refresh all data after transaction
					refetchTransactions();
					refetchBalance();
					// TokenList components will auto-refresh their balances via useAssetBalance
				}}
			/>
		</div>
	);
}

export default Wallet;
