/**
 * Market Candle Chart Component
 * Mini candlestick chart for market cards
 */

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { CandlestickChart, LineChart } from "echarts/charts";
import {
	GridComponent,
	TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { cn } from "@/lib/utils";

// Register ECharts components
echarts.use([
	CandlestickChart,
	LineChart,
	GridComponent,
	TooltipComponent,
	CanvasRenderer,
]);

/**
 * Candle data structure
 */
export interface Candle {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

interface MarketCandleChartProps {
	candles: Candle[];
	className?: string;
	height?: number;
}

/**
 * Market Candle Chart Component - Memoized for performance
 */
export const MarketCandleChart = React.memo(function MarketCandleChart({
	candles,
	className,
	height = 64,
}: MarketCandleChartProps): React.ReactElement {
	const chartOption = useMemo(() => {
		if (!candles || candles.length === 0) {
			return null;
		}

		// Prepare data for candlestick chart
		const times: string[] = [];
		const candlestickData: number[][] = [];
		const volumes: number[] = [];

		candles.forEach((candle) => {
			times.push(new Date(candle.timestamp).toISOString());
			// Format: [open, close, low, high]
			candlestickData.push([
				candle.open,
				candle.close,
				candle.low,
				candle.high,
			]);
			volumes.push(candle.volume);
		});

		// Determine trend color
		const upColor = "#10b981";
		const downColor = "#ef4444";

		return {
			backgroundColor: "transparent",
			animation: false,
			// Disable tooltip for mini charts to improve performance
			tooltip: {
				show: false,
			},
			grid: {
				left: 0,
				right: 0,
				top: 2,
				bottom: 0,
				containLabel: false,
			},
			xAxis: {
				type: "category",
				data: times,
				show: false,
				boundaryGap: false,
				scale: true,
				silent: true, // Disable interaction for better performance
			},
			yAxis: {
				type: "value",
				show: false,
				scale: true,
				splitLine: {
					show: false,
				},
				silent: true, // Disable interaction for better performance
			},
			series: [
				{
					type: "candlestick",
					data: candlestickData,
					itemStyle: {
						color: upColor,
						color0: downColor,
						borderColor: upColor,
						borderColor0: downColor,
					},
					barWidth: "60%",
					barMinWidth: 1,
					barMaxWidth: 8,
					silent: true, // Disable interaction for better performance
					// Reduce data points for better performance
					sampling: "lttb", // Largest-Triangle-Three-Buckets algorithm
					samplingThreshold: 50, // Only sample if more than 50 points
				},
			],
		};
	}, [candles]);

	if (!chartOption) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted/10 rounded border border-border",
					className,
				)}
				style={{ height: `${height}px` }}
			>
				<div className="text-[10px] text-muted-foreground">No data</div>
			</div>
		);
	}

	return (
		<div className={cn("relative w-full", className)} style={{ height: `${height}px` }}>
			<ReactECharts
				option={chartOption}
				style={{ width: "100%", height: `${height}px`, minHeight: `${height}px` }}
				opts={{
					renderer: "canvas",
					// Reduce devicePixelRatio for better performance on mini charts
					devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
				}}
				notMerge={true} // Use notMerge for better performance
				lazyUpdate={true} // Enable lazy update for better performance
			/>
		</div>
	);
}, (prevProps, nextProps) => {
	// Only re-render if candles data actually changed
	if (prevProps.candles.length !== nextProps.candles.length) {
		return false;
	}
	
	// Check if any candle changed significantly
	// Only update if last candle changed (most important for mini charts)
	const prevLast = prevProps.candles[prevProps.candles.length - 1];
	const nextLast = nextProps.candles[nextProps.candles.length - 1];
	
	if (!prevLast || !nextLast) {
		return false;
	}
	
	// Only update if last candle's close price changed significantly (>0.1%)
	const priceChange = Math.abs((nextLast.close - prevLast.close) / prevLast.close);
	if (priceChange > 0.001) {
		return false;
	}
	
	// Check if timestamps match (data structure changed)
	return prevLast.timestamp === nextLast.timestamp;
});

