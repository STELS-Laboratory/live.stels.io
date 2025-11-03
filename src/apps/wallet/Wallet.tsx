/**
 * Wallet Application
 * Full-featured wallet with balance, tokens, and transaction management
 */

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores";
import { useWalletBalance } from "@/hooks/use_wallet_balance";
import { useAssetList } from "@/hooks/use_asset_list";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Database, PlusIcon } from "lucide-react";
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
	const { balance, loading: balanceLoading, refetch: refetchBalance } =
		useWalletBalance();
	const { assets, loading: assetsLoading } = useAssetList();
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

	// Check if wallet exists
	const hasWallet = wallet !== null;

	// Check biometric verification
	const isVerified = useMemo(() => {
		return wallet?.biometric !== null && wallet?.biometric !== undefined;
	}, [wallet?.biometric]);

	// Calculate total USD value from balance and assets
	const totalUSDValue = useMemo((): number => {
		if (!balance || !assets) return 0;

		// For now, we'll use a simple conversion rate
		// In production, this should come from price feeds
		const tstToUsdRate = 0.01; // Placeholder - should be fetched from API
		const total = balance.total * tstToUsdRate;

		// Add token balances if available
		// This is a simplified calculation - in production, you'd need to:
		// 1. Get balances for each token from transactions
		// 2. Get price for each token
		// 3. Calculate USD value per token
		// 4. Sum all values

		return total;
	}, [balance, assets]);

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
					<Button
						onClick={() => setIsAddAccountDialogOpen(true)}
						className={cn(mobile ? "w-full" : "")}
					>
						<PlusIcon className="size-4 mr-2" />
						Add Account
					</Button>
				</div>

				{/* Wallet Card */}
				<WalletCard
					cardNumber={wallet.number ? formatCardNumber(wallet.number) : ""}
					balance={balance?.total || 0}
					usdValue={totalUSDValue}
					liquidity={totalLiquidity}
					isVerified={isVerified}
					loading={balanceLoading}
					onRefresh={refetchBalance}
					mobile={mobile}
				/>

				{/* Tabs for Tokens and Accounts */}
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
		</div>
	);
}

export default Wallet;
