/**
 * Account Balance Component
 * Displays detailed account balance information from session
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "../store";
import { useAuthStore } from "@/stores";
import { getSessionStorageManager } from "@/lib/gui/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
	CheckCircle2,
	Info,
	Network,
	Settings,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
	Workflow,
	XCircle,
} from "lucide-react";
import { formatBalance, formatUSD, formatVolume } from "../lib/formatting";

/**
 * Get account balance channel name
 */
function getAccountBalanceChannel(
	address: string,
	exchange: string,
	nid: string,
): string {
	return `account.balance.${address}.${exchange}.${nid}`;
}

/**
 * Account Balance Component
 */
export function AccountBalance(): React.ReactElement {
	const { selectedAccount } = useTradingStore();
	const { wallet } = useAuthStore();
	const [balanceData, setBalanceData] = useState<
		Record<string, unknown> | null
	>(null);
	const sessionManager = getSessionStorageManager();

	const channel = useMemo(() => {
		if (!selectedAccount) return null;

		// Find the correct channel by searching sessionStorage for matching nid and exchange
		// The address in the channel might differ from wallet.address
		if (typeof window !== "undefined") {
			const searchPattern = `.${
				selectedAccount.exchange || "bybit"
			}.${selectedAccount.nid}`;
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (
					key && key.startsWith("account.balance.") &&
					key.endsWith(searchPattern)
				) {
					return key;
				}
			}
		}

		// Fallback: try with wallet address if available
		if (wallet?.address) {
			return getAccountBalanceChannel(
				wallet.address,
				selectedAccount.exchange || "bybit",
				selectedAccount.nid,
			);
		}

		return null;
	}, [selectedAccount, wallet?.address]);

	useEffect(() => {
		if (!channel) {
			setBalanceData(null);
			return;
		}

		const loadData = (): void => {
			if (!channel) return;

			const data = sessionManager.getData(channel, true);
			if (data) {
				setBalanceData(data);
			} else {
				// Try lowercase version
				const lowerChannel = channel.toLowerCase();
				const lowerData = sessionManager.getData(lowerChannel, true);
				if (lowerData) {
					setBalanceData(lowerData);
				}
			}
		};

		// Initial load
		loadData();

		// Subscribe to updates
		const unsubscribe = sessionManager.subscribe(channel, (updatedData) => {
			if (updatedData) {
				setBalanceData(updatedData);
			}
		});

		// Also subscribe to lowercase version
		const lowerChannel = channel.toLowerCase();
		const unsubscribeLower = sessionManager.subscribe(
			lowerChannel,
			(updatedData) => {
				if (updatedData) {
					setBalanceData(updatedData);
				}
			},
		);

		// Listen to storage events
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === channel || e.key === channel.toLowerCase()) {
				loadData();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - optimized to avoid performance violations
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 1000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadData();
			});
		}, 1000);

		return () => {
			unsubscribe();
			unsubscribeLower();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [channel, sessionManager]);

	// Extract all data from balance data
	const accountData = useMemo(() => {
		if (!balanceData) return null;
		const raw = (balanceData as { raw?: unknown }).raw as {
			nid?: string;
			address?: string;
			signature?: string;
			publicKey?: string;
			exchange?: string;
			viewers?: string[];
			workers?: string[];
			connection?: boolean;
			note?: string;
			timestamp?: number;
			datetime?: string;
			protocol?: {
				strategy?: string;
				tradingStyle?: string;
				maxRiskPerTrade?: number;
				maxLeverage?: number;
				maxDrawdown?: number;
				stopLoss?: number;
				takeProfit?: number;
				riskRewardRatio?: number;
				positionSizing?: string;
				portfolioAllocation?: number;
				slippageTolerance?: number;
				markets?: string[];
				orderTypes?: string[];
				timeframes?: string[];
				marketConditions?: string[];
				hedgingEnabled?: boolean;
				scalingEnabled?: boolean;
				trailingStopEnabled?: boolean;
				dynamicPositionSizing?: boolean;
			};
			wallet?: {
				info?: {
					result?: {
						list?: Array<{
							totalEquity?: string;
							totalWalletBalance?: string;
							totalAvailableBalance?: string;
							totalMarginBalance?: string;
							accountType?: string;
							accountIMRate?: string;
							accountMMRate?: string;
							accountLTV?: string;
							totalInitialMargin?: string;
							totalMaintenanceMargin?: string;
							totalPerpUPL?: string;
							accountIMRateByMp?: string;
							accountMMRateByMp?: string;
							totalInitialMarginByMp?: string;
							totalMaintenanceMarginByMp?: string;
							coin?: Array<{
								coin?: string;
								equity?: string;
								walletBalance?: string;
								usdValue?: string;
								cumRealisedPnl?: string;
								unrealisedPnl?: string;
								locked?: string;
								marginCollateral?: boolean;
								collateralSwitch?: boolean;
								availableToWithdraw?: string;
								availableToBorrow?: string;
								borrowAmount?: string;
								spotBorrow?: string;
								accruedInterest?: string;
								bonus?: string;
								totalPositionIM?: string;
								totalPositionMM?: string;
								totalOrderIM?: string;
								spotHedgingQty?: string;
							}>;
						}>;
					};
				};
				BTC?: { free?: number; used?: number; total?: number; debt?: number };
				SOL?: { free?: number; used?: number; total?: number; debt?: number };
				ETH?: { free?: number; used?: number; total?: number; debt?: number };
				USDT?: { free?: number; used?: number; total?: number; debt?: number };
				SQR?: { free?: number; used?: number; total?: number; debt?: number };
				free?: Record<string, number>;
				used?: Record<string, number>;
				total?: Record<string, number>;
				debt?: Record<string, number>;
			};
		} | undefined;

		return raw || null;
	}, [balanceData]);

	const walletInfo = useMemo(() => {
		return accountData?.wallet?.info?.result?.list?.[0] || null;
	}, [accountData]);

	// Use centralized formatting functions
	const formatNumber = (
		value: string | number | undefined,
		decimals: number = 2,
	): string => {
		if (value === undefined || value === null || value === "") return "—";
		const num = typeof value === "string" ? Number.parseFloat(value) : value;
		if (Number.isNaN(num)) return "—";
		// For 8 decimals, use formatBalance, otherwise use formatVolume
		if (decimals === 8) {
			return formatBalance(num, 8);
		}
		return formatVolume(num);
	};

	const formatCurrency = (value: string | number | undefined): string => {
		if (value === undefined || value === null || value === "") return "—";
		const num = typeof value === "string" ? Number.parseFloat(value) : value;
		if (Number.isNaN(num)) return "—";
		return `$${formatUSD(num)}`;
	};

	if (!selectedAccount || !wallet?.address) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No account selected
					</div>
					<div className="text-xs text-muted-foreground/70 mt-1">
						Please select an account to view balance
					</div>
				</div>
			</div>
		);
	}

	if (!balanceData || !walletInfo) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No balance data available
					</div>
					<div className="text-xs text-muted-foreground/70 mt-1">
						Waiting for balance data from session...
					</div>
				</div>
			</div>
		);
	}

	const coins = walletInfo?.coin || [];
	const totalEquity = Number.parseFloat(walletInfo?.totalEquity || "0");
	const totalWalletBalance = Number.parseFloat(
		walletInfo?.totalWalletBalance || "0",
	);
	const totalAvailableBalance = Number.parseFloat(
		walletInfo?.totalAvailableBalance || "0",
	);
	const totalMarginBalance = Number.parseFloat(
		walletInfo?.totalMarginBalance || "0",
	);
	const totalPerpUPL = Number.parseFloat(walletInfo?.totalPerpUPL || "0");
	const totalInitialMargin = Number.parseFloat(
		walletInfo?.totalInitialMargin || "0",
	);
	const totalMaintenanceMargin = Number.parseFloat(
		walletInfo?.totalMaintenanceMargin || "0",
	);

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Summary Section */}
			<div className="flex-shrink-0 border-b border-border bg-muted/20 p-4">
				<div className="flex items-center gap-2 mb-4">
					<Wallet className="icon-sm text-muted-foreground" />
					<span className="text-sm font-semibold text-foreground uppercase tracking-wider">
						Account Summary
					</span>
				</div>
				<div className="grid grid-cols-3 gap-4 mb-4">
					{/* Total Equity */}
					<div className="flex flex-col">
						<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
							Total Equity
						</span>
						<span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
							{formatCurrency(totalEquity)}
						</span>
					</div>
					{/* Total Wallet Balance */}
					<div className="flex flex-col">
						<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
							Wallet Balance
						</span>
						<span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
							{formatCurrency(totalWalletBalance)}
						</span>
					</div>
					{/* Available Balance */}
					<div className="flex flex-col">
						<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
							Available
						</span>
						<span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
							{formatCurrency(totalAvailableBalance)}
						</span>
					</div>
				</div>

				{/* Additional Account Metrics */}
				<div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-border/50">
					{walletInfo?.accountType && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Account Type
							</span>
							<span className="text-xs font-semibold text-foreground">
								{walletInfo.accountType}
							</span>
						</div>
					)}
					{totalMarginBalance > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Margin Balance
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{formatCurrency(totalMarginBalance)}
							</span>
						</div>
					)}
					{totalPerpUPL !== 0 && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Perp UPL
							</span>
							<span
								className={cn(
									"text-xs font-semibold font-mono",
									totalPerpUPL >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{formatCurrency(totalPerpUPL)}
							</span>
						</div>
					)}
					{totalInitialMargin > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Initial Margin
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{formatCurrency(totalInitialMargin)}
							</span>
						</div>
					)}
					{totalMaintenanceMargin > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Maintenance Margin
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{formatCurrency(totalMaintenanceMargin)}
							</span>
						</div>
					)}
					{walletInfo?.accountIMRate && walletInfo.accountIMRate !== "" && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								IM Rate
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{walletInfo.accountIMRate}
							</span>
						</div>
					)}
					{walletInfo?.accountMMRate && walletInfo.accountMMRate !== "" && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								MM Rate
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{walletInfo.accountMMRate}
							</span>
						</div>
					)}
					{walletInfo?.accountLTV && walletInfo.accountLTV !== "" && (
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								LTV
							</span>
							<span className="text-xs font-semibold text-foreground font-mono">
								{walletInfo.accountLTV}
							</span>
						</div>
					)}
				</div>

				{/* Connection Status */}
				{accountData?.connection !== undefined && (
					<div className="pt-3 border-t border-border/50">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Connection
							</span>
							<div className="flex items-center gap-2">
								{accountData.connection
									? (
										<>
											<CheckCircle2 className="icon-xs text-green-600 dark:text-green-400" />
											<span className="text-xs font-semibold text-green-600 dark:text-green-400">
												Connected
											</span>
										</>
									)
									: (
										<>
											<XCircle className="icon-xs text-red-600 dark:text-red-400" />
											<span className="text-xs font-semibold text-red-600 dark:text-red-400">
												Disconnected
											</span>
										</>
									)}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Content Area */}
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					{/* Table Header */}
					<div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-muted/10 mb-2">
						<div className="col-span-2">Coin</div>
						<div className="col-span-2 text-right">Equity</div>
						<div className="col-span-2 text-right">Wallet</div>
						<div className="col-span-2 text-right">USD Value</div>
						<div className="col-span-2 text-right">P&L</div>
						<div className="col-span-2 text-right">Locked</div>
					</div>

					{/* Coins */}
					<div className="divide-y divide-border/50">
						{coins
							.filter((coin) => {
								const equity = Number.parseFloat(coin.equity || "0");
								return equity > 0 ||
									Number.parseFloat(coin.usdValue || "0") > 0;
							})
							.map((coin) => {
								const equity = Number.parseFloat(coin.equity || "0");
								const walletBalance = Number.parseFloat(
									coin.walletBalance || "0",
								);
								const usdValue = Number.parseFloat(coin.usdValue || "0");
								const cumRealisedPnl = Number.parseFloat(
									coin.cumRealisedPnl || "0",
								);
								const unrealisedPnl = Number.parseFloat(
									coin.unrealisedPnl || "0",
								);
								const totalPnl = cumRealisedPnl + unrealisedPnl;
								const locked = Number.parseFloat(coin.locked || "0");

								return (
									<div
										key={coin.coin}
										className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/30 transition-colors text-xs"
									>
										{/* Coin */}
										<div className="col-span-2 flex items-center gap-2">
											<span className="font-semibold font-mono text-foreground">
												{coin.coin}
											</span>
											{coin.marginCollateral && (
												<span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">
													MC
												</span>
											)}
										</div>

										{/* Equity */}
										<div className="col-span-2 text-right font-mono text-foreground">
											{formatNumber(equity, 8)}
										</div>

										{/* Wallet Balance */}
										<div className="col-span-2 text-right font-mono text-foreground">
											{formatNumber(walletBalance, 8)}
										</div>

										{/* USD Value */}
										<div className="col-span-2 text-right font-mono font-semibold text-green-600 dark:text-green-400">
											{formatCurrency(usdValue)}
										</div>

										{/* P&L */}
										<div
											className={cn(
												"col-span-2 text-right font-mono font-semibold",
												totalPnl >= 0
													? "text-green-600 dark:text-green-400"
													: "text-red-600 dark:text-red-400",
											)}
										>
											<div className="flex items-center justify-end gap-1">
												{totalPnl >= 0
													? <TrendingUp className="icon-xs" />
													: <TrendingDown className="icon-xs" />}
												<span>{formatCurrency(totalPnl)}</span>
											</div>
											{coin.cumRealisedPnl &&
												Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
												<div className="text-[10px] text-muted-foreground mt-0.5">
													Realised: {formatCurrency(cumRealisedPnl)}
												</div>
											)}
										</div>

										{/* Locked */}
										<div className="col-span-2 text-right font-mono text-muted-foreground">
											{formatNumber(locked, 8)}
										</div>
									</div>
								);
							})}
					</div>

					{/* Account Metadata */}
					{accountData && (
						<div className="pt-6 border-t border-border">
							<div className="flex items-center gap-2 mb-3">
								<Info className="icon-sm text-muted-foreground" />
								<span className="text-xs font-semibold text-foreground uppercase tracking-wider">
									Account Information
								</span>
							</div>
							<div className="grid grid-cols-2 gap-3 text-[10px]">
								{accountData.nid && (
									<div>
										<span className="text-muted-foreground">NID:</span>
										<span className="font-mono text-foreground ml-2">
											{accountData.nid}
										</span>
									</div>
								)}
								{accountData.exchange && (
									<div>
										<span className="text-muted-foreground">Exchange:</span>
										<span className="font-semibold text-foreground ml-2 uppercase">
											{accountData.exchange}
										</span>
									</div>
								)}
								{accountData.address && (
									<div className="col-span-2">
										<span className="text-muted-foreground">Address:</span>
										<span className="font-mono text-foreground ml-2 break-all">
											{accountData.address}
										</span>
									</div>
								)}
								{accountData.publicKey && (
									<div className="col-span-2">
										<span className="text-muted-foreground">Public Key:</span>
										<span className="font-mono text-foreground ml-2 break-all text-[9px]">
											{accountData.publicKey}
										</span>
									</div>
								)}
								{accountData.signature && (
									<div className="col-span-2">
										<span className="text-muted-foreground">Signature:</span>
										<span className="font-mono text-foreground ml-2 break-all text-[9px]">
											{accountData.signature}
										</span>
									</div>
								)}
								{accountData.datetime && (
									<div>
										<span className="text-muted-foreground">Last Update:</span>
										<span className="text-foreground ml-2">
											{new Date(accountData.datetime).toLocaleString()}
										</span>
									</div>
								)}
							</div>
							{accountData.note && (
								<div className="mt-3 p-3 rounded border border-border/50 bg-muted/10">
									<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
										Note
									</div>
									<div className="text-xs text-foreground">
										{accountData.note}
									</div>
								</div>
							)}
							{accountData.viewers && accountData.viewers.length > 0 && (
								<div className="mt-3">
									<div className="flex items-center gap-2 mb-2">
										<Users className="icon-xs text-muted-foreground" />
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
											Viewers ({accountData.viewers.length})
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{accountData.viewers.map((viewer, idx) => (
											<span
												key={idx}
												className="text-[9px] font-mono px-2 py-1 rounded bg-muted/30 text-foreground"
											>
												{viewer}
											</span>
										))}
									</div>
								</div>
							)}
							{accountData.workers && accountData.workers.length > 0 && (
								<div className="mt-3">
									<div className="flex items-center gap-2 mb-2">
										<Workflow className="icon-xs text-muted-foreground" />
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
											Workers ({accountData.workers.length})
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{accountData.workers.map((worker, idx) => (
											<span
												key={idx}
												className="text-[9px] font-semibold px-2 py-1 rounded bg-primary/10 text-primary uppercase"
											>
												{worker}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Protocol Settings */}
					{accountData?.protocol && (
						<div className="pt-6 border-t border-border">
							<div className="flex items-center gap-2 mb-3">
								<Settings className="icon-sm text-muted-foreground" />
								<span className="text-xs font-semibold text-foreground uppercase tracking-wider">
									Trading Protocol
								</span>
							</div>
							<div className="space-y-3">
								{accountData.protocol.strategy && (
									<div className="p-3 rounded border border-border/50 bg-muted/10">
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
											Strategy
										</div>
										<div className="text-xs font-semibold text-foreground">
											{accountData.protocol.strategy}
										</div>
									</div>
								)}
								{accountData.protocol.tradingStyle && (
									<div>
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
											Trading Style:
										</span>
										<span className="text-xs font-semibold text-foreground ml-2">
											{accountData.protocol.tradingStyle}
										</span>
									</div>
								)}
								<div className="grid grid-cols-2 gap-3 text-[10px]">
									{accountData.protocol.maxRiskPerTrade !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Max Risk Per Trade:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.maxRiskPerTrade}%
											</span>
										</div>
									)}
									{accountData.protocol.maxLeverage !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Max Leverage:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.maxLeverage}x
											</span>
										</div>
									)}
									{accountData.protocol.maxDrawdown !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Max Drawdown:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.maxDrawdown}%
											</span>
										</div>
									)}
									{accountData.protocol.stopLoss !== undefined && (
										<div>
											<span className="text-muted-foreground">Stop Loss:</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.stopLoss}%
											</span>
										</div>
									)}
									{accountData.protocol.takeProfit !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Take Profit:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.takeProfit}%
											</span>
										</div>
									)}
									{accountData.protocol.riskRewardRatio !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Risk/Reward Ratio:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.riskRewardRatio}:1
											</span>
										</div>
									)}
									{accountData.protocol.portfolioAllocation !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Portfolio Allocation:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.portfolioAllocation}%
											</span>
										</div>
									)}
									{accountData.protocol.slippageTolerance !== undefined && (
										<div>
											<span className="text-muted-foreground">
												Slippage Tolerance:
											</span>
											<span className="font-semibold text-foreground ml-2">
												{accountData.protocol.slippageTolerance}%
											</span>
										</div>
									)}
								</div>
								{accountData.protocol.positionSizing && (
									<div>
										<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
											Position Sizing:
										</span>
										<span className="text-xs font-semibold text-foreground ml-2">
											{accountData.protocol.positionSizing}
										</span>
									</div>
								)}
								{accountData.protocol.markets &&
									accountData.protocol.markets.length > 0 && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
											Markets
										</div>
										<div className="flex flex-wrap gap-2">
											{accountData.protocol.markets.map((market, idx) => (
												<span
													key={idx}
													className="text-[9px] font-semibold px-2 py-1 rounded bg-primary/10 text-primary"
												>
													{market}
												</span>
											))}
										</div>
									</div>
								)}
								{accountData.protocol.orderTypes &&
									accountData.protocol.orderTypes.length > 0 && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
											Order Types
										</div>
										<div className="flex flex-wrap gap-2">
											{accountData.protocol.orderTypes.map((type, idx) => (
												<span
													key={idx}
													className="text-[9px] px-2 py-1 rounded border border-border/50 bg-muted/30 text-foreground"
												>
													{type}
												</span>
											))}
										</div>
									</div>
								)}
								{accountData.protocol.timeframes &&
									accountData.protocol.timeframes.length > 0 && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
											Timeframes
										</div>
										<div className="flex flex-wrap gap-2">
											{accountData.protocol.timeframes.map((tf, idx) => (
												<span
													key={idx}
													className="text-[9px] px-2 py-1 rounded border border-border/50 bg-muted/30 text-foreground"
												>
													{tf}
												</span>
											))}
										</div>
									</div>
								)}
								{accountData.protocol.marketConditions &&
									accountData.protocol.marketConditions.length > 0 && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
											Market Conditions
										</div>
										<div className="flex flex-wrap gap-2">
											{accountData.protocol.marketConditions.map(
												(condition, idx) => (
													<span
														key={idx}
														className="text-[9px] px-2 py-1 rounded border border-border/50 bg-muted/30 text-foreground"
													>
														{condition}
													</span>
												),
											)}
										</div>
									</div>
								)}
								<div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
									{accountData.protocol.hedgingEnabled !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Hedging:
											</span>
											<span
												className={cn(
													"text-xs font-semibold",
													accountData.protocol.hedgingEnabled
														? "text-green-600 dark:text-green-400"
														: "text-muted-foreground",
												)}
											>
												{accountData.protocol.hedgingEnabled
													? "Enabled"
													: "Disabled"}
											</span>
										</div>
									)}
									{accountData.protocol.scalingEnabled !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Scaling:
											</span>
											<span
												className={cn(
													"text-xs font-semibold",
													accountData.protocol.scalingEnabled
														? "text-green-600 dark:text-green-400"
														: "text-muted-foreground",
												)}
											>
												{accountData.protocol.scalingEnabled
													? "Enabled"
													: "Disabled"}
											</span>
										</div>
									)}
									{accountData.protocol.trailingStopEnabled !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Trailing Stop:
											</span>
											<span
												className={cn(
													"text-xs font-semibold",
													accountData.protocol.trailingStopEnabled
														? "text-green-600 dark:text-green-400"
														: "text-muted-foreground",
												)}
											>
												{accountData.protocol.trailingStopEnabled
													? "Enabled"
													: "Disabled"}
											</span>
										</div>
									)}
									{accountData.protocol.dynamicPositionSizing !== undefined && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Dynamic Sizing:
											</span>
											<span
												className={cn(
													"text-xs font-semibold",
													accountData.protocol.dynamicPositionSizing
														? "text-green-600 dark:text-green-400"
														: "text-muted-foreground",
												)}
											>
												{accountData.protocol.dynamicPositionSizing
													? "Enabled"
													: "Disabled"}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Wallet Structure */}
					{accountData?.wallet &&
						(accountData.wallet.free ||
							accountData.wallet.used ||
							accountData.wallet.total ||
							accountData.wallet.debt) &&
						(
							<div className="pt-6 border-t border-border">
								<div className="flex items-center gap-2 mb-3">
									<Network className="icon-sm text-muted-foreground" />
									<span className="text-xs font-semibold text-foreground uppercase tracking-wider">
										Wallet Structure
									</span>
								</div>
								<div className="space-y-2">
									{Object.entries(accountData.wallet.free || {}).map(
										([coin, value]) => {
											const used = accountData.wallet?.used?.[coin] || 0;
											const total = accountData.wallet?.total?.[coin] || 0;
											const debt = accountData.wallet?.debt?.[coin] || 0;

											return (
												<div
													key={coin}
													className="p-3 rounded border border-border/50 bg-muted/10"
												>
													<div className="font-semibold text-xs text-foreground mb-2">
														{coin}
													</div>
													<div className="grid grid-cols-2 gap-2 text-[10px]">
														<div>
															<span className="text-muted-foreground">
																Free:
															</span>
															<span className="font-mono text-foreground ml-2">
																{formatNumber(value as number, 8)}
															</span>
														</div>
														<div>
															<span className="text-muted-foreground">
																Used:
															</span>
															<span className="font-mono text-foreground ml-2">
																{formatNumber(used, 8)}
															</span>
														</div>
														<div>
															<span className="text-muted-foreground">
																Total:
															</span>
															<span className="font-mono text-foreground ml-2">
																{formatNumber(total, 8)}
															</span>
														</div>
														{debt > 0 && (
															<div>
																<span className="text-muted-foreground">
																	Debt:
																</span>
																<span className="font-mono text-red-600 dark:text-red-400 ml-2">
																	{formatNumber(debt, 8)}
																</span>
															</div>
														)}
													</div>
												</div>
											);
										},
									)}
								</div>
							</div>
						)}

					{/* Additional Details Section */}
					{coins.length > 0 && (
						<div className="pt-6 border-t border-border">
							<div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
								Additional Coin Details
							</div>
							<div className="space-y-2">
								{coins
									.filter((coin) => {
										const equity = Number.parseFloat(coin.equity || "0");
										return equity > 0 ||
											Number.parseFloat(coin.usdValue || "0") > 0;
									})
									.map((coin) => {
										const availableToWithdraw = coin.availableToWithdraw
											? Number.parseFloat(coin.availableToWithdraw)
											: null;
										const borrowAmount = coin.borrowAmount
											? Number.parseFloat(coin.borrowAmount)
											: null;
										const spotBorrow = coin.spotBorrow
											? Number.parseFloat(coin.spotBorrow)
											: null;

										return (
											<div
												key={`details-${coin.coin}`}
												className="p-3 rounded border border-border/50 bg-muted/10"
											>
												<div className="font-semibold text-xs text-foreground mb-2">
													{coin.coin}
												</div>
												<div className="grid grid-cols-2 gap-2 text-[10px]">
													{availableToWithdraw !== null && (
														<div>
															<span className="text-muted-foreground">
																Available to Withdraw:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(availableToWithdraw, 8)}
															</span>
														</div>
													)}
													{borrowAmount !== null && borrowAmount > 0 && (
														<div>
															<span className="text-muted-foreground">
																Borrow Amount:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(borrowAmount, 8)}
															</span>
														</div>
													)}
													{spotBorrow !== null && spotBorrow > 0 && (
														<div>
															<span className="text-muted-foreground">
																Spot Borrow:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(spotBorrow, 8)}
															</span>
														</div>
													)}
													{coin.accruedInterest &&
														Number.parseFloat(coin.accruedInterest) !== 0 && (
														<div>
															<span className="text-muted-foreground">
																Accrued Interest:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(coin.accruedInterest, 8)}
															</span>
														</div>
													)}
													{coin.bonus && Number.parseFloat(coin.bonus) !== 0 &&
														(
															<div>
																<span className="text-muted-foreground">
																	Bonus:
																</span>
																<span className="font-mono text-foreground">
																	{formatNumber(coin.bonus, 8)}
																</span>
															</div>
														)}
													{coin.totalPositionIM &&
														Number.parseFloat(coin.totalPositionIM) !== 0 && (
														<div>
															<span className="text-muted-foreground">
																Position IM:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(coin.totalPositionIM, 8)}
															</span>
														</div>
													)}
													{coin.totalPositionMM &&
														Number.parseFloat(coin.totalPositionMM) !== 0 && (
														<div>
															<span className="text-muted-foreground">
																Position MM:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(coin.totalPositionMM, 8)}
															</span>
														</div>
													)}
													{coin.totalOrderIM &&
														Number.parseFloat(coin.totalOrderIM) !== 0 && (
														<div>
															<span className="text-muted-foreground">
																Order IM:
															</span>
															<span className="font-mono text-foreground">
																{formatNumber(coin.totalOrderIM, 8)}
															</span>
														</div>
													)}
													{coin.collateralSwitch !== undefined && (
														<div>
															<span className="text-muted-foreground">
																Collateral Switch:
															</span>
															<span className="font-mono text-foreground">
																{coin.collateralSwitch ? "On" : "Off"}
															</span>
														</div>
													)}
												</div>
											</div>
										);
									})}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
