/**
 * Trading Formatting Utilities
 * Centralized functions for formatting prices, amounts, and other trading data
 */

/**
 * Format price with adaptive precision based on value
 * Adds thousand separators for large values
 * @param price - Price value to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
	if (Number.isNaN(price)) return "0";
	
	let formatted: string;
	if (price < 0.01) {
		formatted = price.toFixed(6);
	} else if (price < 1) {
		formatted = price.toFixed(5);
	} else if (price < 100) {
		formatted = price.toFixed(4);
	} else {
		// For prices >= 100, always show 2 decimal places (including large prices)
		formatted = price.toFixed(2);
	}
	
	// Add thousand separators for values >= 1000
	if (price >= 1000) {
		const parts = formatted.split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		formatted = parts.join(".");
	}
	
	return formatted;
}

/**
 * Format amount with adaptive precision and abbreviations
 * @param amount - Amount value to format
 * @returns Formatted amount string with K/M suffixes if applicable
 */
export function formatAmount(amount: number): string {
	if (amount >= 1000000) {
		return (amount / 1000000).toFixed(2) + "M";
	}
	if (amount >= 1000) {
		return (amount / 1000).toFixed(2) + "K";
	}
	if (amount < 0.0001) {
		return amount.toFixed(8);
	}
	return amount.toFixed(4);
}

/**
 * Format cost/value with abbreviations
 * @param cost - Cost value to format
 * @returns Formatted cost string with K/M suffixes if applicable
 */
export function formatCost(cost: number): string {
	if (Number.isNaN(cost)) return "0.00";
	
	if (cost >= 1000000) {
		return (cost / 1000000).toFixed(2) + "M";
	}
	if (cost >= 1000) {
		return (cost / 1000).toFixed(2) + "K";
	}
	return cost.toFixed(2);
}

/**
 * Format order book quantity with consistent precision
 * Removes trailing zeros for cleaner display
 * @param quantity - Quantity value to format
 * @returns Formatted quantity string
 */
export function formatOrderBookQuantity(quantity: number): string {
	if (Number.isNaN(quantity)) return "0";
	
	// For very small values (< 0.0001), show up to 8 decimal places
	if (quantity < 0.0001) {
		const str = quantity.toFixed(8);
		// Remove trailing zeros
		return str.replace(/\.?0+$/, "");
	}
	
	// For values >= 0.0001, show up to 4 decimal places
	// Remove trailing zeros for cleaner display
	const formatted = quantity.toFixed(4);
	return formatted.replace(/\.?0+$/, "");
}

/**
 * Format order book total (price * quantity) with consistent formatting
 * Uses abbreviations for large values, adaptive precision for small values
 * @param total - Total value to format
 * @returns Formatted total string
 */
export function formatOrderBookTotal(total: number): string {
	if (Number.isNaN(total)) return "0.00";
	
	// Use abbreviations for large values
	if (total >= 1000000) {
		return (total / 1000000).toFixed(2) + "M";
	}
	if (total >= 1000) {
		return (total / 1000).toFixed(2) + "K";
	}
	
	// For values < 1000, use adaptive precision
	// Very small values need more precision
	if (total < 0.01) {
		const formatted = total.toFixed(4);
		return formatted.replace(/\.?0+$/, "") || "0";
	}
	
	// For values >= 0.01 and < 1000, always show 2 decimal places
	// Always show 2 decimals for consistency (don't remove trailing zeros)
	return total.toFixed(2);
}

/**
 * Format percentage with proper sign and precision
 * @param percentage - Percentage value to format
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(percentage: number | undefined, precision: number = 2): string {
	if (percentage === undefined || Number.isNaN(percentage)) return "0.00";
	return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(precision)}`;
}

/**
 * Format USD value with 2 decimal places
 * @param value - USD value to format
 * @returns Formatted USD string with 2 decimal places
 */
export function formatUSD(value: number): string {
	if (Number.isNaN(value)) return "0.00";
	return value.toFixed(2);
}

/**
 * Format balance with consistent precision
 * @param balance - Balance value to format
 * @param precision - Number of decimal places (default: 4 for main display, 8 for detailed)
 * @returns Formatted balance string
 */
export function formatBalance(balance: number, precision: number = 4): string {
	if (Number.isNaN(balance)) return "0.00";
	return balance.toFixed(precision);
}

/**
 * Format volume with abbreviations (K/M)
 * @param volume - Volume value to format
 * @returns Formatted volume string with K/M suffixes if applicable
 */
export function formatVolume(volume: number): string {
	if (Number.isNaN(volume)) return "0.00";
	
	if (volume >= 1000000) {
		return (volume / 1000000).toFixed(2) + "M";
	}
	if (volume >= 1000) {
		return (volume / 1000).toFixed(2) + "K";
	}
	return volume.toFixed(2);
}

/**
 * Get price precision based on value
 * @param price - Price value
 * @returns Number of decimal places
 */
export function getPricePrecision(price: number): number {
	if (price < 0.01) return 6;
	if (price < 1) return 5;
	if (price < 100) return 4;
	if (price < 10000) return 2;
	return 2; // Always 2 for prices >= 10000
}
