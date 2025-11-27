/**
 * Trading Tablet Layout Component
 * Tablet-optimized grid layout for trading terminal
 */

import React, { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderBook } from "./order-book";
import { OrdersList } from "./orders-list";
import { TradesList } from "./trades-list";
import { OrderController } from "./order-controller";
import {
	ChartSkeleton,
	OrderBookSkeleton,
	OrderControllerSkeleton,
	OrdersListSkeleton,
} from "./skeleton-loaders";
import { useTradingStore } from "../store";
import { useOrderBookFromSession, useTickerFromSession } from "../hooks/use-trading-session-data";

// Lazy load heavy components
const TradingChart = lazy(() =>
	import("./trading-chart").then((module) => ({
		default: module.TradingChart,
	}))
);

/**
 * Trading Tablet Layout Component
 */
export function TradingTabletLayout(): React.ReactElement {
	const {
		selectedAccount,
		selectedSymbol,
		selectedExchange,
		activeOrdersTradesTab,
		setActiveOrdersTradesTab,
		orders,
		loading,
	} = useTradingStore();

	// Use selectedAccount exchange if available, otherwise use selectedExchange (view-only mode)
	const currentExchange = selectedAccount?.exchange || selectedExchange || "bybit";

	const sessionOrderBook = useOrderBookFromSession(
		selectedSymbol,
		currentExchange,
	);
	const sessionTicker = useTickerFromSession(
		selectedSymbol,
		currentExchange,
	);

	return (
		<div className="flex-1 w-full grid grid-cols-2 grid-rows-2 gap-2 p-2 min-h-0">
			{/* Top Left: Chart */}
			<div className="col-span-1 row-span-1 overflow-hidden bg-card border border-border rounded">
				{!sessionTicker || !selectedSymbol
					? <ChartSkeleton />
					: (
						<Suspense fallback={<ChartSkeleton />}>
							<TradingChart />
						</Suspense>
					)}
			</div>

			{/* Top Right: Order Book */}
			<div className="col-span-1 row-span-1 overflow-hidden bg-card border border-border rounded">
				{!sessionOrderBook || !selectedSymbol
					? <OrderBookSkeleton />
					: <OrderBook />}
			</div>

			{/* Bottom Left: Order Controller */}
			<div className="col-span-1 row-span-1 overflow-hidden bg-card border border-border rounded">
				{!selectedAccount || !selectedSymbol
					? <OrderControllerSkeleton />
					: <OrderController />}
			</div>

			{/* Bottom Right: Orders/Trades Tabs */}
			<div className="col-span-1 row-span-1 overflow-hidden bg-card border border-border rounded">
				<Tabs
					value={activeOrdersTradesTab}
					onValueChange={setActiveOrdersTradesTab}
					defaultValue="orders"
					className="h-full w-full flex flex-col"
				>
					<TabsList className="grid w-full grid-cols-2 flex-shrink-0 m-2 mb-0 rounded text-[10px]">
						<TabsTrigger value="orders" className="font-medium">
							Orders
						</TabsTrigger>
						<TabsTrigger value="trades" className="font-medium">
							Trades
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="orders"
						className="flex-1 overflow-y-auto overflow-x-hidden mt-2 min-h-0"
					>
						{loading && orders.length === 0
							? <OrdersListSkeleton />
							: <OrdersList />}
					</TabsContent>
					<TabsContent
						value="trades"
						className="flex-1 overflow-y-auto overflow-x-hidden mt-2 min-h-0"
					>
						<TradesList />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
