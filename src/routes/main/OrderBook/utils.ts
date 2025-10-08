/**
 * Utility functions for OrderBook module
 */

/**
 * Format price with appropriate decimal places
 */
export const formatPrice = (price: number): string => {
	return price.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	});
};

/**
 * Format volume with K/M suffixes
 */
export const formatVolume = (volume: number): string => {
	if (volume >= 1000000) {
		return `${(volume / 1000000).toFixed(2)}M`;
	} else if (volume >= 1000) {
		return `${(volume / 1000).toFixed(2)}K`;
	}
	return volume.toFixed(2);
};

/**
 * Get exchange color gradient
 */
export const getExchangeColor = (_exchange: string): string => {
	// Using single color scheme - zinc/amber
	return "from-amber-400 to-amber-600";
};

