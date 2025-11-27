/**
 * Trading Header Component
 * Header with ticker, statistics, and controls
 */

import React from "react";
import { AccountSelector } from "./account-selector";
import { SymbolSelector } from "./symbol-selector";
import { ExchangeSelector } from "./exchange-selector";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Eye, Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountBalance, ExchangeAccount, Ticker } from "../types";
import { formatBalance, formatPrice, formatVolume } from "../lib/formatting";
import { useTradingStore } from "../store";

interface TradingHeaderProps {
	sessionTicker: Ticker | null;
	sessionBalance: AccountBalance | null;
	selectedSymbol: string | null;
	selectedAccount: ExchangeAccount | null;
	loading: boolean;
	lastUpdateTime: number | null;
	autoRefreshEnabled: boolean;
	onRefresh: () => void;
	onToggleAutoRefresh: () => void;
}

/**
 * Trading Header Component
 */
export function TradingHeader({
	sessionTicker,
	sessionBalance,
	selectedSymbol,
	selectedAccount,
	loading,
	lastUpdateTime,
	autoRefreshEnabled,
	onRefresh,
	onToggleAutoRefresh,
}: TradingHeaderProps): React.ReactElement {
	const { isViewOnly } = useTradingStore();
	const formatLastUpdate = (timestamp: number | null): string => {
		if (!timestamp) return "Never";
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 10) return "Just now";
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	};

	return (
		<div className="flex-shrink-0 border-b border-border/50 bg-card/30 backdrop-blur-sm">
			<div className="flex items-center justify-between px-3 py-2 gap-3">
				{/* Left: Symbol and Exchange Section */}
				<div className="flex items-center gap-3 min-w-0 flex-shrink">
					<SymbolSelector />
					<ExchangeSelector />
				</div>

				{/* Center: Market Statistics - Compact Inline */}
				{sessionTicker && selectedSymbol && (
					<div className="hidden lg:flex items-center gap-3 px-3 flex-1 justify-center">
						<div className="flex items-center gap-3 text-xs">
							{/* 24h High */}
							<div className="flex items-center gap-1.5">
								<span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
									H:
								</span>
								<span className="text-xs font-semibold text-foreground font-mono">
									{formatPrice(sessionTicker.high)}
								</span>
							</div>

							<div className="h-3 w-px bg-border/50" />

							{/* 24h Low */}
							<div className="flex items-center gap-1.5">
								<span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
									L:
								</span>
								<span className="text-xs font-semibold text-foreground font-mono">
									{formatPrice(sessionTicker.low)}
								</span>
							</div>

							<div className="h-3 w-px bg-border/50" />

							{/* 24h Volume */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center gap-1.5 cursor-help">
											<span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
												V:
											</span>
											<span className="text-xs font-semibold text-foreground font-mono">
												{formatVolume(sessionTicker.quoteVolume)}
											</span>
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<div className="text-xs">
											<div className="font-semibold mb-1">24h Volume</div>
											<div className="text-muted-foreground">
												Base: {formatVolume(sessionTicker.baseVolume)}
											</div>
											<div className="text-muted-foreground">
												Quote: {formatVolume(sessionTicker.quoteVolume)}
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							{sessionTicker.vwap && (
								<>
									<div className="h-3 w-px bg-border/50" />
									{/* VWAP */}
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center gap-1.5 cursor-help">
													<span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
														VWAP:
													</span>
													<span className="text-xs font-semibold text-foreground font-mono">
														{formatPrice(sessionTicker.vwap)}
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<div className="text-xs">
													<div className="font-semibold mb-1">
														Volume Weighted Average Price
													</div>
													<div className="text-muted-foreground">
														Average price weighted by volume
													</div>
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</>
							)}
						</div>
					</div>
				)}

				{/* Right: Account & Actions */}
				<div className="flex items-center gap-2 flex-shrink-0">
					{/* View-only mode indicator */}
					{isViewOnly && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 cursor-help">
										<Eye className="icon-xs text-amber-500" />
										<span className="text-xs font-medium text-amber-500">
											View-Only
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="text-xs">
										<div className="font-semibold mb-1">View-Only Mode</div>
										<div className="text-muted-foreground">
											You can view market data without an account. Add an account to create orders.
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{sessionBalance && selectedAccount && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border border-border/30 cursor-help hover:bg-muted/60 transition-colors">
										<Activity className="icon-xs text-muted-foreground/70" />
										<div className="flex items-center gap-1.5">
											{Object.entries(sessionBalance.balances)
												.filter(([, balance]) => balance.total > 0)
												.slice(0, 2)
												.map(([currency, balance]) => (
													<div
														key={currency}
														className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/60"
													>
														<span className="font-semibold text-muted-foreground/80 uppercase text-[9px] tracking-wider">
															{currency}
														</span>
														<span className="font-bold text-foreground font-mono text-[10px]">
															{formatBalance(balance.free)}
														</span>
													</div>
												))}
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="text-xs space-y-1">
										<div className="font-semibold mb-2">Account Balance</div>
										{Object.entries(sessionBalance.balances)
											.filter(([, balance]) =>
												balance.total > 0
											)
											.map(([currency, balance]) => (
												<div
													key={currency}
													className="flex justify-between gap-4"
												>
													<span className="font-medium">{currency}:</span>
													<span className="font-mono">
														{formatBalance(balance.free, 8)} /{" "}
														{formatBalance(balance.total, 8)}
													</span>
												</div>
											))}
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<AccountSelector />
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={onToggleAutoRefresh}
									disabled={isViewOnly || !selectedAccount || !selectedSymbol}
									className={cn(
										"h-7 w-7 p-0",
										autoRefreshEnabled && "text-primary bg-primary/10",
									)}
									aria-label={autoRefreshEnabled
										? "Disable auto-refresh"
										: "Enable auto-refresh"}
								>
									{autoRefreshEnabled
										? <Pause className="icon-xs" />
										: <Play className="icon-xs" />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<div className="text-xs">
									<div className="font-semibold mb-1">
										{autoRefreshEnabled
											? "Auto-refresh enabled"
											: "Auto-refresh disabled"}
									</div>
									<div className="text-muted-foreground">
										{lastUpdateTime &&
											`Last update: ${formatLastUpdate(lastUpdateTime)}`}
									</div>
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={onRefresh}
									disabled={isViewOnly || loading || !selectedAccount || !selectedSymbol}
									className="h-7 w-7 p-0"
									aria-label="Refresh data"
								>
									<RefreshCw
										className={cn(
											"icon-xs",
											loading && "animate-spin",
										)}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<div className="text-xs">
									<div className="font-semibold mb-1">Refresh data</div>
									<div className="text-muted-foreground">
										{lastUpdateTime &&
											`Last update: ${formatLastUpdate(lastUpdateTime)}`}
									</div>
									<div className="text-muted-foreground mt-1">
										Press Ctrl/Cmd + R
									</div>
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	);
}
