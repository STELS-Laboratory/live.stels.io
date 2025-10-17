/**
 * Utility functions for AggregatedCandles widget
 */

import {
	DEFAULT_EXCHANGE_COLOR,
	LIQUIDITY_COLOR_PALETTE,
} from "./constants";

/**
 * Generate colors based on liquidity ranking
 * Professional trading colors with clear visual distinction
 */
export const generateLiquidityColors = (
	exchanges: Array<{ exchange: string; liquidity: number }>,
): { [exchange: string]: string } => {
	const sortedExchanges = [...exchanges].sort((a, b) =>
		b.liquidity - a.liquidity
	);
	const colors: { [exchange: string]: string } = {};

	sortedExchanges.forEach((ex, index) => {
		colors[ex.exchange] = LIQUIDITY_COLOR_PALETTE[index] ||
			DEFAULT_EXCHANGE_COLOR;
	});

	return colors;
};

/**
 * Calculate Gini coefficient for inequality measurement
 */
export const calculateGiniCoefficient = (values: number[]): number => {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const n = sorted.length;
	const sum = sorted.reduce((a, b) => a + b, 0);
	if (sum === 0) return 0;

	let gini = 0;
	for (let i = 0; i < n; i++) {
		gini += (i + 1) * sorted[i];
	}
	return (2 * gini) / (n * sum) - (n + 1) / n;
};

