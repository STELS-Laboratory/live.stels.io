/**
 * Virtualized Top Markets Component
 * Example of using VirtualizedGrid for large market lists
 */

import React, { useMemo } from "react";
import { VirtualizedGrid } from "@/components/virtualized/virtualized_list";
import type { MarketTickerData } from "./top_markets";

interface TopMarketsVirtualizedProps {
	tickers: MarketTickerData[];
	onMarketClick?: (market: string, exchange: string) => void;
	containerHeight?: number;
}

/**
 * Virtualized Top Markets Component
 * Efficiently renders large market lists
 */
export function TopMarketsVirtualized({
	tickers,
	onMarketClick,
	containerHeight = 600,
}: TopMarketsVirtualizedProps): React.ReactElement {
	// Calculate grid dimensions
	const columns = 4;
	const itemWidth = 200;
	const itemHeight = 120;

	const handleMarketClick = (ticker: MarketTickerData): void => {
		if (onMarketClick && ticker.exchange && ticker.market) {
			onMarketClick(ticker.market, ticker.exchange);
		}
	};

	return (
		<VirtualizedGrid
			items={tickers}
			itemWidth={itemWidth}
			itemHeight={itemHeight}
			containerWidth={columns * itemWidth}
			containerHeight={containerHeight}
			columns={columns}
			overscan={2}
			renderItem={(ticker, index) => (
				<div
					key={`${ticker.market}-${ticker.exchange}-${index}`}
					className="p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
					onClick={() => handleMarketClick(ticker)}
				>
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-foreground">
								{ticker.market}
							</span>
							<span className="text-sm text-muted-foreground">
								{ticker.exchange}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<div className="text-lg font-bold text-foreground">
								${ticker.last?.toFixed(2) ?? "0.00"}
							</div>
							<div
								className={`text-sm ${
									(ticker.change ?? 0) >= 0
										? "text-green-500"
										: "text-red-500"
								}`}
							>
								{(ticker.change ?? 0) >= 0 ? "+" : ""}
								{ticker.change?.toFixed(2) ?? "0.00"} (
								{ticker.percentage?.toFixed(2) ?? "0.00"}%)
							</div>
							<div className="text-xs text-muted-foreground">
								Vol: {ticker.baseVolume?.toFixed(2) ?? "0.00"}
							</div>
						</div>
					</div>
				</div>
			)}
			keyExtractor={(ticker, index) =>
				`${ticker.market}-${ticker.exchange}-${index}`
			}
			className="w-full"
		/>
	);
}

