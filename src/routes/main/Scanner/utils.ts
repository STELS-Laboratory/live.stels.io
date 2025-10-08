/**
 * Scanner utility functions
 * Formatting, validation, and calculation utilities
 */

/**
 * Validates wallet address format
 */
export const validateAddress = (address: string): boolean => {
	if (!address || typeof address !== "string") return false;
	const trimmedAddress = address.trim();
	return trimmedAddress.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedAddress);
};

/**
 * Formats currency values
 */
export const formatCurrency = (value: string | number): string => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "$0.00";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

/**
 * Formats currency with color based on value
 */
export const formatCurrencyWithColor = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "$0.00", color: "text-muted-foreground" };

	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);

	if (num > 0) return { value: formatted, color: "text-emerald-600" };
	if (num < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

/**
 * Formats percentage with color
 */
export const formatPercentageWithColor = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "0%", color: "text-muted-foreground" };

	const formatted = `${(num * 100).toFixed(2)}%`;

	if (num > 0) return { value: formatted, color: "text-emerald-600" };
	if (num < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

/**
 * Calculates and formats ROI with color
 */
export const formatROIWithColor = (
	entryPrice: number,
	currentPrice: number,
	side: string,
) => {
	const roi = ((currentPrice - entryPrice) / entryPrice) * 100 *
		(side.toLowerCase() === "sell" ? -1 : 1);
	const formatted = `${roi.toFixed(2)}%`;

	if (roi > 0) return { value: formatted, color: "text-emerald-600" };
	if (roi < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

/**
 * Formats numbers with decimal places
 */
export const formatNumber = (value: string | number, decimals = 4): string => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0";

	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num);
};

/**
 * Formats timestamp to readable date
 */
export const formatDate = (timestamp: number | string): string => {
	const date = new Date(
		typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp,
	);
	return date.toLocaleString("en-US", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
};

/**
 * Professional calculations class for financial metrics
 */
export class ProfessionalCalculations {
	static formatCurrency(value: number, precision = 2): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: precision,
			maximumFractionDigits: precision,
		}).format(value);
	}

	static formatNumber(value: number, precision = 8): string {
		return value.toFixed(precision);
	}

	static formatPercentage(value: number, precision = 2): string {
		return `${value >= 0 ? "+" : ""}${value.toFixed(precision)}%`;
	}

	static calculatePnL(
		current: number,
		previous: number,
	): {
		absolute: number;
		percentage: number;
		isProfit: boolean;
	} {
		const absolute = current - previous;
		const percentage = previous !== 0 ? (absolute / previous) * 100 : 0;

		return {
			absolute,
			percentage,
			isProfit: absolute >= 0,
		};
	}

	static calculateMarginRatio(
		balance: number,
		initial: number,
		maintenance: number,
	): {
		utilizationRatio: number;
		marginLevel: number;
		riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	} {
		const utilizationRatio = balance !== 0 ? (initial / balance) * 100 : 0;
		const marginLevel = maintenance !== 0 ? (balance / maintenance) * 100 : 0;
		let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

		if (marginLevel < 110) riskLevel = "CRITICAL";
		else if (marginLevel < 150) riskLevel = "HIGH";
		else if (marginLevel < 200) riskLevel = "MEDIUM";

		return { utilizationRatio, marginLevel, riskLevel };
	}

	static calculateWorkerEfficiency(workers: {
		active: number;
		stopped: number;
		total: number;
	}): {
		efficiency: number;
		status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL";
	} {
		const efficiency = workers.total !== 0
			? (workers.active / workers.total) * 100
			: 0;
		let status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL" = "OPTIMAL";

		if (efficiency < 50) status = "CRITICAL";
		else if (efficiency < 70) status = "WARNING";
		else if (efficiency < 90) status = "GOOD";

		return { efficiency, status };
	}

	static formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	static getTimeDifference(timestamp1: number, timestamp2: number): string {
		const diff = Math.abs(timestamp1 - timestamp2);
		const minutes = Math.floor(diff / 60000);

		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	static analyzeNetworkNodes(nodeMap: Record<string, any>): {
		totalNodes: number;
		activeNodes: number;
		regions: Record<string, number>;
		avgCpuUsage: number;
		avgMemoryUsage: number;
		healthStatus: "EXCELLENT" | "GOOD" | "STABLE" | "CRITICAL";
		lastUpdate: number;
	} {
		const nodes = Object.values(nodeMap);
		const totalNodes = nodes.length;
		const activeNodes = nodes.filter((n: any) => n.status === "active").length;
		const regions: Record<string, number> = {};

		let totalCpu = 0;
		let totalMemory = 0;
		let latestUpdate = 0;

		nodes.forEach((node: any) => {
			const region = node.region || "unknown";
			regions[region] = (regions[region] || 0) + 1;
			totalCpu += node.cpuUsage || 0;
			totalMemory += node.memoryUsage || 0;
			if (node.lastUpdate > latestUpdate) latestUpdate = node.lastUpdate;
		});

		const avgCpuUsage = totalNodes > 0 ? totalCpu / totalNodes : 0;
		const avgMemoryUsage = totalNodes > 0 ? totalMemory / totalNodes : 0;
		const activeRatio = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;

		let healthStatus: "EXCELLENT" | "GOOD" | "STABLE" | "CRITICAL" =
			"EXCELLENT";
		if (activeRatio < 50) healthStatus = "CRITICAL";
		else if (activeRatio < 75) healthStatus = "STABLE";
		else if (activeRatio < 95) healthStatus = "GOOD";

		return {
			totalNodes,
			activeNodes,
			regions,
			avgCpuUsage,
			avgMemoryUsage,
			healthStatus,
			lastUpdate: latestUpdate,
		};
	}
}

