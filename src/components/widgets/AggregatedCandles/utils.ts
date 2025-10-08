/**
 * Utility functions for AggregatedCandles widget
 */

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

	// Professional trading colors based on liquidity ranking
	const colorPalette = [
		"#f59e0b", // amber-500 - highest liquidity
		"#eab308", // amber-400
		"#fbbf24", // amber-300
		"#fcd34d", // amber-200
		"#fde68a", // amber-100
		"#84cc16", // lime-500
		"#22c55e", // green-500
		"#10b981", // emerald-500
		"#06b6d4", // cyan-500
		"#3b82f6", // blue-500
		"#6366f1", // indigo-500
		"#8b5cf6", // violet-500
		"#a855f7", // purple-500
		"#d946ef", // fuchsia-500
		"#ec4899", // pink-500
		"#f43f5e", // rose-500
		"#ef4444", // red-500
		"#f97316", // orange-500
		"#a3a3a3", // zinc-400 - lowest liquidity
		"#737373", // zinc-500
	];

	sortedExchanges.forEach((ex, index) => {
		colors[ex.exchange] = colorPalette[index] || "#6b7280";
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

