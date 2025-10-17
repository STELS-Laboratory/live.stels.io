/**
 * Professional aggregation types following financial industry standards
 */

/**
 * Aggregation method for combining multi-exchange data
 */
export const AggregationMethod = {
	/** Weighted by market share (regulatory focus) */
	MARKET_SHARE: "market-share",
	/** Volume-Weighted Average Price (VWAP) - industry standard */
	VWAP: "vwap",
	/** Time-Weighted Average Price (TWAP) */
	TWAP: "twap",
	/** Liquidity-weighted (order book depth) */
	LIQUIDITY: "liquidity",
	/** Equal weight for all exchanges */
	EQUAL: "equal",
	/** Median-based (outlier resistant) */
	MEDIAN: "median",
	/** Dominance-weighted (market share + depth) */
	DOMINANCE: "dominance",
} as const;

export type AggregationMethod = typeof AggregationMethod[keyof typeof AggregationMethod];

/**
 * Timeframe for candle aggregation
 */
export const AggregationTimeframe = {
	/** 1 second */
	SECOND_1: 1000,
	/** 5 seconds */
	SECOND_5: 5000,
	/** 15 seconds */
	SECOND_15: 15000,
	/** 30 seconds */
	SECOND_30: 30000,
	/** 1 minute */
	MINUTE_1: 60000,
	/** 5 minutes */
	MINUTE_5: 300000,
	/** 15 minutes */
	MINUTE_15: 900000,
	/** 1 hour */
	HOUR_1: 3600000,
} as const;

export type AggregationTimeframe = typeof AggregationTimeframe[keyof typeof AggregationTimeframe];

/**
 * Configuration for outlier detection
 */
export interface OutlierConfig {
	/** Enable outlier detection */
	enabled: boolean;
	/** Method: 'iqr' (Interquartile Range) or 'zscore' (Z-Score) */
	method: "iqr" | "zscore";
	/** Threshold for IQR (typically 1.5) or Z-score (typically 3) */
	threshold: number;
}

/**
 * Configuration for professional aggregation
 */
export interface AggregationConfig {
	/** Primary aggregation method */
	method: AggregationMethod;
	/** Timeframe for grouping candles */
	timeframe: AggregationTimeframe;
	/** Outlier detection configuration */
	outlierDetection?: OutlierConfig;
	/** Use real max/min for High/Low (recommended: true) */
	useRealHighLow: boolean;
	/** Minimum number of exchanges required for aggregation */
	minExchanges?: number;
}

/**
 * Weighted value for aggregation
 */
export interface WeightedValue {
	value: number;
	weight: number;
	exchange?: string;
	timestamp?: number;
	volume?: number;
}

/**
 * Aggregation statistics and metadata
 */
export interface AggregationStats {
	/** Number of exchanges included */
	exchangeCount: number;
	/** Number of candles aggregated */
	candleCount: number;
	/** Number of outliers detected and removed */
	outliersRemoved: number;
	/** Total weight used */
	totalWeight: number;
	/** Standard deviation of prices */
	priceStdDev: number;
	/** Price range (high - low) */
	priceRange: number;
	/** Confidence score (0-1) */
	confidenceScore: number;
}

/**
 * Result of aggregation with metadata
 */
export interface AggregatedCandleWithStats {
	/** Timestamp */
	time: number;
	/** Open price */
	open: number;
	/** High price */
	high: number;
	/** Low price */
	low: number;
	/** Close price */
	close: number;
	/** Aggregated volume */
	volume: number;
	/** VWAP for this period */
	vwap?: number;
	/** Aggregation statistics */
	stats: AggregationStats;
}

