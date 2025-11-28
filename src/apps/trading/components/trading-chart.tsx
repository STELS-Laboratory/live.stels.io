/**
 * Trading Chart Component
 * Professional trading chart with order markers, real-time data visualization,
 * interactive features (hover, crosshair, tooltips), and optimized rendering
 * Built with Apache ECharts
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { BarChart, CandlestickChart, LineChart } from "echarts/charts";
import {
	DataZoomComponent,
	GridComponent,
	LegendComponent,
	MarkLineComponent,
	MarkPointComponent,
	TitleComponent,
	ToolboxComponent,
	TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTradingStore } from "../store";
import { useChartColors } from "@/hooks/use_chart_colors";
import {
	type Timeframe,
	useCandlesFromSession,
} from "../hooks/use-candles-from-session";
import { cn } from "@/lib/utils";
import type { TradingOrder } from "../types";
import { formatPercentage, formatPrice } from "../lib/formatting";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";

// Register ECharts components
echarts.use([
	CandlestickChart,
	LineChart,
	BarChart,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	LegendComponent,
	MarkLineComponent,
	MarkPointComponent,
	TitleComponent,
	ToolboxComponent,
	CanvasRenderer,
]);

interface TradingChartProps {
	className?: string;
}

interface CandleData {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume?: number;
}

/**
 * ECharts series type
 */
type EChartsSeries = Record<string, unknown>;

/**
 * ECharts grid configuration type
 */
type EChartsGrid = Record<string, unknown>;

/**
 * ECharts axis configuration type
 */
type EChartsAxis = Record<string, unknown>;

const MIN_CHART_HEIGHT = 240;
const MAX_CANDLES = 200;

/**
 * Validate candle data
 */
function validateCandle(candle: CandleData): boolean {
	return (
		candle.open > 0 &&
		candle.high > 0 &&
		candle.low > 0 &&
		candle.close > 0 &&
		candle.high >= candle.low &&
		candle.high >= candle.open &&
		candle.high >= candle.close &&
		candle.low <= candle.open &&
		candle.low <= candle.close
	);
}

/**
 * Limit candles for performance
 */
function limitCandles(
	candles: CandleData[],
	maxCandles: number = MAX_CANDLES,
): CandleData[] {
	if (candles.length <= maxCandles) return candles;

	// Return most recent candles
	return candles.slice(-maxCandles);
}

/**
 * Calculate Simple Moving Average (SMA)
 */
function calculateMA(
	data: number[][],
	period: number,
): number[] {
	const result: number[] = [];
	for (let i = 0; i < data.length; i++) {
		if (i < period - 1) {
			result.push(NaN);
			continue;
		}
		let sum = 0;
		for (let j = 0; j < period; j++) {
			sum += data[i - j][1]; // close price
		}
		result.push(sum / period);
	}
	return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
function calculateEMA(
	closePrices: number[],
	period: number,
): number[] {
	const result: number[] = [];
	const multiplier = 2 / (period + 1);

	// First value is SMA
	let sum = 0;
	for (let i = 0; i < period && i < closePrices.length; i++) {
		sum += closePrices[i];
		if (i < period - 1) {
			result.push(NaN);
		}
	}
	if (closePrices.length >= period) {
		result.push(sum / period);
	}

	// Subsequent values use EMA formula
	for (let i = period; i < closePrices.length; i++) {
		const ema = (closePrices[i] - result[result.length - 1]) * multiplier +
			result[result.length - 1];
		result.push(ema);
	}

	return result;
}

/**
 * Trading Chart Component
 * Professional trading chart with order markers, real-time updates, and optimized rendering
 * Built with Apache ECharts for high performance
 */
export const TradingChart = React.memo(function TradingChart({
	className,
}: TradingChartProps): React.ReactElement {
	const { ticker, orders, selectedSymbol, selectedAccount, selectedExchange } =
		useTradingStore();

	// Use selectedAccount exchange if available, otherwise use selectedExchange (view-only mode)
	const currentExchange = selectedAccount?.exchange || selectedExchange ||
		"bybit";
	const colors = useChartColors();
	const chartRef = useRef<ReactECharts>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [timeframe, setTimeframe] = useState<Timeframe>("15m");
	const [dimensions, setDimensions] = useState<[number, number]>([1200, 600]);
	const [error, setError] = useState<string | null>(null);
	const [chartType, setChartType] = useState<"candlestick" | "line">(
		"candlestick",
	);
	const [showVolume] = useState(true);
	const [showMA] = useState(false);
	const [showEMA] = useState(false);
	const [maPeriod] = useState(20);
	const [emaPeriod] = useState(20);

	// Create a unique key for current symbol/exchange/timeframe combination
	// This ensures data is cleared immediately when symbol or exchange changes
	const dataKey = `${selectedSymbol || ""}-${currentExchange}-${timeframe}`;
	const dataKeyRef = useRef<string>("");
	const isFirstRenderRef = useRef<boolean>(true);

	// Store zoom state to preserve user's zoom level when data updates
	const zoomStateRef = useRef<{ start: number; end: number } | null>(null);
	const shouldPreserveZoomRef = useRef<boolean>(false);
	const isInitialRenderRef = useRef<boolean>(true);

	// Stabilize price line during initial render to prevent flickering
	const stablePriceRef = useRef<number | null>(null);
	const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Get candles from session
	const sessionCandles = useCandlesFromSession(
		selectedSymbol,
		currentExchange,
		timeframe,
	);

	// Clear error and reset zoom when symbol or exchange changes
	useEffect(() => {
		setError(null);
		// Reset zoom state when symbol/exchange/timeframe changes
		if (dataKeyRef.current !== dataKey) {
			zoomStateRef.current = null;
			shouldPreserveZoomRef.current = false;
			isInitialRenderRef.current = true; // Reset initial render flag on symbol change
			stablePriceRef.current = null; // Reset stable price on symbol change
			if (priceUpdateTimeoutRef.current) {
				clearTimeout(priceUpdateTimeoutRef.current);
				priceUpdateTimeoutRef.current = null;
			}
			dataKeyRef.current = dataKey;
		}
	}, [dataKey]);

	// Convert session candles to chart format with validation
	// Only use real data from session - no fallback
	// Clear data immediately if symbol or exchange changed (dataKey changed)
	const candleData = useMemo((): CandleData[] | null => {
		try {
			// Handle first render: initialize key reference
			if (isFirstRenderRef.current) {
				isFirstRenderRef.current = false;
				dataKeyRef.current = dataKey;
				// Continue processing data on first render
			} else {
				// If data key changed, clear data immediately to prevent showing old chart
				// This ensures old chart is never shown when switching symbol/exchange
				const keyChanged = dataKeyRef.current !== dataKey;

				if (keyChanged) {
					// Update key reference immediately to prevent showing old data
					// This must happen synchronously before processing any data
					dataKeyRef.current = dataKey;
					// Return null immediately - new data will be processed on next render
					// This prevents showing old chart data when switching symbol/exchange
					return null;
				}
			}

			if (sessionCandles.length > 0) {
				const validated = sessionCandles
					.map((candle) => {
						// Parse values more carefully
						const open = Number(candle.open);
						const high = Number(candle.high);
						const low = Number(candle.low);
						const close = Number(candle.close);

						// Skip if any value is NaN or not a number
						if (
							isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) ||
							!Number.isFinite(open) || !Number.isFinite(high) ||
							!Number.isFinite(low) || !Number.isFinite(close)
						) {
							return null;
						}

						const candleData: CandleData = {
							time: candle.timestamp || Date.now(),
							open,
							high,
							low,
							close,
							volume: candle.volume ? Number(candle.volume) : undefined,
						};

						// Validate candle data
						if (!validateCandle(candleData)) {
							return null;
						}

						return candleData;
					})
					.filter((candle): candle is CandleData => candle !== null);

				// Limit candles for performance
				const limited = limitCandles(validated, MAX_CANDLES);

				if (limited.length === 0) {
					return null;
				}

				return limited;
			}

			// No fallback - return null if no real data
			return null;
		} catch {
			return null;
		}
	}, [sessionCandles, dataKey]);

	// Filter open orders for current symbol
	const openOrders = useMemo((): TradingOrder[] => {
		if (!selectedSymbol) return [];
		try {
			return orders.filter(
				(order) =>
					order.symbol === selectedSymbol &&
					(order.status === "open" || order.status === "partiallyFilled") &&
					order.price !== undefined &&
					order.price > 0,
			);
		} catch {
			return [];
		}
	}, [orders, selectedSymbol]);

	// Stabilize price during initial render
	useEffect(() => {
		if (ticker?.last && ticker.last > 0) {
			if (isInitialRenderRef.current) {
				// On initial render, set stable price immediately
				if (stablePriceRef.current === null) {
					stablePriceRef.current = ticker.last;
				}
			} else {
				// After initial render, update price with debounce to prevent rapid updates
				if (priceUpdateTimeoutRef.current) {
					clearTimeout(priceUpdateTimeoutRef.current);
				}
				priceUpdateTimeoutRef.current = setTimeout(() => {
					stablePriceRef.current = ticker.last;
					priceUpdateTimeoutRef.current = null;
				}, 150);
			}
		}
	}, [ticker?.last]);

	// Mark initial render as complete after chart is rendered
	useEffect(() => {
		if (isInitialRenderRef.current && candleData && candleData.length > 0) {
			// Use requestAnimationFrame to mark initial render complete after chart is rendered
			const frameId = requestAnimationFrame(() => {
				setTimeout(() => {
					isInitialRenderRef.current = false;
				}, 100);
			});
			return () => cancelAnimationFrame(frameId);
		}
	}, [candleData]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (priceUpdateTimeoutRef.current) {
				clearTimeout(priceUpdateTimeoutRef.current);
			}
		};
	}, []);

	// Handle resize
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const updateDimensions = (): void => {
			const rect = container.getBoundingClientRect();
			setDimensions([
				Math.max(800, rect.width),
				Math.max(MIN_CHART_HEIGHT, rect.height),
			]);
		};

		updateDimensions();

		const resizeObserver = new ResizeObserver(() => {
			updateDimensions();
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	// Prepare ECharts option
	const chartOption = useMemo(() => {
		if (!candleData || candleData.length === 0) {
			return null;
		}

		// Prepare data arrays for ECharts
		const times: string[] = [];
		const ohlcData: number[][] = [];
		const volumes: number[] = [];
		const closePrices: number[] = [];

		candleData.forEach((candle) => {
			times.push(new Date(candle.time).toISOString());
			ohlcData.push([candle.open, candle.close, candle.low, candle.high]);
			volumes.push(candle.volume || 0);
			closePrices.push(candle.close);
		});

		// Calculate MA if enabled
		const maData = showMA && closePrices.length >= maPeriod
			? calculateMA(ohlcData.map((_, i) => [i, closePrices[i]]), maPeriod)
			: null;

		// Calculate EMA if enabled
		const emaData = showEMA && closePrices.length >= emaPeriod
			? calculateEMA(closePrices, emaPeriod)
			: null;

		// Prepare order markers as horizontal lines (more professional)
		const orderLines = openOrders
			.filter((order) => order.side !== undefined && order.price !== undefined)
			.map((order) => ({
				name: `${(order.side || "buy").toUpperCase()} ${
					formatPrice(order.price || 0)
				}`,
				yAxis: order.price || 0,
				lineStyle: {
					color: order.side === "buy" ? colors.upColor : colors.downColor,
					type: "dashed",
					width: 1.5,
					opacity: 0.7,
				},
				label: {
					show: true,
					position: "end",
					formatter: `${(order.side || "buy").toUpperCase()} ${
						formatPrice(order.price || 0)
					}`,
					fontSize: 10,
					color: order.side === "buy" ? colors.upColor : colors.downColor,
					backgroundColor: colors.background,
					borderColor: order.side === "buy" ? colors.upColor : colors.downColor,
					borderWidth: 1,
					padding: [2, 4],
				},
			}));

		// Prepare order markers as points (for visual reference)
		const orderMarkers = openOrders
			.filter((order) => order.side !== undefined)
			.map((order) => ({
				name: `${(order.side || "buy").toUpperCase()}`,
				coord: [
					times[times.length - 1], // Place at last candle
					order.price || 0,
				],
				value: formatPrice(order.price || 0),
				itemStyle: {
					color: order.side === "buy" ? colors.upColor : colors.downColor,
					borderColor: colors.background,
					borderWidth: 2,
				},
				symbol: order.side === "buy" ? "triangle" : "triangle",
				symbolRotate: order.side === "buy" ? 0 : 180,
				symbolSize: 14,
			}));

		// Prepare current price line (real-time price indicator)
		// Use stable price to prevent flickering during initial render
		const currentPrice = stablePriceRef.current ||
			(ticker?.last && ticker.last > 0 ? ticker.last : null);

		const currentPriceLine = currentPrice && currentPrice > 0
			? [
				{
					name: "Current Price",
					yAxis: currentPrice,
					lineStyle: {
						color: ticker?.change !== undefined && ticker.change >= 0
							? colors.upColor
							: colors.downColor,
						type: "dashed",
						width: 1,
						opacity: 0.5,
					},
					label: {
						show: true,
						position: "end",
						formatter: formatPrice(currentPrice),
						fontSize: 10,
						fontWeight: "bold",
						color: ticker?.change !== undefined && ticker.change >= 0
							? colors.upColor
							: colors.downColor,
						backgroundColor: colors.background,
						borderColor: ticker?.change !== undefined && ticker.change >= 0
							? colors.upColor
							: colors.downColor,
						borderWidth: 1,
						padding: [4, 6],
						borderRadius: 2,
					},
				},
			]
			: [];

		const series: EChartsSeries[] = [];

		// Main chart series (candlestick or line)
		if (chartType === "candlestick") {
			series.push({
				type: "candlestick",
				name: selectedSymbol || "Price",
				data: ohlcData,
				itemStyle: {
					color: colors.upColor,
					color0: colors.downColor,
					borderColor: colors.upColor,
					borderColor0: colors.downColor,
					borderWidth: 1,
				},
				emphasis: {
					itemStyle: {
						borderWidth: 1,
					},
				},
				markLine: (orderLines.length > 0 || currentPriceLine.length > 0)
					? {
						data: [...currentPriceLine, ...orderLines],
						symbol: "none",
						animation: true,
						animationDuration: 200,
					}
					: undefined,
				markPoint: orderMarkers.length > 0
					? {
						data: orderMarkers,
						label: {
							show: true,
							position: "top",
							fontSize: 9,
							color: colors.textColor,
							backgroundColor: colors.background,
							borderColor: colors.borderColor,
							borderWidth: 1,
							padding: [2, 4],
						},
					}
					: undefined,
			});
		} else {
			series.push({
				type: "line",
				name: selectedSymbol || "Price",
				data: closePrices,
				smooth: false,
				symbol: "none",
				lineStyle: {
					color: colors.upColor,
					width: 2,
				},
				emphasis: {
					lineStyle: {
						width: 3,
					},
				},
				markLine: (orderLines.length > 0 || currentPriceLine.length > 0)
					? {
						data: [...currentPriceLine, ...orderLines],
						symbol: "none",
						animation: true,
						animationDuration: 200,
					}
					: undefined,
				markPoint: orderMarkers.length > 0
					? {
						data: orderMarkers,
						label: {
							show: true,
							position: "top",
							fontSize: 9,
							color: colors.textColor,
							backgroundColor: colors.background,
							borderColor: colors.borderColor,
							borderWidth: 1,
							padding: [2, 4],
						},
					}
					: undefined,
			});
		}

		// Simple Moving Average
		if (maData && showMA) {
			series.push({
				type: "line",
				name: `SMA${maPeriod}`,
				data: maData,
				smooth: false, // Disabled for better performance
				symbol: "none",
				lineStyle: {
					color: "#f59e0b", // amber-500
					width: 1.5,
					type: "dashed",
					opacity: 0.8,
				},
				emphasis: {
					lineStyle: {
						width: 2,
					},
				},
			});
		}

		// Exponential Moving Average
		if (emaData && showEMA) {
			series.push({
				type: "line",
				name: `EMA${emaPeriod}`,
				data: emaData,
				smooth: false, // Disabled for better performance
				symbol: "none",
				lineStyle: {
					color: "#8b5cf6", // violet-500
					width: 1.5,
					type: "solid",
					opacity: 0.8,
				},
				emphasis: {
					lineStyle: {
						width: 2,
					},
				},
			});
		}

		// Volume bars
		if (showVolume) {
			series.push({
				type: "bar",
				name: "Volume",
				data: volumes,
				xAxisIndex: 1,
				yAxisIndex: 1,
				itemStyle: {
					color: (params: { dataIndex: number }) => {
						const index = params.dataIndex;
						if (index === 0) return colors.volumeColor;
						const isUp = closePrices[index] >= closePrices[index - 1];
						return isUp ? colors.upColor : colors.downColor;
					},
					opacity: 0.5,
					borderRadius: [2, 2, 0, 0], // Rounded top corners for volume bars
				},
				emphasis: {
					itemStyle: {
						opacity: 0.8,
					},
				},
			});
		}

		// Disable animation on initial render to prevent flickering
		const shouldAnimate = !isInitialRenderRef.current;

		return {
			backgroundColor: "transparent",
			animation: shouldAnimate,
			animationDuration: shouldAnimate ? 200 : 0,
			animationEasing: "cubicOut",
			animationThreshold: 2000, // Only animate if data points < 2000
			legend: {
				show: showMA || showEMA,
				bottom: showVolume ? 30 : 5,
				left: "center",
				data: [
					selectedSymbol || "Price",
					...(showMA ? [`SMA${maPeriod}`] : []),
					...(showEMA ? [`EMA${emaPeriod}`] : []),
					...(showVolume ? ["Volume"] : []),
				],
				textStyle: {
					color: colors.textColor,
					fontSize: 10,
				},
			},
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
				borderWidth: 1,
				padding: 10,
				textStyle: {
					color: colors.textColor,
				},
				formatter: (params: unknown): string => {
					if (!Array.isArray(params)) return "";
					const typedParams = params as Array<{
						dataIndex: number;
						seriesName?: string;
						value?: number;
					}>;
					const param = typedParams[0];
					if (!param) return "";
					const dataIndex = param.dataIndex;
					const candle = candleData[dataIndex];
					if (!candle) return "";

					const timeStr = new Date(candle.time).toLocaleString();
					let html =
						`<div style="margin-bottom: 4px; font-weight: bold;">${timeStr}</div>`;

					// Calculate price change
					const priceChange = dataIndex > 0
						? candle.close - candleData[dataIndex - 1].close
						: 0;
					const priceChangePercent =
						dataIndex > 0 && candleData[dataIndex - 1].close > 0
							? (priceChange / candleData[dataIndex - 1].close) * 100
							: 0;

					typedParams.forEach((p) => {
						if (p.seriesName === "Volume") {
							html +=
								`<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid ${colors.borderColor};">Volume: ${
									candle.volume?.toLocaleString(undefined, {
										maximumFractionDigits: 0,
									}) || "—"
								}</div>`;
						} else if (
							p.seriesName?.startsWith("SMA") || p.seriesName?.startsWith("EMA")
						) {
							const maValue = p.value;
							if (maValue !== undefined && !isNaN(maValue)) {
								html += `<div style="color: ${
									p.seriesName?.startsWith("SMA") ? "#f59e0b" : "#8b5cf6"
								};">${p.seriesName}: ${formatPrice(maValue)}</div>`;
							}
						} else {
							if (chartType === "candlestick") {
								html += `<div style="margin-top: 4px;">`;
								html += `<div>O: <span style="font-weight: 600;">${
									formatPrice(candle.open)
								}</span></div>`;
								html += `<div>H: <span style="font-weight: 600;">${
									formatPrice(candle.high)
								}</span></div>`;
								html += `<div>L: <span style="font-weight: 600;">${
									formatPrice(candle.low)
								}</span></div>`;
								html += `<div>C: <span style="font-weight: 600;">${
									formatPrice(candle.close)
								}</span></div>`;
								if (dataIndex > 0) {
									const changeColor = priceChange >= 0
										? colors.upColor
										: colors.downColor;
									html +=
										`<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid ${colors.borderColor}; color: ${changeColor};">`;
									html += `Change: ${priceChange >= 0 ? "+" : ""}${
										formatPrice(priceChange)
									} (${priceChangePercent >= 0 ? "+" : ""}${
										priceChangePercent.toFixed(2)
									}%)`;
									html += `</div>`;
								}
								html += `</div>`;
							} else {
								html += `<div>Price: <span style="font-weight: 600;">${
									formatPrice(candle.close)
								}</span></div>`;
								if (dataIndex > 0) {
									const changeColor = priceChange >= 0
										? colors.upColor
										: colors.downColor;
									html +=
										`<div style="margin-top: 4px; color: ${changeColor};">`;
									html += `Change: ${priceChange >= 0 ? "+" : ""}${
										formatPrice(priceChange)
									} (${priceChangePercent >= 0 ? "+" : ""}${
										priceChangePercent.toFixed(2)
									}%)`;
									html += `</div>`;
								}
							}
						}
					});

					return html;
				},
			},
			axisPointer: {
				link: [
					{
						xAxisIndex: "all",
					},
				],
				label: {
					backgroundColor: colors.background,
					color: colors.textColor,
				},
			},
			grid: [
				{
					left: "8%",
					right: "8%",
					top: "4%",
					bottom: showVolume ? "4%" : "4%",
					containLabel: false,
				},
				showVolume
					? {
						left: "8%",
						right: "8%",
						top: "85%",
						bottom: "4%",
						containLabel: false,
					}
					: undefined,
			].filter((item): boolean => item !== undefined) as EChartsGrid[],
			xAxis: [
				{
					type: "category",
					data: times,
					scale: true,
					boundaryGap: false,
					axisLine: {
						onZero: false,
						show: true,
						lineStyle: {
							color: colors.borderColor,
							width: 1,
						},
					},
					splitLine: { show: false },
					min: "dataMin",
					max: "dataMax",
					axisPointer: {
						z: 10, // Higher z-index for proper display
					},
					axisLabel: {
						color: colors.textColor,
						fontSize: 10,
						margin: 16,
						formatter: (value: string) => {
							const date = new Date(value);
							return date.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							});
						},
					},
				},
				showVolume
					? {
						type: "category",
						data: times,
						gridIndex: 1,
						scale: true,
						boundaryGap: false,
						axisLine: { onZero: false },
						axisTick: { show: false },
						splitLine: { show: false },
						axisLabel: { show: false },
						min: "dataMin",
						max: "dataMax",
					}
					: undefined,
			].filter((item): boolean => item !== undefined) as EChartsAxis[],
			yAxis: [
				{
					scale: true,
					splitArea: {
						show: false, // Removed striped background for cleaner look
					},
					axisLabel: {
						color: colors.textColor,
						formatter: (value: number) => formatPrice(value),
						fontSize: 10,
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: colors.gridColor,
							type: "dashed",
							width: 1,
							opacity: 0.5,
						},
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: colors.borderColor,
							width: 1,
						},
					},
				},
				showVolume
					? {
						gridIndex: 1,
						splitNumber: 2,
						axisLabel: { show: false },
						axisLine: { show: false },
						axisTick: { show: false },
						splitLine: { show: false },
					}
					: undefined,
			].filter((item): boolean => item !== undefined) as EChartsAxis[],
			dataZoom: (() => {
				// Calculate default zoom (show last 500 candles or all if less)
				const defaultStart = Math.max(0, 100 - (500 / candleData.length) * 100);
				const defaultEnd = 100;

				// Check if symbol/exchange/timeframe changed (dataKey changed)
				const keyChanged = dataKeyRef.current !== dataKey;

				// Use preserved zoom state only if:
				// 1. Zoom state exists
				// 2. User has manually changed zoom (shouldPreserveZoomRef is true)
				// 3. Symbol/exchange/timeframe hasn't changed
				const shouldUsePreservedZoom = zoomStateRef.current !== null &&
					shouldPreserveZoomRef.current && !keyChanged;

				const zoomStart = shouldUsePreservedZoom
					? zoomStateRef.current!.start
					: defaultStart;
				const zoomEnd = shouldUsePreservedZoom
					? zoomStateRef.current!.end
					: defaultEnd;

				// Initialize zoom state if not set or if key changed
				if (!zoomStateRef.current || keyChanged) {
					zoomStateRef.current = { start: zoomStart, end: zoomEnd };
					shouldPreserveZoomRef.current = false;
				} else if (shouldUsePreservedZoom) {
					// Update zoom state to current values when preserving
					zoomStateRef.current = { start: zoomStart, end: zoomEnd };
				}

				return [
					{
						type: "inside",
						xAxisIndex: [0, showVolume ? 1 : undefined].filter(
							(v): v is number => v !== undefined,
						),
						start: zoomStart,
						end: zoomEnd,
					},
				];
			})(),
			series,
		};
	}, [
		candleData,
		chartType,
		showVolume,
		showMA,
		showEMA,
		maPeriod,
		emaPeriod,
		openOrders,
		selectedSymbol,
		ticker,
		colors,
		dataKey,
	]);

	// Error or loading state
	const hasCandleData = candleData && candleData.length > 0;
	const hasSessionCandles = sessionCandles && sessionCandles.length > 0;
	const chartsUnavailable = selectedSymbol && !hasCandleData &&
		!hasSessionCandles;

	if (
		error || !chartOption || !ticker || !hasCandleData
	) {
		return (
			<div
				ref={containerRef}
				className={cn(
					"relative w-full flex-1 min-h-0 bg-background flex flex-col",
					className,
				)}
				role="region"
				aria-label={`Trading chart for ${selectedSymbol || "selected symbol"}`}
			>
				{/* Professional Chart Header */}
				<div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
					<div className="flex items-center gap-4">
						<div>
							<div className="text-sm font-bold text-foreground uppercase tracking-wider">
								{selectedSymbol || "No symbol"}
							</div>
							<div className="flex items-center gap-2 mt-0.5">
								<span
									className={cn(
										"text-xs font-bold font-mono",
										ticker?.change !== undefined && ticker.change >= 0
											? "text-green-600 dark:text-green-400"
											: ticker?.change !== undefined
											? "text-red-600 dark:text-red-400"
											: "text-muted-foreground",
									)}
								>
									{ticker?.last ? formatPrice(ticker.last) : "—"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Chart Unavailable Message */}
				<div className="flex items-center justify-center flex-1 min-h-0 bg-muted/20">
					<div className="text-center max-w-md px-4 space-y-2">
						{error
							? (
								<>
									<div className="text-sm text-destructive font-medium">
										{error}
									</div>
								</>
							)
							: chartsUnavailable
							? (
								<>
									<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-2">
										<TrendingUp className="icon-lg text-amber-500" />
									</div>
									<div className="text-sm font-semibold text-foreground">
										Charts Unavailable
									</div>
									<div className="text-xs text-muted-foreground">
										Chart data is not available for {selectedSymbol} on{" "}
										{currentExchange}. Please try another trading pair or
										exchange.
									</div>
								</>
							)
							: (
								<>
									<div className="text-sm text-muted-foreground">
										No chart data available
									</div>
									{!selectedSymbol && (
										<div className="text-xs text-muted-foreground/70 mt-1">
											Select a trading pair
										</div>
									)}
								</>
							)}
					</div>
				</div>
			</div>
		);
	}

	const [width, height] = dimensions;

	// Check if dimensions are valid
	if (width <= 0 || height < MIN_CHART_HEIGHT) {
		return (
			<div
				ref={containerRef}
				className={cn(
					"flex items-center justify-center flex-1 min-h-0 bg-muted/20 flex-col",
					className,
				)}
				role="status"
				aria-live="polite"
			>
				<div className="text-sm text-muted-foreground">
					{width <= 0 || height <= 0
						? "Calculating chart dimensions..."
						: "Chart area too small. Resizing..."}
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative flex-1 bg-background flex flex-col",
				className,
			)}
			role="region"
			aria-label={`Trading chart for ${selectedSymbol || "selected symbol"}`}
		>
			{/* Professional Chart Header */}
			<div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
				<div className="flex items-center gap-4">
					<div>
						<div className="text-sm font-bold text-foreground uppercase tracking-wider">
							{selectedSymbol || "No symbol"}
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<span
								className={cn(
									"text-xs font-bold font-mono",
									ticker.change !== undefined && ticker.change >= 0
										? "text-green-600 dark:text-green-400"
										: ticker.change !== undefined
										? "text-red-600 dark:text-red-400"
										: "text-muted-foreground",
								)}
								aria-label={`Current price: ${
									ticker.last ? formatPrice(ticker.last) : "N/A"
								}`}
							>
								{ticker.last ? formatPrice(ticker.last) : "—"}
							</span>
							{ticker.change !== undefined && (
								<span
									className={cn(
										"text-[10px] font-semibold px-1.5 py-0.5 rounded",
										ticker.change >= 0
											? "text-green-600 dark:text-green-400 bg-green-500/10"
											: "text-red-600 dark:text-red-400 bg-red-500/10",
									)}
									aria-label={`Price change: ${
										formatPercentage(ticker.percentage)
									}`}
								>
									{formatPercentage(ticker.percentage)}%
								</span>
							)}
						</div>
					</div>
				</div>
				{/* Chart Controls */}
				<div className="flex items-center gap-2">
					{/* Chart Type Selector */}
					<Select
						value={chartType}
						onValueChange={(value) => {
							setChartType(value as "candlestick" | "line");
						}}
						aria-label="Select chart type"
					>
						<SelectTrigger className="h-8 w-[110px] text-xs font-semibold bg-background border-border/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="candlestick">Candlestick</SelectItem>
							<SelectItem value="line">Line</SelectItem>
						</SelectContent>
					</Select>

					{/* Timeframe Selector */}
					<Select
						value={timeframe}
						onValueChange={(value) => {
							setTimeframe(value as Timeframe);
						}}
						aria-label="Select timeframe"
					>
						<SelectTrigger className="h-8 w-[80px] text-xs font-semibold bg-background border-border/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1m">1m</SelectItem>
							<SelectItem value="5m">5m</SelectItem>
							<SelectItem value="15m">15m</SelectItem>
							<SelectItem value="30m">30m</SelectItem>
							<SelectItem value="1h">1h</SelectItem>
							<SelectItem value="4h">4h</SelectItem>
							<SelectItem value="1d">1d</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Chart Area */}
			<div className="flex-1 relative mb-4">
				<ReactECharts
					ref={chartRef}
					option={chartOption}
					style={{
						width: "100%",
						height: "100%",
					}}
					opts={{
						renderer: "canvas",
						devicePixelRatio: window.devicePixelRatio || 2,
					}}
					notMerge={isInitialRenderRef.current}
					lazyUpdate={true}
					onEvents={{
						datazoom: (params: unknown) => {
							// Save zoom state when user changes zoom
							const zoomParams = params as {
								start?: number;
								end?: number;
							};
							if (
								zoomParams.start !== undefined &&
								zoomParams.end !== undefined
							) {
								zoomStateRef.current = {
									start: zoomParams.start,
									end: zoomParams.end,
								};
								shouldPreserveZoomRef.current = true;
							}
						},
					}}
				/>
			</div>
		</div>
	);
});
