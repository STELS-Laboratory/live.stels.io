/**
 * Wallet Application
 * Full-featured wallet with balance, tokens, and transaction management
 */

import React, { useMemo } from "react";
import { useAuthStore } from "@/stores";
import { useWalletBalance } from "@/hooks/use_wallet_balance";
import { useAssetList } from "@/hooks/use_asset_list";
import { useMobile } from "@/hooks/use_mobile";
import { WalletCard } from "./components/wallet_card";
import { TokenList } from "./components/token_list";
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
	const { wallet } = useAuthStore();
	const { balance, loading: balanceLoading, refetch: refetchBalance } =
		useWalletBalance();
	const { assets, loading: assetsLoading } = useAssetList();

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
						Manage your balances and tokens
					</p>
				</div>

				{/* Wallet Card */}
				<WalletCard
					cardNumber={wallet.number ? formatCardNumber(wallet.number) : ""}
					balance={balance?.total || 0}
					usdValue={totalUSDValue}
					isVerified={isVerified}
					loading={balanceLoading}
					onRefresh={refetchBalance}
					mobile={mobile}
				/>

				{/* Token List */}
				<TokenList
					assets={assets}
					loading={assetsLoading}
					mobile={mobile}
				/>
			</motion.div>
		</div>
	);
}

export default Wallet;
