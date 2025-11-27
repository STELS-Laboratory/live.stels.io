/**
 * Trades List Component
 * Displays list of executed trades
 * Optimized with React.memo for performance
 */

import React, { useCallback } from "react";
import { useTradingStore } from "../store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatPrice, formatAmount, formatCost } from "../lib/formatting";

/**
 * Trades List Component
 */
export const TradesList = React.memo(function TradesList(): React.ReactElement {
	const { trades, selectedSymbol } = useTradingStore();

	// Filter trades by selected symbol
	// Note: API should already filter by account nid, but we ensure symbol matches
	const filteredTrades = React.useMemo(() => {
		if (!selectedSymbol) return trades;
		// Filter by symbol - API should have already filtered by account nid
		return trades.filter((trade) => trade.symbol === selectedSymbol);
	}, [trades, selectedSymbol]);

	// Use centralized formatting functions - no local functions needed

	const formatTime = useCallback((timestamp: number): string => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}, []);

	if (filteredTrades.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No trades found
					</div>
					{!selectedSymbol && (
						<div className="text-xs text-muted-foreground/70 mt-1">
							Select a trading pair
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Professional Table Header */}
			<div className="flex-shrink-0 grid grid-cols-12 gap-2 px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
				<div className="col-span-2">Side</div>
				<div className="col-span-2">Price</div>
				<div className="col-span-2">Amount</div>
				<div className="col-span-2">Cost</div>
				<div className="col-span-2">Fee</div>
				<div className="col-span-2">Time</div>
			</div>

			{/* Trades List */}
			<ScrollArea className="flex-1">
				<div className="divide-y divide-border/50">
					{filteredTrades.map((trade) => {
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
								<div className={cn(
									"col-span-2 font-mono font-semibold",
									isBuy
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}>
									{formatPrice(trade.price)}
								</div>
								
								{/* Amount */}
								<div className="col-span-2 font-mono text-foreground">
									{formatAmount(trade.amount)}
								</div>
								
								{/* Cost */}
								<div className="col-span-2 font-mono text-foreground">
									{formatCost(trade.cost)}
								</div>
								
								{/* Fee */}
								<div className="col-span-2 font-mono text-muted-foreground">
									{trade.fee?.cost !== undefined
										? `${formatAmount(trade.fee.cost)} ${trade.fee.currency || ""}`
										: trade.fees?.length
											? `${formatAmount(trade.fees[0].cost || 0)} ${trade.fees[0].currency || ""}`
											: "—"}
								</div>
								
								{/* Time */}
								<div className="col-span-2 font-mono text-muted-foreground text-[10px]">
									{formatTime(trade.timestamp)}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
});
