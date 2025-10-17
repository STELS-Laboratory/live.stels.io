/**
 * Calculation functions for AggregatedCandles regulatory analysis
 */

import type {
	AggregatedCandlesProps,
	CandleData,
	ExchangeData,
} from "./types";
import { calculateGiniCoefficient } from "./utils";
import type { AggregationConfig } from "./aggregation-types";
import {
	convertToChartFormat,
	createProfessionalAggregatedCandles,
	DEFAULT_AGGREGATION_CONFIG,
} from "./professional-aggregation";

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

/**
 * Create aggregated candles with custom configuration
 * Uses professional aggregation engine with VWAP/TWAP and outlier detection
 *
 * @param exchangeData - Exchange data with candles
 * @param config - Aggregation configuration
 * @returns Aggregated candlestick data in ECharts format
 *
 * @example
 * ```typescript
 * // VWAP aggregation (industry standard)
 * const candles = createAggregatedCandlesWithConfig(exchangeData, {
 *   method: AggregationMethod.VWAP,
 *   timeframe: AggregationTimeframe.MINUTE_1,
 *   useRealHighLow: true,
 *   outlierDetection: { enabled: true, method: 'iqr', threshold: 1.5 }
 * });
 * ```
 */
export const createAggregatedCandlesWithConfig = (
	exchangeData: ExchangeData[],
	config: Partial<AggregationConfig> = {},
): Array<{
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
}> => {
	const fullConfig: AggregationConfig = {
		...DEFAULT_AGGREGATION_CONFIG,
		...config,
	};

	const aggregated = createProfessionalAggregatedCandles(
		exchangeData,
		fullConfig,
	);

	// Convert to chart format
	return convertToChartFormat(aggregated);
};

/**
 * Create dominance-weighted volume data for regulatory analysis
 */
export const createVolumeData = (
	exchangeData: ExchangeData[],
): Array<{ time: number; value: number; color: string }> => {
	if (exchangeData.length === 0) return [];

	const timeGroups: {
		[timestamp: number]: { candle: CandleData; weight: number }[];
	} = {};

	exchangeData.forEach(({ candles, marketShare }) => {
		// Use market share as the primary weight for volume calculation
		const weight = (marketShare || 0) / 100;

		candles.forEach((candle) => {
			const timestamp = Math.floor(candle.timestamp / 60000) * 60000;
			if (!timeGroups[timestamp]) {
				timeGroups[timestamp] = [];
			}
			timeGroups[timestamp].push({ candle, weight });
		});
	});

	return Object.entries(timeGroups)
		.map(([timestamp, weightedCandles]) => {
			const totalWeight = weightedCandles.reduce(
				(sum, wc) => sum + wc.weight,
				0,
			);
			const weightedVolume = totalWeight > 0
				? weightedCandles.reduce(
					(sum, wc) => sum + wc.candle.volume * wc.weight,
					0,
				) / totalWeight
				: weightedCandles.reduce((sum, wc) => sum + wc.candle.volume, 0);

			const weightedClose = totalWeight > 0
				? weightedCandles.reduce(
					(sum, wc) => sum + wc.candle.close * wc.weight,
					0,
				) / totalWeight
				: weightedCandles.reduce((sum, wc) => sum + wc.candle.close, 0) /
					weightedCandles.length;

			const weightedOpen = totalWeight > 0
				? weightedCandles.reduce(
					(sum, wc) => sum + wc.candle.open * wc.weight,
					0,
				) / totalWeight
				: weightedCandles.reduce((sum, wc) => sum + wc.candle.open, 0) /
					weightedCandles.length;

			return {
				time: Math.floor(parseInt(timestamp) / 1000),
				value: weightedVolume,
				color: weightedClose >= weightedOpen
					? "rgba(22,163,74,0.35)"
					: "rgba(220,38,38,0.35)",
			};
		})
		.sort((a, b) => a.time - b.time);
};

/**
 * Create exchange line data for individual exchange price lines
 */
export const createExchangeLineData = (
	exchangeData: ExchangeData[],
): { [exchange: string]: Array<{ time: number; value: number }> } => {
	const result: { [exchange: string]: Array<{ time: number; value: number }> } = {};

	exchangeData.forEach(({ exchange, candles }) => {
		if (candles.length > 0) {
			result[exchange] = candles
				.map((candle) => ({
					time: Math.floor(candle.timestamp / 1000),
					value: candle.close,
				}))
				.sort((a, b) => a.time - b.time);
		}
	});

	return result;
};

/**
 * Calculate fair value price based on liquidity-weighted analysis
 */
export const calculateFairValue = (
	exchangeData: ExchangeData[],
	lastCandle: { close: number } | null,
	selectedMarket: string,
): number | null => {
	if (exchangeData.length === 0 || !lastCandle) return null;

	// Only calculate fair value for the selected market
	const marketExchangeData = exchangeData.filter((ex) =>
		ex.candles.length > 0 &&
		ex.candles.some((candle) => candle.market === selectedMarket)
	);

	if (marketExchangeData.length === 0) return lastCandle.close;

	// Calculate liquidity-weighted average price from exchanges for this market
	const totalLiquidity = marketExchangeData.reduce(
		(sum, ex) => sum + ex.liquidity,
		0,
	);
	if (totalLiquidity === 0) return lastCandle.close;

	// Weight by liquidity only (more reliable than dominance)
	const weightedPrice = marketExchangeData.reduce((sum, ex) => {
		const weight = ex.liquidity / totalLiquidity;
		const exchangePrice = ex.candles.length > 0
			? ex.candles[ex.candles.length - 1].close
			: lastCandle.close;
		return sum + (exchangePrice * weight);
	}, 0);

	return weightedPrice;
};

/**
 * Calculate market efficiency score (0-100)
 */
export const calculateMarketEfficiency = (
	exchangeData: ExchangeData[],
	fairValuePrice: number | null,
	selectedMarket: string,
): number => {
	if (exchangeData.length === 0) return 0;

	// Filter exchange data for the selected market only
	const marketExchangeData = exchangeData.filter((ex) =>
		ex.candles.length > 0 &&
		ex.candles.some((candle) => candle.market === selectedMarket)
	);

	if (marketExchangeData.length === 0) return 0;

	// Calculate total liquidity for weighting
	const totalLiquidity = marketExchangeData.reduce(
		(sum, ex) => sum + ex.liquidity,
		0,
	);

	// Calculate price convergence efficiency
	const priceVariance = marketExchangeData.reduce((sum, ex) => {
		if (ex.candles.length === 0) return sum;
		const exchangePrice = ex.candles[ex.candles.length - 1].close;
		const deviation = Math.abs(exchangePrice - (fairValuePrice || 0));
		return sum + deviation * (ex.liquidity / totalLiquidity); // Weight by relative liquidity
	}, 0);

	const avgPrice = fairValuePrice || 0;
	const priceEfficiency = avgPrice > 0
		? Math.max(0, 100 - (priceVariance / avgPrice) * 1000)
		: 0;

	// Liquidity distribution efficiency
	const liquidityGini = calculateGiniCoefficient(
		marketExchangeData.map((ex) => ex.liquidity),
	);
	const liquidityEfficiency = (1 - liquidityGini) * 100;

	// Market concentration efficiency (prefer more balanced markets)
	const marketShareVariance = marketExchangeData.reduce((sum, ex) => {
		const marketShare = ex.marketShare || 0;
		const avgMarketShare = marketExchangeData.reduce((s, e) =>
			s + (e.marketShare || 0), 0) / marketExchangeData.length;
		return sum + Math.pow(marketShare - avgMarketShare, 2);
	}, 0);
	const concentrationEfficiency = Math.max(
		0,
		100 - Math.sqrt(marketShareVariance) * 2,
	);

	return (priceEfficiency * 0.5 + liquidityEfficiency * 0.3 +
		concentrationEfficiency * 0.2);
};

