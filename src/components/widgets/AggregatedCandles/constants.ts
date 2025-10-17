/**
 * Constants for AggregatedCandles widget
 */

/**
 * Professional trading colors based on liquidity ranking
 * Using different shades to clearly distinguish exchanges
 */
export const LIQUIDITY_COLOR_PALETTE = [
	"#104eb9", // amber-500 - highest liquidity (brightest)
	"#aa08ea", // amber-400
	"#d84c0d", // amber-300
	"#36801d", // amber-200
	"#b50b65", // amber-100
	"#0a7346", // lime-500 - medium liquidity
	"#776608", // green-500
	"#6d10b9", // emerald-500
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
] as const;

/**
 * Default fallback color for exchanges
 */
export const DEFAULT_EXCHANGE_COLOR = "#6b7280";

/**
 * Volume bar colors
 */
export const VOLUME_COLORS = {
	up: "rgba(22,163,74,0.35)",
	down: "rgba(220,38,38,0.35)",
} as const;

/**
 * Fair value line configuration
 */
export const FAIR_VALUE_LINE_CONFIG = {
	color: "#f59e0b",
	lineWidth: 2,
	lineStyle: 2, // Dashed line
} as const;

/**
 * Market efficiency thresholds
 */
export const EFFICIENCY_THRESHOLDS = {
	high: 80,
	medium: 60,
} as const;

/**
 * Market concentration warning threshold (percentage)
 */
export const MARKET_CONCENTRATION_THRESHOLD = 40;

/**
 * Maximum number of exchanges to display in legend
 */
export const MAX_EXCHANGES_IN_LEGEND = 6;

/**
 * Significant market share threshold (percentage)
 */
export const SIGNIFICANT_MARKET_SHARE = 15;

/**
 * Line width configuration for exchange lines
 */
export const LINE_WIDTH = {
	min: 1,
	max: 5,
} as const;

/**
 * Opacity configuration for exchange lines
 */
export const LINE_OPACITY = {
	min: 0.6,
	max: 1,
	base: 0.6,
	range: 0.4,
} as const;

/**
 * Crosshair marker configuration
 */
export const CROSSHAIR_MARKER = {
	minRadius: 2,
	maxRadius: 6,
	baseRadius: 2,
	range: 4,
} as const;

/**
 * Time aggregation interval (milliseconds)
 */
export const TIME_AGGREGATION_INTERVAL = 60000; // 1 minute

/**
 * Maximum candles per exchange to process
 */
export const MAX_CANDLES_PER_EXCHANGE = 100;

/**
 * Maximum candles to display on chart (for real-time tracking)
 */
export const MAX_CANDLES_TO_DISPLAY = 100;

/**
 * Depth normalization factor for dominance calculation
 */
export const DEPTH_NORMALIZATION_LEVELS = 20;

