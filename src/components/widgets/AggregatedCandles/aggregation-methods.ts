/**
 * Professional aggregation methods following financial industry standards
 */

import type { CandleData, ExchangeData } from "./types";
import type {
	AggregationMethod,
	WeightedValue,
} from "./aggregation-types";

/**
 * Calculate weight for a candle based on aggregation method
 */
export const calculateWeight = (
	method: AggregationMethod,
	candle: CandleData,
	exchange: ExchangeData,
): number => {
	switch (method) {
		case "vwap":
			// Volume-Weighted: weight = volume
			return candle.volume || 0;

		case "market-share":
			// Market share based (regulatory focus)
			return (exchange.marketShare || 0) / 100;

		case "liquidity":
			// Liquidity-weighted (order book depth)
			return exchange.liquidity || 0;

		case "dominance":
			// Dominance-weighted (combined metric)
			return (exchange.dominance || 0) / 100;

		case "equal":
			// Equal weight for all
			return 1;

		case "median":
		case "twap":
			// For median and TWAP, we handle differently
			return 1;

		default:
			return 1;
	}
};

/**
 * Detect outliers using IQR method (Interquartile Range)
 */
export const detectOutliersIQR = (
	values: number[],
	threshold: number = 1.5,
): Set<number> => {
	if (values.length < 4) return new Set();

	const sorted = [...values].sort((a, b) => a - b);
	const q1Index = Math.floor(sorted.length * 0.25);
	const q3Index = Math.floor(sorted.length * 0.75);

	const q1 = sorted[q1Index];
	const q3 = sorted[q3Index];
	const iqr = q3 - q1;

	const lowerBound = q1 - threshold * iqr;
	const upperBound = q3 + threshold * iqr;

	const outliers = new Set<number>();
	values.forEach((value, index) => {
		if (value < lowerBound || value > upperBound) {
			outliers.add(index);
		}
	});

	return outliers;
};

/**
 * Detect outliers using Z-Score method
 */
export const detectOutliersZScore = (
	values: number[],
	threshold: number = 3,
): Set<number> => {
	if (values.length < 2) return new Set();

	const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
	const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
		values.length;
	const stdDev = Math.sqrt(variance);

	if (stdDev === 0) return new Set();

	const outliers = new Set<number>();
	values.forEach((value, index) => {
		const zScore = Math.abs((value - mean) / stdDev);
		if (zScore > threshold) {
			outliers.add(index);
		}
	});

	return outliers;
};

/**
 * Calculate weighted average
 */
export const calculateWeightedAverage = (
	values: WeightedValue[],
): number => {
	if (values.length === 0) return 0;

	const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
	if (totalWeight === 0) {
		// Fallback to simple average
		return values.reduce((sum, v) => sum + v.value, 0) / values.length;
	}

	return values.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;
};

/**
 * Calculate weighted median (more robust than weighted average)
 */
export const calculateWeightedMedian = (
	values: WeightedValue[],
): number => {
	if (values.length === 0) return 0;
	if (values.length === 1) return values[0].value;

	// Sort by value
	const sorted = [...values].sort((a, b) => a.value - b.value);
	const totalWeight = sorted.reduce((sum, v) => sum + v.weight, 0);

	if (totalWeight === 0) {
		// Fallback to simple median
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 === 0
			? (sorted[mid - 1].value + sorted[mid].value) / 2
			: sorted[mid].value;
	}

	// Find weighted median
	let cumulativeWeight = 0;
	const halfWeight = totalWeight / 2;

	for (let i = 0; i < sorted.length; i++) {
		cumulativeWeight += sorted[i].weight;
		if (cumulativeWeight >= halfWeight) {
			return sorted[i].value;
		}
	}

	return sorted[sorted.length - 1].value;
};

/**
 * Calculate VWAP (Volume-Weighted Average Price)
 * Industry standard for aggregating prices across exchanges
 */
export const calculateVWAP = (
	candles: Array<{ price: number; volume: number }>,
): number => {
	if (candles.length === 0) return 0;

	const totalVolume = candles.reduce((sum, c) => sum + c.volume, 0);
	if (totalVolume === 0) {
		// Fallback to simple average
		return candles.reduce((sum, c) => sum + c.price, 0) / candles.length;
	}

	return candles.reduce((sum, c) => sum + c.price * c.volume, 0) / totalVolume;
};

/**
 * Calculate TWAP (Time-Weighted Average Price)
 * Weights by time duration rather than volume
 */
export const calculateTWAP = (
	candles: Array<{ price: number; timestamp: number }>,
): number => {
	if (candles.length === 0) return 0;
	if (candles.length === 1) return candles[0].price;

	// Sort by timestamp
	const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);

	let totalTime = 0;
	let weightedSum = 0;

	for (let i = 0; i < sorted.length - 1; i++) {
		const timeDelta = sorted[i + 1].timestamp - sorted[i].timestamp;
		weightedSum += sorted[i].price * timeDelta;
		totalTime += timeDelta;
	}

	// Last candle gets weight of average time delta
	if (totalTime > 0) {
		const avgTimeDelta = totalTime / (sorted.length - 1);
		weightedSum += sorted[sorted.length - 1].price * avgTimeDelta;
		totalTime += avgTimeDelta;
	}

	return totalTime > 0 ? weightedSum / totalTime : sorted[0].price;
};

/**
 * Calculate standard deviation for confidence scoring
 */
export const calculateStdDev = (values: number[]): number => {
	if (values.length < 2) return 0;

	const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
	const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
		values.length;

	return Math.sqrt(variance);
};

/**
 * Calculate confidence score based on data quality
 * Returns 0-1 where 1 is highest confidence
 */
export const calculateConfidenceScore = (
	exchangeCount: number,
	priceStdDev: number,
	avgPrice: number,
	totalWeight: number,
): number => {
	if (avgPrice === 0 || exchangeCount === 0) return 0;

	// Factor 1: Number of exchanges (more = better)
	// Normalized to 0-1, optimal at 5+ exchanges
	const exchangeFactor = Math.min(exchangeCount / 5, 1);

	// Factor 2: Price consistency (lower stddev = better)
	// Coefficient of variation
	const cv = priceStdDev / avgPrice;
	const consistencyFactor = Math.max(0, 1 - cv * 10);

	// Factor 3: Weight distribution (higher total weight = better)
	// Assumes weights are normalized 0-1
	const weightFactor = Math.min(totalWeight / exchangeCount, 1);

	// Weighted combination
	return (exchangeFactor * 0.4 + consistencyFactor * 0.4 + weightFactor * 0.2);
};

/**
 * Get first open price (chronologically)
 */
export const getFirstOpen = (candles: CandleData[]): number => {
	if (candles.length === 0) return 0;
	const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
	return sorted[0].open;
};

/**
 * Get last close price (chronologically)
 */
export const getLastClose = (candles: CandleData[]): number => {
	if (candles.length === 0) return 0;
	const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
	return sorted[sorted.length - 1].close;
};

/**
 * Get real high (maximum across all candles)
 * This is the correct approach for high prices
 */
export const getRealHigh = (candles: CandleData[]): number => {
	if (candles.length === 0) return 0;
	return Math.max(...candles.map((c) => c.high));
};

/**
 * Get real low (minimum across all candles)
 * This is the correct approach for low prices
 */
export const getRealLow = (candles: CandleData[]): number => {
	if (candles.length === 0) return 0;
	return Math.min(...candles.map((c) => c.low));
};

/**
 * Sum total volume
 */
export const getTotalVolume = (candles: CandleData[]): number => {
	return candles.reduce((sum, c) => sum + c.volume, 0);
};

