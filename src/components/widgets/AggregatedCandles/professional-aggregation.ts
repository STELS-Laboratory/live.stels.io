/**
 * Professional aggregation engine following financial industry standards
 *
 * This module implements industry-standard methods for aggregating
 * multi-exchange candlestick data including VWAP, TWAP, and median-based approaches.
 */

import type { CandleData, ExchangeData } from "./types";
import {
	AggregationMethod,
	AggregationTimeframe,
	type AggregatedCandleWithStats,
	type AggregationConfig,
	type AggregationStats,
	type WeightedValue,
} from "./aggregation-types";
import {
	calculateConfidenceScore,
	calculateStdDev,
	calculateTWAP,
	calculateVWAP,
	calculateWeight,
	calculateWeightedAverage,
	calculateWeightedMedian,
	detectOutliersIQR,
	detectOutliersZScore,
	getRealHigh,
	getRealLow,
	getTotalVolume,
} from "./aggregation-methods";

/**
 * Default professional configuration
 */
export const DEFAULT_AGGREGATION_CONFIG: AggregationConfig = {
	method: AggregationMethod.MARKET_SHARE,
	timeframe: AggregationTimeframe.MINUTE_1,
	useRealHighLow: true, // Always use real max/min for high/low
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.5,
	},
	minExchanges: 1,
};

/**
 * Group candles by timeframe
 */
const groupCandlesByTimeframe = (
	exchangeData: ExchangeData[],
	timeframe: AggregationTimeframe,
): Map<number, Array<{ candle: CandleData; exchange: ExchangeData }>> => {
	const groups = new Map<
		number,
		Array<{ candle: CandleData; exchange: ExchangeData }>
	>();

	exchangeData.forEach((exchange) => {
		exchange.candles.forEach((candle) => {
			const groupTime = Math.floor(candle.timestamp / timeframe) * timeframe;
			if (!groups.has(groupTime)) {
				groups.set(groupTime, []);
			}
			groups.get(groupTime)!.push({ candle, exchange });
		});
	});

	return groups;
};

/**
 * Filter outliers from candle group
 */
const filterOutliers = (
	candles: Array<{ candle: CandleData; exchange: ExchangeData }>,
	config: AggregationConfig,
): {
	filtered: Array<{ candle: CandleData; exchange: ExchangeData }>;
	removedCount: number;
} => {
	if (!config.outlierDetection?.enabled || candles.length < 4) {
		return { filtered: candles, removedCount: 0 };
	}

	// Use close prices for outlier detection
	const closePrices = candles.map((c) => c.candle.close);

	let outlierIndices: Set<number>;
	if (config.outlierDetection.method === "zscore") {
		outlierIndices = detectOutliersZScore(
			closePrices,
			config.outlierDetection.threshold,
		);
	} else {
		outlierIndices = detectOutliersIQR(
			closePrices,
			config.outlierDetection.threshold,
		);
	}

	const filtered = candles.filter((_, index) => !outlierIndices.has(index));

	return {
		filtered,
		removedCount: outlierIndices.size,
	};
};

/**
 * Aggregate a group of candles into a single candle
 * Following financial industry standards
 */
const aggregateCandleGroup = (
	candles: Array<{ candle: CandleData; exchange: ExchangeData }>,
	timestamp: number,
	config: AggregationConfig,
): AggregatedCandleWithStats => {
	// Filter outliers first
	const { filtered, removedCount } = filterOutliers(candles, config);

	if (filtered.length === 0) {
		// Return empty candle if all filtered out
		return {
			time: timestamp,
			open: 0,
			high: 0,
			low: 0,
			close: 0,
			volume: 0,
			stats: {
				exchangeCount: 0,
				candleCount: 0,
				outliersRemoved: removedCount,
				totalWeight: 0,
				priceStdDev: 0,
				priceRange: 0,
				confidenceScore: 0,
			},
		};
	}

	const justCandles = filtered.map((c) => c.candle);

	// High/Low: Always use real max/min (financial standard)
	const high = getRealHigh(justCandles);
	const low = getRealLow(justCandles);

	// Volume: Sum total
	const volume = getTotalVolume(justCandles);

	let open: number;
	let close: number;
	let vwap: number | undefined;

	// Calculate open/close based on method
	switch (config.method) {
		case "vwap": {
			// VWAP: Volume-Weighted Average Price
			vwap = calculateVWAP(
				justCandles.map((c) => ({ price: c.close, volume: c.volume })),
			);
			open = calculateVWAP(
				justCandles.map((c) => ({ price: c.open, volume: c.volume })),
			);
			close = vwap;
			break;
		}

		case "twap": {
			// TWAP: Time-Weighted Average Price
			open = calculateTWAP(
				justCandles.map((c) => ({ price: c.open, timestamp: c.timestamp })),
			);
			close = calculateTWAP(
				justCandles.map((c) => ({ price: c.close, timestamp: c.timestamp })),
			);
			break;
		}

		case "median": {
			// Median-based (outlier resistant)
			const openValues: WeightedValue[] = filtered.map(({ candle }) => ({
				value: candle.open,
				weight: 1,
			}));
			const closeValues: WeightedValue[] = filtered.map(({ candle }) => ({
				value: candle.close,
				weight: 1,
			}));

			open = calculateWeightedMedian(openValues);
			close = calculateWeightedMedian(closeValues);
			break;
		}

		default: {
			// Weighted average (market-share, liquidity, dominance, equal)
			const openValues: WeightedValue[] = filtered.map(({ candle, exchange }) => ({
				value: candle.open,
				weight: calculateWeight(config.method, candle, exchange),
			}));

			const closeValues: WeightedValue[] = filtered.map(({ candle, exchange }) => ({
				value: candle.close,
				weight: calculateWeight(config.method, candle, exchange),
			}));

			open = calculateWeightedAverage(openValues);
			close = calculateWeightedAverage(closeValues);

			// Calculate VWAP as additional metric
			if (volume > 0) {
				vwap = calculateVWAP(
					justCandles.map((c) => ({ price: c.close, volume: c.volume })),
				);
			}
			break;
		}
	}

	// Calculate statistics
	const closePrices = justCandles.map((c) => c.close);
	const priceStdDev = calculateStdDev(closePrices);
	const priceRange = high - low;
	const totalWeight = filtered.reduce(
		(sum, { candle, exchange }) =>
			sum + calculateWeight(config.method, candle, exchange),
		0,
	);
	const avgPrice = closePrices.reduce((s, p) => s + p, 0) / closePrices.length;
	const exchangeCount = new Set(filtered.map((c) => c.exchange.exchange)).size;
	const confidenceScore = calculateConfidenceScore(
		exchangeCount,
		priceStdDev,
		avgPrice,
		totalWeight,
	);

	const stats: AggregationStats = {
		exchangeCount,
		candleCount: filtered.length,
		outliersRemoved: removedCount,
		totalWeight,
		priceStdDev,
		priceRange,
		confidenceScore,
	};

	return {
		time: timestamp,
		open,
		high,
		low,
		close,
		volume,
		vwap,
		stats,
	};
};

/**
 * Create professionally aggregated candles
 *
 * @param exchangeData - Array of exchange data with candles
 * @param config - Aggregation configuration (defaults to industry standards)
 * @returns Array of aggregated candles with metadata
 *
 * @example
 * ```typescript
 * const config: AggregationConfig = {
 *   method: AggregationMethod.VWAP,
 *   timeframe: AggregationTimeframe.MINUTE_1,
 *   useRealHighLow: true,
 *   outlierDetection: { enabled: true, method: 'iqr', threshold: 1.5 }
 * };
 *
 * const candles = createProfessionalAggregatedCandles(exchangeData, config);
 * ```
 */
export const createProfessionalAggregatedCandles = (
	exchangeData: ExchangeData[],
	config: AggregationConfig = DEFAULT_AGGREGATION_CONFIG,
): AggregatedCandleWithStats[] => {
	if (exchangeData.length === 0) return [];

	// Group candles by timeframe
	const groups = groupCandlesByTimeframe(exchangeData, config.timeframe);

	// Aggregate each group
	const aggregated: AggregatedCandleWithStats[] = [];

	for (const [timestamp, candles] of groups) {
		// Skip if not enough exchanges
		if (
			config.minExchanges &&
			new Set(candles.map((c) => c.exchange.exchange)).size < config.minExchanges
		) {
			continue;
		}

		const agg = aggregateCandleGroup(candles, timestamp, config);

		// Skip empty candles
		if (agg.stats.candleCount > 0) {
			aggregated.push(agg);
		}
	}

	// Sort by time
	return aggregated.sort((a, b) => a.time - b.time);
};

/**
 * Convert aggregated candles to chart-compatible format
 */
export const convertToChartFormat = (
	candles: AggregatedCandleWithStats[],
): Array<{
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
}> => {
	return candles.map((c) => ({
		time: Math.floor(c.time / 1000),
		open: c.open,
		high: c.high,
		low: c.low,
		close: c.close,
	}));
};

/**
 * Get aggregation quality report
 */
export const getAggregationQualityReport = (
	candles: AggregatedCandleWithStats[],
): {
	avgConfidence: number;
	avgExchangeCount: number;
	totalOutliersRemoved: number;
	candlesWithLowConfidence: number;
} => {
	if (candles.length === 0) {
		return {
			avgConfidence: 0,
			avgExchangeCount: 0,
			totalOutliersRemoved: 0,
			candlesWithLowConfidence: 0,
		};
	}

	const avgConfidence = candles.reduce((sum, c) => sum + c.stats.confidenceScore, 0) /
		candles.length;

	const avgExchangeCount = candles.reduce((sum, c) => sum + c.stats.exchangeCount, 0) /
		candles.length;

	const totalOutliersRemoved = candles.reduce(
		(sum, c) => sum + c.stats.outliersRemoved,
		0,
	);

	const candlesWithLowConfidence = candles.filter((c) =>
		c.stats.confidenceScore < 0.5
	).length;

	return {
		avgConfidence,
		avgExchangeCount,
		totalOutliersRemoved,
		candlesWithLowConfidence,
	};
};

