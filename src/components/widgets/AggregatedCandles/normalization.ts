/**
 * Normalization utilities for exchange price comparison
 */

import type { ExchangeData, CandleData } from "./types";
import { TIME_AGGREGATION_INTERVAL } from "./constants";

/**
 * Aggregate candles by time buckets to synchronize different exchanges
 * This is critical because exchanges send data at different times
 */
const aggregateCandlesByTime = (
	candles: CandleData[],
	timeframe: number = TIME_AGGREGATION_INTERVAL,
): CandleData[] => {
	if (candles.length === 0) return [];

	// Group by time buckets
	const buckets: { [time: number]: CandleData[] } = {};

	candles.forEach((candle) => {
		const bucketTime = Math.floor(candle.timestamp / timeframe) * timeframe;
		if (!buckets[bucketTime]) {
			buckets[bucketTime] = [];
		}
		buckets[bucketTime].push(candle);
	});

	// Aggregate each bucket - use last close price (most recent)
	return Object.entries(buckets)
		.map(([time, candlesInBucket]) => {
			// Sort by timestamp to get the most recent
			const sorted = candlesInBucket.sort((a, b) => b.timestamp - a.timestamp);
			const latest = sorted[0];

			return {
				...latest,
				timestamp: parseInt(time),
			};
		})
		.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Normalize exchange prices to percentage change from center point
 * WITH TIME SYNCHRONIZATION across all exchanges
 *
 * @param exchangeData - Array of exchange data
 * @param centerMethod - Method to determine center point ('first' | 'average' | 'median')
 * @param timeframe - Time bucket size in milliseconds (default: 1 minute)
 * @returns Normalized line data for each exchange with synchronized timestamps
 */
export const normalizeExchangePrices = (
	exchangeData: ExchangeData[],
	centerMethod: "first" | "average" | "median" = "first",
	timeframe: number = TIME_AGGREGATION_INTERVAL,
): {
	[exchange: string]: Array<{ time: number; value: number; originalPrice: number }>;
} => {
	const result: {
		[exchange: string]: Array<{
			time: number;
			value: number;
			originalPrice: number;
		}>;
	} = {};

	// First, collect all unique time buckets across ALL exchanges
	const allTimeBuckets = new Set<number>();
	exchangeData.forEach(({ candles }) => {
		candles.forEach((candle) => {
			const bucketTime = Math.floor(candle.timestamp / timeframe) * timeframe;
			allTimeBuckets.add(bucketTime);
		});
	});

	const sortedTimeBuckets = Array.from(allTimeBuckets).sort((a, b) => a - b);

	console.log(`Time synchronization: ${sortedTimeBuckets.length} unique time buckets`);

	exchangeData.forEach(({ exchange, candles }) => {
		if (candles.length === 0) return;

		// Aggregate candles by time buckets
		const aggregated = aggregateCandlesByTime(candles, timeframe);
		if (aggregated.length === 0) return;

		// Determine center price for this exchange
		let centerPrice: number;

		switch (centerMethod) {
			case "average": {
				centerPrice = aggregated.reduce((sum, c) => sum + c.close, 0) /
					aggregated.length;
				break;
			}
			case "median": {
				const sorted = [...aggregated].sort((a, b) => a.close - b.close);
				const mid = Math.floor(sorted.length / 2);
				centerPrice = sorted.length % 2 === 0
					? (sorted[mid - 1].close + sorted[mid].close) / 2
					: sorted[mid].close;
				break;
			}
			case "first":
			default: {
				// Use first price as baseline (0%)
				centerPrice = aggregated[0].close;
				break;
			}
		}

		// Create time-aligned data map
		const dataMap = new Map<number, number>();
		aggregated.forEach((candle) => {
			const bucketTime = Math.floor(candle.timestamp / timeframe) * timeframe;
			const normalizedValue = centerPrice > 0
				? ((candle.close - centerPrice) / centerPrice) * 100
				: 0;
			dataMap.set(bucketTime, normalizedValue);
		});

		// Fill in all time buckets (use last known value for missing times)
		let lastKnownValue = 0;
		let lastKnownPrice = centerPrice;

		result[exchange] = sortedTimeBuckets.map((bucketTime) => {
			if (dataMap.has(bucketTime)) {
				lastKnownValue = dataMap.get(bucketTime)!;
				// Find the original price
				const candle = aggregated.find((c) =>
					Math.floor(c.timestamp / timeframe) * timeframe === bucketTime
				);
				if (candle) {
					lastKnownPrice = candle.close;
				}
			}

			return {
				time: Math.floor(bucketTime / 1000),
				value: lastKnownValue,
				originalPrice: lastKnownPrice,
			};
		});
	});

	return result;
};

/**
 * Get price range for normalized data (for y-axis scaling)
 */
export const getNormalizedPriceRange = (
	normalizedData: {
		[exchange: string]: Array<{ time: number; value: number }>;
	},
): { min: number; max: number } => {
	let min = 0;
	let max = 0;

	Object.values(normalizedData).forEach((data) => {
		data.forEach(({ value }) => {
			if (value < min) min = value;
			if (value > max) max = value;
		});
	});

	// Add 10% padding
	const padding = (max - min) * 0.1;
	return {
		min: min - padding,
		max: max + padding,
	};
};

/**
 * Calculate baseline (VWAP) for center reference
 */
export const calculateBaselineVWAP = (
	exchangeData: ExchangeData[],
): number => {
	let totalVolume = 0;
	let totalValue = 0;

	exchangeData.forEach(({ candles }) => {
		candles.forEach((candle) => {
			totalVolume += candle.volume;
			totalValue += candle.close * candle.volume;
		});
	});

	return totalVolume > 0 ? totalValue / totalVolume : 0;
};

