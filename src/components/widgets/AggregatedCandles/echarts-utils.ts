/**
 * Utility functions for ECharts data conversion
 */

import type { ExchangeData } from "./types";

/**
 * Convert candlestick data to ECharts format
 * ECharts candlestick format: [timestamp, open, close, low, high]
 */
export const convertCandlesToECharts = (
	candles: Array<{
		time: number;
		open: number;
		high: number;
		low: number;
		close: number;
	}>,
): Array<[number, number, number, number, number]> => {
	return candles.map((candle) => [
		candle.time * 1000, // Convert to milliseconds
		candle.open,
		candle.close,
		candle.low,
		candle.high,
	]);
};

/**
 * Convert volume data to ECharts format
 * Returns separate arrays for times, values, and colors
 */
export const convertVolumeToECharts = (
	volumeData: Array<{ time: number; value: number; color: string }>,
): {
	times: number[];
	values: number[];
	colors: string[];
} => {
	const times: number[] = [];
	const values: number[] = [];
	const colors: string[] = [];

	volumeData.forEach((item) => {
		times.push(item.time * 1000);
		values.push(item.value);
		colors.push(item.color || "#888");
	});

	return { times, values, colors };
};

/**
 * Convert line data to ECharts format
 */
export const convertLineToECharts = (
	lineData: Array<{ time: number; value: number }>,
): Array<[number, number]> => {
	return lineData.map((point) => [
		point.time * 1000,
		point.value,
	]);
};

/**
 * Create ECharts series configuration for exchange lines
 */
export const createExchangeLineSeries = (
	exchangeData: ExchangeData[],
	exchangeLineData: { [exchange: string]: Array<{ time: number; value: number }> },
	maxDominance: number,
) => {
	return exchangeData.map(({ exchange, color, dominance, marketShare }) => {
		const data = exchangeLineData[exchange];
		if (!data || data.length === 0) return null;

		const dominanceRatio = (dominance || 0) / maxDominance;
		const lineWidth = Math.max(1, Math.min(5, 1 + dominanceRatio * 4));

		// Calculate opacity based on market share
		const opacity = Math.max(
			0.6,
			Math.min(1, 0.6 + (marketShare || 0) / 100 * 0.4),
		);

		return {
			name: exchange,
			type: "line",
			data: convertLineToECharts(data),
			smooth: false,
			symbol: "none",
			lineStyle: {
				width: Math.round(lineWidth),
				color: color,
				opacity: opacity,
			},
			emphasis: {
				focus: "series",
				lineStyle: {
					width: Math.round(lineWidth) + 1,
				},
			},
		};
	}).filter(Boolean);
};

/**
 * Get ECharts tooltip formatter for candlestick data
 */
export const getCandlestickTooltipFormatter = (params: any): string => {
	if (!Array.isArray(params) || params.length === 0) return "";

	const lines: string[] = [];

	params.forEach((param: any) => {
		if (param.componentSubType === "candlestick" && param.data) {
			const [time, open, close, low, high] = param.data;
			const date = new Date(time).toLocaleString();
			const change = close - open;
			const changePercent = ((change / open) * 100).toFixed(2);
			const color = change >= 0 ? "#16a34a" : "#dc2626";

			lines.push(`<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`);
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px;">`,
			);
			lines.push(`<span>Open:</span><span style="font-family: monospace;">${open.toFixed(2)}</span>`);
			lines.push(`</div>`);
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px;">`,
			);
			lines.push(`<span>High:</span><span style="font-family: monospace; color: #16a34a;">${high.toFixed(2)}</span>`);
			lines.push(`</div>`);
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px;">`,
			);
			lines.push(`<span>Low:</span><span style="font-family: monospace; color: #dc2626;">${low.toFixed(2)}</span>`);
			lines.push(`</div>`);
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px;">`,
			);
			lines.push(`<span>Close:</span><span style="font-family: monospace; color: ${color};">${close.toFixed(2)}</span>`);
			lines.push(`</div>`);
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">`,
			);
			lines.push(`<span>Change:</span><span style="font-family: monospace; color: ${color};">${change >= 0 ? "+" : ""}${change.toFixed(2)} (${changePercent}%)</span>`);
			lines.push(`</div>`);
		} else if (param.componentSubType === "bar" && param.data) {
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 8px;">`,
			);
			lines.push(`<span>Volume:</span><span style="font-family: monospace;">${param.data.toFixed(2)}</span>`);
			lines.push(`</div>`);
		} else if (param.componentSubType === "line" && param.seriesName) {
			lines.push(
				`<div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 4px;">`,
			);
			lines.push(`<span style="color: ${param.color};">●</span>`);
			lines.push(`<span>${param.seriesName}:</span>`);
			lines.push(`<span style="font-family: monospace;">${param.data[1].toFixed(2)}</span>`);
			lines.push(`</div>`);
		}
	});

	return lines.join("");
};

