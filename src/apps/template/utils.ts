/**
 * Template App Utility Functions
 * 
 * INSTRUCTIONS:
 * 1. Add helper functions specific to your app
 * 2. Keep utilities pure and testable
 * 3. Export functions that are used in multiple components
 */

import type { TemplateData } from "./types";

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(value: number): string {
	if (value >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(2)}B`;
	}
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(2)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(2)}K`;
	}
	return value.toFixed(2);
}

/**
 * Validate data structure
 */
export function validateTemplateData(data: unknown): data is TemplateData {
	if (!data || typeof data !== "object") {
		return false;
	}

	const obj = data as Record<string, unknown>;

	return (
		typeof obj.id === "string" &&
		typeof obj.title === "string" &&
		typeof obj.value === "number" &&
		typeof obj.timestamp === "number"
	);
}

/**
 * Sort data array by field
 */
export function sortTemplateData(
	data: TemplateData[],
	field: keyof TemplateData,
	order: "asc" | "desc" = "asc",
): TemplateData[] {
	return [...data].sort((a, b) => {
		const aVal = a[field];
		const bVal = b[field];

		if (typeof aVal === "string" && typeof bVal === "string") {
			return order === "asc"
				? aVal.localeCompare(bVal)
				: bVal.localeCompare(aVal);
		}

		if (typeof aVal === "number" && typeof bVal === "number") {
			return order === "asc" ? aVal - bVal : bVal - aVal;
		}

		return 0;
	});
}

/**
 * Filter data by search term
 */
export function filterTemplateData(
	data: TemplateData[],
	searchTerm: string,
): TemplateData[] {
	if (!searchTerm.trim()) {
		return data;
	}

	const term = searchTerm.toLowerCase();

	return data.filter(
		(item) =>
			item.id.toLowerCase().includes(term) ||
			item.title.toLowerCase().includes(term),
	);
}

/**
 * Calculate statistics from data
 */
export function calculateStats(
	data: TemplateData[],
): { total: number; average: number; max: number; min: number } {
	if (data.length === 0) {
		return { total: 0, average: 0, max: 0, min: 0 };
	}

	const values = data.map((item) => item.value);
	const total = values.reduce((sum, val) => sum + val, 0);
	const average = total / values.length;
	const max = Math.max(...values);
	const min = Math.min(...values);

	return { total, average, max, min };
}

