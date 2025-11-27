/**
 * Trading Terminal Constants
 * Version and configuration constants
 */

/**
 * Trading Terminal Component Version
 * Increment this when making breaking changes to component structure
 */
export const TRADING_TERMINAL_VERSION = "2.0.0";

/**
 * Component version metadata
 */
export interface ComponentVersion {
	version: string;
	buildDate: string;
	component: string;
}

/**
 * Get current component version info
 */
export function getComponentVersion(): ComponentVersion {
	return {
		version: TRADING_TERMINAL_VERSION,
		buildDate: new Date().toISOString(),
		component: "TradingTerminal",
	};
}
