/**
 * Calculation functions for AggregatedCandles regulatory analysis
 */

import type { AggregatedCandlesProps } from "./types";

/**
 * Calculate comprehensive liquidity metrics for regulatory analysis
 */
export const calculateExchangeLiquidity = (
	orderBookData: AggregatedCandlesProps["orderBookData"],
	selectedMarket: string,
): Array<{
	exchange: string;
	liquidity: number;
	marketShare: number;
	dominance: number;
	depth: number;
	spread: number;
}> => {
	const marketData = orderBookData.filter((item) =>
		item.market === selectedMarket
	);

	const exchangeMetrics = marketData.map((item) => {
		const bidLiquidity = item.bids.reduce(
			(sum, [price, volume]) => sum + (price * volume),
			0,
		);
		const askLiquidity = item.asks.reduce(
			(sum, [price, volume]) => sum + (price * volume),
			0,
		);

		// Calculate order book depth (number of levels)
		const depth = item.bids.length + item.asks.length;

		// Calculate spread
		const bestBid = item.bids.length > 0 ? item.bids[0][0] : 0;
		const bestAsk = item.asks.length > 0 ? item.asks[0][0] : 0;
		const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

		return {
			exchange: item.exchange,
			liquidity: bidLiquidity + askLiquidity,
			depth,
			spread,
			marketShare: 0, // Will be calculated below
			dominance: 0, // Will be calculated below
		};
	});

	// Calculate total market liquidity
	const totalLiquidity = exchangeMetrics.reduce(
		(sum, ex) => sum + ex.liquidity,
		0,
	);

	// Calculate market share and dominance
	return exchangeMetrics.map((ex) => {
		const marketShare = totalLiquidity > 0
			? (ex.liquidity / totalLiquidity) * 100
			: 0;

		// Dominance calculation: based on market share and liquidity depth
		const depthFactor = Math.min(ex.depth / 20, 1);
		const dominance = marketShare * (1 + depthFactor * 0.1);

		return {
			...ex,
			marketShare,
			dominance,
		};
	}).sort((a, b) => b.dominance - a.dominance);
};

