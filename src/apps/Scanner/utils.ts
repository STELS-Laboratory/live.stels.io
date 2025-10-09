/**
 * Utility functions and calculations for Scanner
 */

/**
 * Validates Wallet address format
 */
export const validateAddress = (address: string): boolean => {
	if (!address || typeof address !== "string") return false;
	const trimmedAddress = address.trim();
	return trimmedAddress.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedAddress);
};

/**
 * Format number as currency
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
 * Format currency with color based on value
 */
export const formatCurrencyWithColor = (
	value: string | number,
): { value: string; color: string } => {
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
 * Format percentage with color
 */
export const formatPercentageWithColor = (
	value: string | number,
): { value: string; color: string } => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "0%", color: "text-muted-foreground" };

	const formatted = `${(num * 100).toFixed(2)}%`;

	if (num > 0) return { value: formatted, color: "text-emerald-600" };
	if (num < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

/**
 * Format ROI with color
 */
export const formatROIWithColor = (
	entryPrice: number,
	currentPrice: number,
	side: string,
): { value: string; color: string } => {
	const roi = ((currentPrice - entryPrice) / entryPrice) * 100 *
		(side.toLowerCase() === "sell" ? -1 : 1);
	const formatted = `${roi.toFixed(2)}%`;

	if (roi > 0) return { value: formatted, color: "text-emerald-600" };
	if (roi < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

/**
 * Format number with specified decimals
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
 * Format timestamp to readable date
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
 * Professional calculations utility class
 */
export class ProfessionalCalculations {
	static formatCurrency(value: number, precision = 2): string {
		const isNegative = value < 0;
		const absValue = Math.abs(value);
		const formatted = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: precision,
			maximumFractionDigits: precision,
		}).format(absValue);
		return isNegative ? `-${formatted}` : formatted;
	}

	static formatNumber(value: number, precision = 8): string {
		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: Math.min(2, precision),
			maximumFractionDigits: precision,
		}).format(value);
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
		const percentage = previous !== 0
			? (absolute / Math.abs(previous)) * 100
			: 0;
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
		const utilizationRatio = (initial / balance) * 100;
		const marginLevel = balance / maintenance;

		let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
		if (marginLevel < 1.5) riskLevel = "CRITICAL";
		else if (marginLevel < 2.5) riskLevel = "HIGH";
		else if (marginLevel < 5) riskLevel = "MEDIUM";

		return { utilizationRatio, marginLevel, riskLevel };
	}

	static calculateWorkerEfficiency(
		workers: { active: number; stopped: number; total: number },
	): {
		efficiency: number;
		status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL";
	} {
		const efficiency = workers.total > 0
			? (workers.active / workers.total) * 100
			: 0;

		let status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL" = "CRITICAL";
		if (efficiency >= 95) status = "OPTIMAL";
		else if (efficiency >= 80) status = "GOOD";
		else if (efficiency >= 60) status = "WARNING";

		return { efficiency, status };
	}

	static formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	static getTimeDifference(timestamp1: number, timestamp2: number): string {
		const diff = Math.abs(timestamp1 - timestamp2);
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
		if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
		return `${seconds}s ago`;
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

		const currentTime = Date.now();
		const activeNodes = nodes.filter((node) => {
			const nodeTime = node.value?.timestamp || 0;
			return (currentTime - nodeTime) < 300000; // 5 minutes threshold
		}).length;

		const regions = nodes.reduce((acc, node) => {
			const location = node.value?.raw?.location;
			if (location?.country_name) {
				acc[location.country_name] = (acc[location.country_name] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>);

		const cpuUsages = nodes.map((node) => {
			const cpu = node.value?.raw?.cpu || [0, 0, 0];
			return cpu.reduce((sum: number, val: number) => sum + val, 0) /
				cpu.length;
		}).filter((usage) => usage > 0);

		const memoryUsages = nodes.map((node) => {
			const memory = node.value?.raw?.memory;
			if (!memory) return 0;
			return (memory.heapUsed / memory.heapTotal) * 100;
		}).filter((usage) => usage > 0);

		const avgCpuUsage = cpuUsages.length > 0
			? cpuUsages.reduce((sum, val) => sum + val, 0) / cpuUsages.length
			: 0;

		const avgMemoryUsage = memoryUsages.length > 0
			? memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length
			: 0;

		const healthPercentage = totalNodes > 0
			? (activeNodes / totalNodes) * 100
			: 0;
		let healthStatus: "EXCELLENT" | "GOOD" | "STABLE" | "CRITICAL" = "CRITICAL";
		if (healthPercentage >= 95) healthStatus = "EXCELLENT";
		else if (healthPercentage >= 40) healthStatus = "GOOD";
		else if (healthPercentage >= 10) healthStatus = "STABLE";

		const lastUpdate = Math.max(
			...nodes.map((node) => node.value?.timestamp || 0),
		);

		return {
			totalNodes,
			activeNodes,
			regions,
			avgCpuUsage,
			avgMemoryUsage,
			healthStatus,
			lastUpdate,
		};
	}
}
