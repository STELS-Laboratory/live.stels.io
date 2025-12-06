/**
 * Amount Parser and Formatter
 * Utilities for parsing and formatting amount inputs with user-friendly handling
 * 
 * Protocol rules (from genesis.json):
 * - SLI currency: 8 decimals (parameters.currency.decimals)
 * - Smart operations: 6 decimals (smart_ops_spec.types.transfer.amount: decimal(6))
 * - Fee unit: 10^-6 SLI (6 decimals)
 */

/**
 * Parse amount input - accepts various formats and normalizes to decimal string
 * Supports:
 * - Commas as thousand separators: "1,000.50"
 * - Spaces as thousand separators: "1 000.50"
 * - Multiple decimal separators (uses first one): "1.000.50" -> "1000.50"
 * - Leading/trailing spaces
 * - Empty string
 * - European format (comma as decimal): "1,50" -> "1.50"
 */
export function parseAmountInput(input: string): string {
	if (!input || input.trim() === "") {
		return "";
	}

	// Remove all spaces and normalize
	let cleaned = input.trim().replace(/\s+/g, "");

	// Detect format: if comma appears after dot, it's thousand separator
	// If comma appears before any dot, it might be decimal separator (European format)
	const dotIndex = cleaned.indexOf(".");
	const commaIndex = cleaned.indexOf(",");

	if (dotIndex !== -1 && commaIndex !== -1) {
		// Both exist - determine which is decimal separator
		if (commaIndex < dotIndex) {
			// Comma before dot: European format "1,234.56" -> treat comma as thousand, dot as decimal
			cleaned = cleaned.replace(/,/g, "");
		} else {
			// Dot before comma: "1.234,56" -> European format, swap them
			cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
		}
	} else if (commaIndex !== -1 && dotIndex === -1) {
		// Only comma - could be European decimal separator or thousand separator
		// If there are multiple commas or comma is far from end, treat as thousand separator
		const commaCount = (cleaned.match(/,/g) || []).length;
		const lastCommaIndex = cleaned.lastIndexOf(",");
		const digitsAfterComma = cleaned.length - lastCommaIndex - 1;

		if (commaCount > 1 || (digitsAfterComma > 3 && commaCount === 1)) {
			// Multiple commas or more than 3 digits after comma = thousand separator
			cleaned = cleaned.replace(/,/g, "");
		} else {
			// Single comma with <= 3 digits after = likely decimal separator (European format)
			cleaned = cleaned.replace(/,/g, ".");
		}
	} else if (dotIndex !== -1) {
		// Only dot - remove commas if any (they're thousand separators)
		cleaned = cleaned.replace(/,/g, "");
	}

	// Remove all non-digit and non-dot characters (except minus sign at start for negative numbers)
	cleaned = cleaned.replace(/[^\d.-]/g, "");

	// Handle multiple dots - keep only the first one (treat others as thousand separators)
	const firstDotIndex = cleaned.indexOf(".");
	if (firstDotIndex !== -1) {
		const beforeDot = cleaned.substring(0, firstDotIndex).replace(/\./g, "");
		const afterDot = cleaned.substring(firstDotIndex + 1).replace(/\./g, "");
		cleaned = beforeDot + "." + afterDot;
	}

	// Remove leading zeros (except if it's "0." or "0")
	if (cleaned.startsWith("0") && cleaned.length > 1 && cleaned[1] !== ".") {
		cleaned = cleaned.replace(/^0+/, "");
		if (cleaned === "" || cleaned === ".") {
			cleaned = "0";
		}
	}

	// Ensure it starts with a digit or is "0"
	if (cleaned && !/^\d/.test(cleaned) && cleaned !== "0") {
		cleaned = cleaned.replace(/^[^\d]+/, "");
	}

	// Remove trailing dot if no digits after
	if (cleaned.endsWith(".") && cleaned.length > 1) {
		// Allow trailing dot for user input (e.g., "10." while typing)
		// But remove if it's just "."
		if (cleaned === ".") {
			cleaned = "";
		}
	}

	return cleaned;
}

/**
 * Format amount for display with thousand separators
 * @param amount - Amount string (e.g., "1234.567890")
 * @param decimals - Number of decimal places to show
 * @param showDecimals - Whether to always show decimal places (default: true)
 */
export function formatAmountDisplay(
	amount: string,
	decimals: number = 6,
	showDecimals: boolean = true,
): string {
	if (!amount || amount.trim() === "" || amount === ".") {
		return "";
	}

	// Parse to number
	const num = Number.parseFloat(amount);
	if (Number.isNaN(num)) {
		return amount; // Return as-is if not a valid number
	}

	// Format with thousand separators
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: showDecimals ? decimals : 0,
		maximumFractionDigits: decimals,
		useGrouping: true,
	}).format(num);

	return formatted;
}

/**
 * Validate and normalize amount to required decimal format
 * @param input - User input string
 * @param maxDecimals - Maximum decimal places allowed
 * @returns Normalized amount string or null if invalid
 */
export function normalizeAmount(
	input: string,
	maxDecimals: number = 6,
): string | null {
	if (!input || input.trim() === "") {
		return null;
	}

	// Parse input
	const parsed = parseAmountInput(input);
	if (!parsed || parsed === ".") {
		return null;
	}

	// Validate it's a valid number
	const num = Number.parseFloat(parsed);
	if (Number.isNaN(num) || num < 0) {
		return null;
	}

	// Check decimal places
	const dotIndex = parsed.indexOf(".");
	if (dotIndex !== -1) {
		const decimalPart = parsed.substring(dotIndex + 1);
		if (decimalPart.length > maxDecimals) {
			// Truncate to max decimals
			const truncated = parsed.substring(0, dotIndex + 1 + maxDecimals);
			return truncated;
		}
	}

	return parsed;
}

/**
 * Format amount for API (ensures proper decimal format per protocol)
 * @param amount - Amount string
 * @param decimals - Required decimal places (8 for SLI, 6 for smart operations)
 * @returns Formatted string with exactly `decimals` decimal places
 */
export function formatAmountForAPI(amount: string, decimals: number = 6): string {
	if (!amount || amount.trim() === "") {
		return "0." + "0".repeat(decimals);
	}

	const normalized = normalizeAmount(amount, decimals);
	if (!normalized) {
		return "0." + "0".repeat(decimals);
	}

	// Ensure proper decimal format per protocol rules
	// Protocol requires exact decimal format (no scientific notation)
	const num = Number.parseFloat(normalized);
	
	// Check for very large numbers that might lose precision
	if (num > Number.MAX_SAFE_INTEGER) {
		// For very large numbers, use string manipulation to preserve precision
		const normalizedStr = normalized;
		const dotIndex = normalizedStr.indexOf(".");
		
		if (dotIndex === -1) {
			// No decimal point - add zeros
			return normalizedStr + "." + "0".repeat(decimals);
		}
		
		const integerPart = normalizedStr.substring(0, dotIndex);
		const decimalPart = normalizedStr.substring(dotIndex + 1);
		const paddedDecimal = decimalPart.padEnd(decimals, "0").substring(0, decimals);
		
		return integerPart + "." + paddedDecimal;
	}
	
	// For normal numbers, use toFixed
	const formatted = num.toFixed(decimals);
	
	// Ensure no scientific notation
	if (formatted.includes("e") || formatted.includes("E")) {
		// Fallback to manual formatting
		return formatAmountForAPI(normalized, decimals);
	}
	
	return formatted;
}

/**
 * Handle amount input change - parse and format on the fly
 * Allows user-friendly input while enforcing protocol limits
 * @param value - Input value
 * @param maxDecimals - Maximum decimal places (8 for SLI, 6 for smart operations)
 * @returns Parsed value for state (allows trailing dot for better UX)
 */
export function handleAmountInputChange(
	value: string,
	maxDecimals: number = 6,
): string {
	// Allow empty input
	if (value === "") {
		return "";
	}

	// Parse input
	const parsed = parseAmountInput(value);

	// If parsing resulted in empty, return empty
	if (!parsed) {
		return "";
	}

	// Allow trailing dot for better UX (user might be typing "10.")
	if (parsed === ".") {
		return ".";
	}

	// Check decimal places and truncate if needed
	const dotIndex = parsed.indexOf(".");
	if (dotIndex !== -1) {
		const decimalPart = parsed.substring(dotIndex + 1);
		if (decimalPart.length > maxDecimals) {
			// Truncate to max decimals (per protocol rules)
			return parsed.substring(0, dotIndex + 1 + maxDecimals);
		}
	}

	return parsed;
}

/**
 * Validate amount for transaction
 * @param amount - Amount string
 * @param maxDecimals - Maximum decimal places
 * @returns Error message or null if valid
 */
export function validateAmount(
	amount: string,
	maxDecimals: number = 6,
): string | null {
	if (!amount || amount.trim() === "") {
		return "Amount is required";
	}

	const normalized = normalizeAmount(amount, maxDecimals);
	if (!normalized) {
		return `Invalid amount format (max ${maxDecimals} decimal places)`;
	}

	const num = Number.parseFloat(normalized);
	if (Number.isNaN(num) || num <= 0) {
		return "Amount must be greater than 0";
	}

	return null;
}

/**
 * Convert raw balance (base units) to human-readable format
 * @param rawBalance - Raw balance string (e.g., "4496000000000" for 44960 SLI with 8 decimals)
 * @param decimals - Number of decimal places (8 for SLI per protocol)
 * @returns Human-readable amount string
 */
export function fromRawBalance(
	rawBalance: string | number,
	decimals: number = 8,
): string {
	const raw = typeof rawBalance === "string" ? rawBalance : rawBalance.toString();
	const num = Number.parseFloat(raw);
	
	if (Number.isNaN(num)) {
		return "0." + "0".repeat(decimals);
	}
	
	// Divide by 10^decimals to convert from base units
	const humanReadable = num / Math.pow(10, decimals);
	return formatAmountForAPI(humanReadable.toString(), decimals);
}

/**
 * Convert human-readable amount to raw balance (base units)
 * @param amount - Human-readable amount string (e.g., "44960.00000000")
 * @param decimals - Number of decimal places (8 for SLI per protocol)
 * @returns Raw balance string in base units
 */
export function toRawBalance(
	amount: string,
	decimals: number = 8,
): string {
	if (!amount || amount.trim() === "") {
		return "0";
	}
	
	const normalized = normalizeAmount(amount, decimals);
	if (!normalized) {
		return "0";
	}
	
	const num = Number.parseFloat(normalized);
	if (Number.isNaN(num) || num < 0) {
		return "0";
	}
	
	// Multiply by 10^decimals to convert to base units
	const raw = Math.floor(num * Math.pow(10, decimals));
	return raw.toString();
}

