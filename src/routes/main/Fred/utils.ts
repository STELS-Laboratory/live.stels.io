/**
 * Utility functions for Fred module
 */

import type { FredIndicator, CountryData } from "./types";

/**
 * Format indicator value based on unit
 */
export const formatValue = (
	value: number,
	unit: string,
	decimal: number = 0,
): string => {
	if (unit === "usd") {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: decimal,
			maximumFractionDigits: decimal,
			notation: value > 1e12 ? "compact" : "standard",
		}).format(value);
	}

	if (unit === "pct") {
		return `${value.toFixed(decimal)}%`;
	}

	if (unit === "count") {
		return new Intl.NumberFormat("en-US", {
			notation: value > 1e6 ? "compact" : "standard",
		}).format(value);
	}

	return `${value.toFixed(decimal)} ${unit}`;
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

/**
 * Group indicators by country
 */
export const groupIndicatorsByCountry = (
	indicators: FredIndicator[],
): CountryData[] => {
	const grouped: Record<string, CountryData> = {};

	indicators.forEach((indicator) => {
		const country = indicator.value.raw.country;
		const countryName = indicator.value.raw.countryName;
		const groupId = indicator.value.raw.groupId;

		if (!grouped[country]) {
			grouped[country] = {
				country,
				countryName,
				indicators: [],
				categories: {},
			};
		}

		grouped[country].indicators.push(indicator);

		if (!grouped[country].categories[groupId]) {
			grouped[country].categories[groupId] = [];
		}
		grouped[country].categories[groupId].push(indicator);
	});

	return Object.values(grouped).sort((a, b) =>
		a.countryName.localeCompare(b.countryName)
	);
};

/**
 * Calculate percentage change
 */
export const calculateChange = (
	current: number,
	previous: number,
): { value: number; percentage: number } => {
	const change = current - previous;
	const percentage = previous !== 0 ? (change / previous) * 100 : 0;
	return { value: change, percentage };
};

/**
 * Get trend direction from value
 */
export const getTrend = (
	value: number,
): "up" | "down" | "neutral" => {
	if (value > 0.5) return "up";
	if (value < -0.5) return "down";
	return "neutral";
};

/**
 * Filter indicators by search term
 */
export const filterIndicators = (
	indicators: FredIndicator[],
	searchTerm: string,
): FredIndicator[] => {
	if (!searchTerm) return indicators;

	const search = searchTerm.toLowerCase();
	return indicators.filter((indicator) => {
		const raw = indicator.value.raw;
		return (
			raw.indicatorName.toLowerCase().includes(search) ||
			raw.indicator.toLowerCase().includes(search) ||
			raw.country.toLowerCase().includes(search) ||
			raw.countryName.toLowerCase().includes(search)
		);
	});
};

/**
 * Sort indicators by value
 */
export const sortIndicators = (
	indicators: FredIndicator[],
	direction: "asc" | "desc" = "desc",
): FredIndicator[] => {
	return [...indicators].sort((a, b) => {
		const valueA = a.value.raw.value;
		const valueB = b.value.raw.value;
		return direction === "asc" ? valueA - valueB : valueB - valueA;
	});
};

