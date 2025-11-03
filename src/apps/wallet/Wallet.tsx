/**
 * Wallet Application
 * Full-featured wallet with balance, tokens, and transaction management
 */

import React, { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Database, PlusIcon, Send, History } from "lucide-react";
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

	// Find TST token for main balance
	const tstToken = useMemo(() => {
		if (!assets) return null;
		return assets.find(
			(asset) =>
				asset.raw.genesis.token.metadata.symbol === "TST" ||
				asset.raw.genesis.token.metadata.symbol === "tst",
		);
	}, [assets]);

	// Get TST balance using getAssetBalance API (only if tstToken is found)
	const { balance: tstBalance, loading: balanceLoading, refetch: refetchBalance } =
		useAssetBalance({
			address: wallet?.address || "",
			token_id: tstToken?.raw.genesis.token.id || "",
			network: connectionSession?.network,
		});
	
	// Only show loading if we're actually fetching TST balance
	const isTSTLoading = tstToken ? balanceLoading : false;
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

	// Fetch transactions for transaction history
	// Don't fetch immediately - only when transactions tab is opened
	const { transactions, loading: transactionsLoading, refetch: refetchTransactions } =
		useAssetTransactions({
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
	const { balances: allBalances, loading: balancesLoading, refetch: refetchAllBalances } = useAssetBalances({
		address: wallet?.address || "",
		network: connectionSession?.network,
	});

	// Get all token prices from session ticker data
	const tokenPrices = useAllTokenPrices(connectionSession?.network);

	// Find TST balance from allBalances if tstToken not found
	const tstBalanceFromAll = useMemo(() => {
		if (!allBalances || allBalances.length === 0) return null;
		return allBalances.find(
			(balance) =>
				balance.symbol?.toUpperCase() === "TST" ||
				balance.currency?.toUpperCase() === "TST",
		);
	}, [allBalances]);

	// Use TST balance from allBalances if available, otherwise from useAssetBalance
	// Priority: tstBalance (from useAssetBalance) > tstBalanceFromAll (from allBalances)
	const mainBalance = useMemo(() => {
		if (tstBalance && tstBalance.balance) {
			const balanceNum = Number.parseFloat(tstBalance.balance);
			return Number.isNaN(balanceNum) ? 0 : balanceNum;
		}
		if (tstBalanceFromAll && tstBalanceFromAll.balance) {
			const balanceNum = Number.parseFloat(tstBalanceFromAll.balance);
			return Number.isNaN(balanceNum) ? 0 : balanceNum;
		}
		return 0;
	}, [tstBalance, tstBalanceFromAll]);

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
	const totalLiquidity = useMemo((): number => {
		if (!accounts || accounts.length === 0) return 0;

		let total = 0;

		accounts.forEach((account) => {
			// Only count connected accounts
			if (!account.account.connection) return;

			const rawData = account.rawData;
			if (!rawData?.wallet) return;

			const wallet = rawData.wallet;

			// Check if wallet has info.result.list with coin data
			if (
				wallet.info?.result?.list?.[0]?.coin &&
				Array.isArray(wallet.info.result.list[0].coin)
			) {
				wallet.info.result.list[0].coin.forEach((coin: unknown) => {
					if (
						typeof coin === "object" &&
						coin !== null &&
						"usdValue" in coin &&
						coin.usdValue &&
						typeof coin.usdValue === "string"
					) {
						const usdValue = Number.parseFloat(coin.usdValue);
						if (!Number.isNaN(usdValue)) {
							total += usdValue;
						}
					}
				});
			}

			// Also check direct coin properties (fallback)
			Object.keys(wallet).forEach((key) => {
				if (
					key !== "info" &&
					key !== "timestamp" &&
					key !== "datetime" &&
					key !== "free" &&
					key !== "used" &&
					key !== "total" &&
					key !== "debt" &&
					typeof wallet[key] === "object" &&
					wallet[key] !== null &&
					"usdValue" in wallet[key]
				) {
					const coinData = wallet[key] as { usdValue?: string };
					if (coinData.usdValue) {
						const usdValue = Number.parseFloat(coinData.usdValue);
						if (!Number.isNaN(usdValue)) {
							total += usdValue;
						}
					}
				}
			});
		});

		return total;
	}, [accounts]);

	// Calculate total portfolio value: tokens + liquidity
	const totalPortfolioValue = useMemo((): number => {
		return totalUSDValue + totalLiquidity;
	}, [totalUSDValue, totalLiquidity]);

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
			console.log("[Wallet] Loading transactions for tab", wallet.address);
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
			setAccountsLoading(true);
			fetchAccountsFromServer(
				wallet.address,
				connectionSession.session,
				connectionSession.api,
			)
				.catch((error) => {
					console.error("[Wallet] Failed to fetch accounts:", error);
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
			<div className="h-full bg-background flex items-center justify-center">
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
		<div className="h-full bg-background overflow-y-auto p-8">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
				className={cn(
					"container-responsive",
					mobile ? "space-y-4" : "p-2 space-y-6",
				)}
			>
				{/* Header */}
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
							onClick={() => setIsAddAccountDialogOpen(true)}
							variant="outline"
							className={cn(mobile ? "w-full" : "")}
						>
							<PlusIcon className="size-4 mr-2" />
							Add Account
						</Button>
					</div>
				</div>

				{/* Wallet Card */}
				<WalletCard
					cardNumber={wallet.number ? formatCardNumber(wallet.number) : ""}
					balance={mainBalance}
					usdValue={totalPortfolioValue}
					liquidity={totalLiquidity}
					tokensValue={totalUSDValue}
					isVerified={isVerified}
					loading={isTSTLoading || balancesLoading}
					onRefresh={async () => {
						if (tstToken) {
							await refetchBalance();
						}
						await refetchAllBalances();
					}}
					mobile={mobile}
				/>

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
						<TokenList
							assets={assets}
							loading={assetsLoading}
							mobile={mobile}
							address={wallet?.address}
						/>
					</TabsContent>

					<TabsContent value="transactions" className="mt-4">
						<TransactionList
							transactions={transactions}
							loading={transactionsLoading}
							address={wallet?.address || ""}
							mobile={mobile}
						/>
					</TabsContent>

					<TabsContent value="accounts" className="mt-4">
						<AccountList
							accounts={accounts}
							loading={accountsLoading}
							mobile={mobile}
							onAccountClick={(account) => {
								setSelectedAccount(account);
								setIsAccountDetailsOpen(true);
							}}
						/>
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
		</div>
	);
}

export default Wallet;
