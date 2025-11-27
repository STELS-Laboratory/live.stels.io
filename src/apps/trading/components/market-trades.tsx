/**
 * Market Trades Component
 * Displays recent market trades from the exchange
 * Optimized with React.memo for performance
 */

import React from "react";
import { useTradingStore } from "../store";
import { useMarketTradesFromSession } from "../hooks/use-market-trades-from-session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatPrice, formatAmount } from "../lib/formatting";

/**
 * Market Trades Component
 */
export const MarketTrades = React.memo(function MarketTrades(): React.ReactElement {
	const { selectedSymbol, selectedAccount, selectedExchange } = useTradingStore();
	
	// Use selectedAccount exchange if available, otherwise use selectedExchange (view-only mode)
	const currentExchange = selectedAccount?.exchange || selectedExchange || "bybit";
	
	// Get market trades from session
	const marketTrades = useMarketTradesFromSession(
		selectedSymbol,
		currentExchange,
		100, // Show last 100 trades
	);

	// Use centralized formatting functions - no local functions needed

	if (!selectedSymbol) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No market trades
					</div>
					<div className="text-xs text-muted-foreground/70 mt-1">
						Select a trading pair
					</div>
				</div>
			</div>
		);
	}

	if (marketTrades.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-sm text-muted-foreground">
					No recent trades
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Professional Table Header */}
			<div className="flex-shrink-0 grid grid-cols-12 gap-2 px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
				<div className="col-span-2">Side</div>
				<div className="col-span-3">Price</div>
				<div className="col-span-3">Amount</div>
				<div className="col-span-4">Time</div>
			</div>

			{/* Trades List */}
			<ScrollArea className="flex-1">
				<div className="divide-y divide-border/50">
					{marketTrades.map((trade) => {
						const isBuy = trade.side === "buy";

						return (
							<div
								key={trade.id}
								className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-xs"
							>
								{/* Side */}
								<div className="col-span-2">
									<span
										className={cn(
											"font-semibold font-mono",
											isBuy
												? "text-green-600 dark:text-green-400"
												: "text-red-600 dark:text-red-400",
										)}
									>
										{trade.side.toUpperCase()}
									</span>
								</div>

								{/* Price */}
								<div
									className={cn(
										"col-span-3 font-mono font-semibold",
										isBuy
											? "text-green-600 dark:text-green-400"
											: "text-red-600 dark:text-red-400",
									)}
								>
									{formatPrice(trade.price)}
								</div>

								{/* Amount */}
								<div className="col-span-3 font-mono text-foreground">
									{formatAmount(trade.amount)}
								</div>

								{/* Time */}
								<div className="col-span-4 font-mono text-muted-foreground text-[10px]">
									{new Date(trade.timestamp).toLocaleTimeString("en-US", {
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
});
