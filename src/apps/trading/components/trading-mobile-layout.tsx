/**
 * Trading Mobile Layout Component
 * Mobile-optimized layout for trading terminal
 */

import React, { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderBook } from "./order-book";
import { OrdersList } from "./orders-list";
import { TradesList } from "./trades-list";
import { OrderController } from "./order-controller";
import { ChartSkeleton } from "./skeleton-loaders";
import { useTradingStore } from "../store";

// Lazy load heavy components
const TradingChart = lazy(() =>
	import("./trading-chart").then((module) => ({
		default: module.TradingChart,
	}))
);

/**
 * Trading Mobile Layout Component
 */
export function TradingMobileLayout(): React.ReactElement {
	const { activeOrdersTradesTab, setActiveOrdersTradesTab } = useTradingStore();

	return (
		<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
			{/* Chart */}
			<div className="min-h-[40vh] rounded border border-border overflow-hidden">
				<Suspense fallback={<ChartSkeleton />}>
					<TradingChart />
				</Suspense>
			</div>

			{/* Order Book */}
			<div className="min-h-[30vh] rounded border border-border overflow-hidden">
				<OrderBook />
			</div>

			{/* Orders/Trades Tabs */}
			<div className="min-h-[40vh] rounded border border-border overflow-hidden">
				<Tabs
					value={activeOrdersTradesTab}
					onValueChange={setActiveOrdersTradesTab}
					defaultValue="orders"
					className="h-full"
				>
					<TabsList className="grid w-full grid-cols-2 rounded-none border-b">
						<TabsTrigger value="orders" className="text-xs">
							Orders
						</TabsTrigger>
						<TabsTrigger value="trades" className="text-xs">
							Trades
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="orders"
						className="h-[calc(100%-2.5rem)] mt-0"
					>
						<OrdersList />
					</TabsContent>
					<TabsContent
						value="trades"
						className="h-[calc(100%-2.5rem)] mt-0"
					>
						<TradesList />
					</TabsContent>
				</Tabs>
			</div>

			{/* Order Controller */}
			<div className="min-h-[40vh] rounded border border-border overflow-hidden">
				<OrderController />
			</div>
		</div>
	);
}
