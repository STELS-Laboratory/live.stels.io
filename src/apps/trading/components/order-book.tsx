/**
 * Order Book Component
 * Displays order book with bids and asks, plus market trades
 * Optimized with React.memo for performance
 */

import React, { startTransition, useCallback, useEffect, useMemo, useRef } from "react";
import { useTradingStore } from "../store";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	formatPrice,
	formatPercentage,
	formatUSD,
	formatOrderBookQuantity,
	formatOrderBookTotal,
} from "../lib/formatting";

/**
 * Order Book Component
 */
export const OrderBook = React.memo(function OrderBook(): React.ReactElement {
	const { orderBook, selectedSymbol, ticker, setSelectedPrice } =
		useTradingStore();
	const asksScrollRef = useRef<HTMLDivElement>(null);
	const bidsScrollRef = useRef<HTMLDivElement>(null);

	const { bids, asks, spread, midPrice } = useMemo(() => {
		if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) {
			return {
				bids: [],
				asks: [],
				spread: 0,
				midPrice: 0,
			};
		}

		const topBid = orderBook.bids[0];
		const topAsk = orderBook.asks[0];
		const spreadValue = topAsk.price - topBid.price;
		const midPriceValue = (topBid.price + topAsk.price) / 2;

		return {
			bids: orderBook.bids.slice(0, 20), // Top 20 bids
			asks: orderBook.asks.slice(0, 20), // Top 20 asks
			spread: spreadValue,
			midPrice: midPriceValue,
		};
	}, [orderBook]);

	// Handle order row click to set price
	// Optimized with startTransition to avoid blocking click handler
	const handleOrderClick = useCallback((price: number): void => {
		// Use startTransition for non-critical state updates to avoid blocking
		startTransition(() => {
			setSelectedPrice(price);
		});
	}, [setSelectedPrice]);

	// Scroll asks to show closest ask at bottom (center) when data changes
	// Asks grow upward from center, so closest ask should be at bottom of container
	// With justify-end, content is at bottom, scroll to bottom to show it
	// Optimized to avoid forced reflow violations
	useEffect(() => {
		if (asksScrollRef.current && asks.length > 0) {
			// Use requestAnimationFrame to batch DOM operations and avoid forced reflow
			const rafId = requestAnimationFrame(() => {
				const scrollElement = asksScrollRef.current?.querySelector(
					"[data-radix-scroll-area-viewport]",
				) as HTMLElement;
				if (scrollElement) {
					// Batch scroll operations in single frame to avoid forced reflow
					requestAnimationFrame(() => {
						scrollElement.scrollTop = scrollElement.scrollHeight;
					});
				}
			});
			return () => cancelAnimationFrame(rafId);
		}
	}, [asks]);

	// Scroll bids to top (center) when data changes
	// Bids grow downward from center, so closest bid should be at top of container
	// Optimized to avoid forced reflow violations
	useEffect(() => {
		if (bidsScrollRef.current && bids.length > 0) {
			// Use requestAnimationFrame to batch DOM operations and avoid forced reflow
			const rafId = requestAnimationFrame(() => {
				const scrollElement = bidsScrollRef.current?.querySelector(
					"[data-radix-scroll-area-viewport]",
				) as HTMLElement;
				if (scrollElement) {
					scrollElement.scrollTop = 0;
				}
			});
			return () => cancelAnimationFrame(rafId);
		}
	}, [bids]);

	if (!orderBook || !selectedSymbol) {
		return (
			<div className="flex items-center justify-center h-full bg-muted/20 rounded border border-border">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No order book data
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

	// Calculate total volume for depth visualization
	const maxBidVolume = Math.max(...bids.map((b) => b.amount), 0);
	const maxAskVolume = Math.max(...asks.map((a) => a.amount), 0);
	const maxVolume = Math.max(maxBidVolume, maxAskVolume);

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Professional Current Price Display */}
			{ticker && midPrice > 0 && (
				<div className="flex-shrink-0 px-4 py-2.5 border-b border-border bg-muted/30">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
								Price
							</span>
							<span
								className={cn(
									"text-base font-bold font-mono",
									ticker.change >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{formatPrice(ticker.last)}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs">
							<div className="px-2.5 py-1 rounded bg-background/50 border border-border/50">
								<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-2">
									Spread:
								</span>
							<span className="font-bold text-foreground font-mono">
								{formatPrice(spread)}{" "}
								({formatPercentage((spread / midPrice) * 100, 3)})
							</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Order Book - Bids and Asks with equal height and internal scrolling */}
			<div className="flex-1 flex flex-col overflow-hidden min-h-0">
				{/* Column Headers */}
				<div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-border/50 bg-muted/10">
					<div className="flex-1 text-left">Price(USDT)</div>
					<div className="text-right w-20">Qty</div>
					<div className="text-right w-20">Total</div>
				</div>

				{/* Asks (Sell orders) - Growing from center upward */}
				<div
					ref={asksScrollRef}
					className="flex-1 flex flex-col overflow-hidden min-h-0"
				>
					<ScrollArea className="flex-1 h-full">
						{/* Wrapper to override ScrollArea's table display */}
						<div style={{ display: "block", minHeight: "100%" }}>
							{/* flex-col with justify-end: asks start from center (bottom) and grow upward */}
							<div
								className="flex flex-col justify-end"
								style={{
									minHeight: "100%",
									display: "flex",
									flexDirection: "column",
									justifyContent: "flex-end",
								}}
							>
								{/* Display asks in normal order (closest first), justify-end places them at bottom */}
								{asks.map((ask, index) => {
									const volumeRatio = ask.amount / maxVolume;
									return (
										<div
											key={`ask-${ask.price}-${index}`}
											onClick={(): void => handleOrderClick(ask.price)}
											className="relative flex items-center justify-between px-3 py-1 hover:bg-muted/30 transition-colors cursor-pointer group flex-shrink-0 active:bg-muted/50"
										>
											{/* Depth visualization */}
											<div
												className="absolute right-0 top-0 bottom-0 bg-red-500/15 transition-opacity group-hover:opacity-80"
												style={{ width: `${volumeRatio * 100}%` }}
											/>
											{/* Price */}
											<div className="relative z-10 flex items-center gap-2 flex-1">
												<span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">
													{formatPrice(ask.price)}
												</span>
											</div>
											{/* Amount */}
											<div className="relative z-10 text-xs text-foreground font-mono w-20 text-right">
												{formatOrderBookQuantity(ask.amount)}
											</div>
											{/* Total */}
											<div className="relative z-10 text-xs text-muted-foreground font-mono w-20 text-right">
												{formatOrderBookTotal(ask.price * ask.amount)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</ScrollArea>
				</div>

				{/* Professional Current Price Indicator - Fixed in the middle */}
				{ticker && midPrice > 0 && (
					<div className="flex-shrink-0 flex items-center justify-center px-3 py-2.5 border-t border-b bg-muted/40">
						<div className="flex items-center gap-3">
							<span
								className={cn(
									"text-base font-bold font-mono",
									ticker.change >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{formatPrice(ticker.last)}
							</span>
							<div className="h-4 w-px bg-border" />
							<span className="text-xs font-medium text-green-600 dark:text-green-400 font-mono">
								≈${formatUSD(ticker.last)} USD
							</span>
						</div>
					</div>
				)}

				{/* Bids (Buy orders) - Growing from center downward */}
				<div
					ref={bidsScrollRef}
					className="flex-1 flex flex-col overflow-hidden min-h-0"
				>
					<ScrollArea className="flex-1 h-full">
						{/* flex-col: bids start from center (top) and grow downward */}
						<div className="flex flex-col min-h-full">
							{bids.map((bid, index) => {
								const volumeRatio = bid.amount / maxVolume;
								return (
									<div
										key={`bid-${bid.price}-${index}`}
										onClick={(): void => handleOrderClick(bid.price)}
										className="relative flex items-center justify-between px-3 py-0.5 hover:bg-muted/30 transition-colors cursor-pointer group flex-shrink-0 active:bg-muted/50"
									>
										{/* Depth visualization */}
										<div
											className="absolute left-0 top-0 bottom-0 bg-green-500/15 transition-opacity group-hover:opacity-80"
											style={{ width: `${volumeRatio * 100}%` }}
										/>
										{/* Price */}
										<div className="relative z-10 flex items-center gap-2 flex-1">
											<span className="text-xs font-mono font-semibold text-green-600 dark:text-green-400">
												{formatPrice(bid.price)}
											</span>
										</div>
										{/* Amount */}
										<div className="relative z-10 text-xs text-foreground font-mono w-20 text-right">
											{formatOrderBookQuantity(bid.amount)}
										</div>
										{/* Total */}
										<div className="relative z-10 text-xs text-muted-foreground font-mono w-20 text-right">
											{formatOrderBookTotal(bid.price * bid.amount)}
										</div>
									</div>
								);
							})}
							{/* Spacer to push content to center when there are few items */}
							<div className="flex-1" />
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
});
