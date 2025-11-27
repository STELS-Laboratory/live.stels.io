/**
 * Index Chart Component
 * Displays candle/line chart for index data
 * Built with Apache ECharts
 */

import * as React from "react";
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { cn } from "@/lib/utils";
import type { IndexCandleData, Timeframe } from "../types";
import { useChartColors } from "@/hooks/use_chart_colors";

// Register ECharts components
echarts.use([
	LineChart,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	CanvasRenderer,
]);

interface IndexChartProps {
	candleData: IndexCandleData | null;
	timeframe: Timeframe;
	className?: string;
}

/**
 * Index Chart Component
 * Professional Bloomberg/Palantir style chart
 * Built with Apache ECharts
 */
export function IndexChart({
	candleData,
	timeframe,
	className,
}: IndexChartProps): React.ReactElement {
	const colors = useChartColors();

	const chartOption = useMemo(() => {
		if (!candleData || candleData.candles.length === 0) {
			return null;
		}

		const candles = candleData.candles;
		const times: string[] = [];
		const values: number[] = [];

		candles.forEach((candle) => {
			times.push(new Date(candle.timestamp).toISOString());
			values.push(candle.close);
		});

		// Get color based on trend
		const isUp = candles[candles.length - 1]?.close >= candles[0]?.close;
		const lineColor = isUp ? colors.upColor : colors.downColor;

		return {
			backgroundColor: "transparent",
			animation: true,
			animationDuration: 300,
			animationEasing: "cubicOut",
			tooltip: {
				trigger: "axis",
				axisPointer: {
					type: "cross",
					label: {
						backgroundColor: colors.background,
						color: colors.textColor,
					},
				},
				backgroundColor: colors.background,
				borderColor: colors.borderColor,
				textStyle: {
					color: colors.textColor,
				},
				formatter: (params: unknown): string => {
					if (!Array.isArray(params)) return "";
					const param = params[0] as { value: number; dataIndex: number };
					if (!param) return "";
					const candle = candles[param.dataIndex];
					if (!candle) return "";

					const timeStr = new Date(candle.timestamp).toLocaleString();
					return `<div style="margin-bottom: 4px; font-weight: bold;">${timeStr}</div>
						<div>Value: ${candle.close.toFixed(2)}</div>`;
				},
			},
			grid: {
				left: "10%",
				right: "8%",
				top: "10%",
				bottom: "15%",
				containLabel: false,
			},
			xAxis: {
				type: "category",
				data: times,
				boundaryGap: false,
				axisLine: { onZero: false },
				splitLine: { show: false },
				axisLabel: {
					color: colors.textColor,
					formatter: (value: string | number): string => {
						const date = new Date(value);
						return date.toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
						});
					},
				},
			},
			yAxis: {
				type: "value",
				scale: true,
				splitArea: {
					show: true,
					areaStyle: {
						color: [colors.gridColor, "transparent"],
					},
				},
				axisLabel: {
					color: colors.textColor,
					formatter: (value: number): string => value.toFixed(2),
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: colors.gridColor,
						type: "dashed",
					},
				},
			},
			dataZoom: [
				{
					type: "inside",
					start: Math.max(0, 100 - (500 / candles.length) * 100),
					end: 100,
				},
				{
					type: "slider",
					start: Math.max(0, 100 - (500 / candles.length) * 100),
					end: 100,
					height: 20,
					bottom: 10,
					handleStyle: {
						color: colors.borderColor,
					},
					dataBackground: {
						areaStyle: {
							color: colors.gridColor,
						},
					},
					selectedDataBackground: {
						areaStyle: {
							color: lineColor,
							opacity: 0.3,
						},
					},
					borderColor: colors.borderColor,
					textStyle: {
						color: colors.textColor,
					},
				},
			],
			series: [
				{
					type: "line",
					name: "Value",
					data: values,
					smooth: false,
					symbol: "none",
					lineStyle: {
						color: lineColor,
						width: 2,
					},
					areaStyle: {
						color: {
							type: "linear",
							x: 0,
							y: 0,
							x2: 0,
							y2: 1,
							colorStops: [
								{
									offset: 0,
									color: isUp
										? "rgba(16, 185, 129, 0.3)"
										: "rgba(239, 68, 68, 0.3)",
								},
								{
									offset: 1,
									color: isUp
										? "rgba(16, 185, 129, 0)"
										: "rgba(239, 68, 68, 0)",
								},
							],
						},
					},
				},
			],
		};
	}, [candleData, colors]);

	if (!chartOption) {
		return (
			<div
				className={cn(
					"flex items-center justify-center h-64 bg-muted/20 rounded border border-border",
					className,
				)}
			>
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No chart data available
					</div>
					<div className="text-xs text-muted-foreground/70 mt-1">
						{timeframe} timeframe
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("relative", className)}>
			<ReactECharts
				option={chartOption}
				style={{ width: "100%", height: "200px", minHeight: "200px" }}
				opts={{ renderer: "canvas", devicePixelRatio: window.devicePixelRatio || 2 }}
				notMerge={false}
				lazyUpdate={false}
			/>
			{/* Chart info */}
			<div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground">
				<span className="font-mono">{timeframe}</span>
				<span>•</span>
				<span>{candleData?.candles.length || 0} candles</span>
			</div>
		</div>
	);
}
