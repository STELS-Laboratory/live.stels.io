/**
 * Utility functions for AMIEditor module
 */

import type { Worker, WorkerStats } from "./types";

/**
 * Calculate statistics from workers list
 */
export const calculateWorkerStats = (workers: Worker[]): WorkerStats => {
	const stats: WorkerStats = {
		total: workers.length,
		active: 0,
		inactive: 0,
		byBrain: {},
		byType: {},
	};

	workers.forEach((worker) => {
		if (worker.value.raw.active) {
			stats.active++;
		} else {
			stats.inactive++;
		}

		// Count by SID prefix (first part before dash)
		const sid = worker.value.raw.sid;
		const prefix = sid.split("-")[0] || "unknown";
		stats.byBrain[prefix] = (stats.byBrain[prefix] || 0) + 1;

		// Count by version
		const version = worker.value.raw.version || "unknown";
		stats.byType[version] = (stats.byType[version] || 0) + 1;
	});

	return stats;
};

/**
 * Filter workers based on search term and active status
 */
export const filterWorkers = (
	workers: Worker[],
	searchTerm: string,
	filterActive: boolean | null,
): Worker[] => {
	return workers.filter((worker) => {
		// Filter by active status
		if (filterActive !== null && worker.value.raw.active !== filterActive) {
			return false;
		}

		// Filter by search term
		if (searchTerm) {
			const search = searchTerm.toLowerCase();
			const matchesSid = worker.value.raw.sid.toLowerCase().includes(search);
			const matchesNid = worker.value.raw.nid.toLowerCase().includes(search);
			const matchesNote = worker.value.raw.note
				.toLowerCase()
				.includes(search);
			const matchesVersion = worker.value.raw.version
				.toLowerCase()
				.includes(search);

			return matchesSid || matchesNid || matchesNote || matchesVersion;
		}

		return true;
	});
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp: number): string => {
	return new Date(timestamp).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Format worker interval in milliseconds to readable string
 */
export const formatInterval = (ms: number): string => {
	const seconds = ms / 1000;
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = seconds / 60;
	if (minutes < 60) {
		return `${minutes}m`;
	}
	const hours = minutes / 60;
	return `${hours}h`;
};

/**
 * Parse interval string to milliseconds
 */
export const parseInterval = (interval: string): number => {
	const value = parseInt(interval);
	const unit = interval.replace(/\d+/g, "").trim();

	switch (unit) {
		case "s":
			return value * 1000;
		case "m":
			return value * 60 * 1000;
		case "h":
			return value * 60 * 60 * 1000;
		default:
			return value;
	}
};

/**
 * Validate worker script syntax (basic)
 */
export const validateScript = (script: string): {
	valid: boolean;
	error?: string;
} => {
	try {
		// Check if script is empty
		if (!script.trim()) {
			return { valid: false, error: "Script cannot be empty" };
		}

		// Basic syntax check - try to parse as function
		new Function(script);

		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : "Invalid syntax",
		};
	}
};

