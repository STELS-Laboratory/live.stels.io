/**
 * Professional aggregation configuration presets
 */

import {
	AggregationMethod,
	type AggregationConfig,
	AggregationTimeframe,
} from "./aggregation-types";

/**
 * Conservative preset - High quality, outlier resistant
 * Best for: Risk management, regulatory compliance
 */
export const CONSERVATIVE_PRESET: AggregationConfig = {
	method: AggregationMethod.MEDIAN,
	timeframe: AggregationTimeframe.MINUTE_5,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.0, // Aggressive outlier removal
	},
	minExchanges: 4, // Require good coverage
};

/**
 * Standard preset - Balanced quality and performance
 * Best for: General trading, most use cases
 * RECOMMENDED for most applications
 */
export const STANDARD_PRESET: AggregationConfig = {
	method: AggregationMethod.VWAP,
	timeframe: AggregationTimeframe.MINUTE_1,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.5, // Standard outlier removal
	},
	minExchanges: 2,
};

/**
 * Aggressive preset - Fast updates, lower latency
 * Best for: High-frequency trading, scalping
 */
export const AGGRESSIVE_PRESET: AggregationConfig = {
	method: AggregationMethod.MARKET_SHARE,
	timeframe: AggregationTimeframe.SECOND_15,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "zscore",
		threshold: 3.0, // Less aggressive removal
	},
	minExchanges: 1,
};

/**
 * Research preset - Maximum data retention
 * Best for: Analysis, backtesting, research
 */
export const RESEARCH_PRESET: AggregationConfig = {
	method: AggregationMethod.EQUAL,
	timeframe: AggregationTimeframe.MINUTE_1,
	useRealHighLow: true,
	outlierDetection: {
		enabled: false, // Keep all data
		method: "iqr",
		threshold: 3.0,
	},
	minExchanges: 1,
};

/**
 * Liquidity-focused preset
 * Best for: Order execution, market depth analysis
 */
export const LIQUIDITY_PRESET: AggregationConfig = {
	method: AggregationMethod.LIQUIDITY,
	timeframe: AggregationTimeframe.SECOND_30,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.5,
	},
	minExchanges: 2,
};

/**
 * Regulatory preset - Compliance focused
 * Best for: Regulatory reporting, compliance
 */
export const REGULATORY_PRESET: AggregationConfig = {
	method: AggregationMethod.MARKET_SHARE,
	timeframe: AggregationTimeframe.MINUTE_1,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.5,
	},
	minExchanges: 3, // Ensure good representation
};

/**
 * TWAP preset - Time-weighted
 * Best for: Algorithmic trading benchmarks
 */
export const TWAP_PRESET: AggregationConfig = {
	method: AggregationMethod.TWAP,
	timeframe: AggregationTimeframe.MINUTE_1,
	useRealHighLow: true,
	outlierDetection: {
		enabled: true,
		method: "iqr",
		threshold: 1.5,
	},
	minExchanges: 2,
};

/**
 * Get preset by name
 */
export const getPreset = (
	preset: "conservative" | "standard" | "aggressive" | "research" | "liquidity" | "regulatory" | "twap",
): AggregationConfig => {
	switch (preset) {
		case "conservative":
			return CONSERVATIVE_PRESET;
		case "standard":
			return STANDARD_PRESET;
		case "aggressive":
			return AGGRESSIVE_PRESET;
		case "research":
			return RESEARCH_PRESET;
		case "liquidity":
			return LIQUIDITY_PRESET;
		case "regulatory":
			return REGULATORY_PRESET;
		case "twap":
			return TWAP_PRESET;
		default:
			return STANDARD_PRESET;
	}
};


