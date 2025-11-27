/**
 * Trading Desktop Layout Component
 * Desktop-optimized layout with chart and side panel
 */

import React, { lazy, Suspense } from "react";
import { ChartSkeleton } from "./skeleton-loaders";
import { TradingSidePanel } from "./trading-side-panel";

// Lazy load heavy components
const TradingChart = lazy(() =>
	import("./trading-chart").then((module) => ({
		default: module.TradingChart,
	}))
);

/**
 * Trading Desktop Layout Component
 */
export function TradingDesktopLayout(): React.ReactElement {
	return (
		<div className="flex-1 flex w-full h-full">
			<div className="flex-1 flex relative w-full h-full">
				<Suspense fallback={<ChartSkeleton />}>
					<TradingChart />
				</Suspense>

				{/* Side Panel: Order Book, Market Trades, Balance, Order Controller, and Orders/Trades */}
				<TradingSidePanel />
			</div>
		</div>
	);
}
