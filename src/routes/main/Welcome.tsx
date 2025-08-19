import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Activity,
	Calculator,
	DollarSign,
	Globe,
	MapPin,
	Shield,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { cn, filterSession } from "@/lib/utils";
import Loader from "@/components/ui/loader.tsx";
import Markets from "@/routes/main/Markets.tsx";
import React from "react";

class ProfessionalCalculations {
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

/**
 * Welcome dashboard component with professional trading analytics
 */
function Welcome(): React.ReactElement | null {
	interface WelcomeSessionData {
		[key: string]: {
			raw: {
				liquidity: number;
				available: number;
				margin: {
					balance: number;
					initial: number;
					maintenance: number;
				};
				protection: number;
				coins: Record<string, number>;
				rate: number;
				timestamp: number;
				exchanges: string[];
				accounts: unknown[];
				workers: {
					active: number;
					stopped: number;
					total: number;
				};
			};
		};
	}

	const session = useSessionStoreSync() as WelcomeSessionData | null;

	if (
		!session || !session["testnet.snapshot.sonar"] ||
		!session["testnet.runtime.sonar"]
	) {
		return <Loader>Scanning connection Testnet</Loader>;
	}

	const netMap = filterSession(session || {}, /\.heterogen\..*\.setting$/);

	const snapshot = session["testnet.snapshot.sonar"];
	const runtime = session["testnet.runtime.sonar"];

	const calc = ProfessionalCalculations;

	const liquidityPnL = calc.calculatePnL(
		runtime.raw.liquidity,
		snapshot.raw.liquidity,
	);
	const availablePnL = calc.calculatePnL(
		runtime.raw.available,
		snapshot.raw.available,
	);
	const marginPnL = calc.calculatePnL(
		runtime.raw.margin.balance,
		snapshot.raw.margin.balance,
	);
	const protectionPnL = calc.calculatePnL(
		runtime.raw.protection,
		snapshot.raw.protection,
	);

	// const coinChanges = Object.keys(runtime.raw.coins).reduce(
	// 	(acc, coin) => {
	// 		const current =
	// 			runtime.raw.coins[coin as keyof typeof runtime.raw.coins] || 0;
	// 		const previous =
	// 			snapshot.raw.coins[coin as keyof typeof snapshot.raw.coins] || 0;
	// 		acc[coin] = calc.calculatePnL(current, previous);
	// 		return acc;
	// 	},
	// 	{} as Record<string, ReturnType<typeof calc.calculatePnL>>,
	// );

	const marginAnalysis = calc.calculateMarginRatio(
		runtime.raw.margin.balance,
		runtime.raw.margin.initial,
		runtime.raw.margin.maintenance,
	);
	const workerAnalysis = calc.calculateWorkerEfficiency(runtime.raw.workers);
	const networkAnalysis = calc.analyzeNetworkNodes(netMap);

	const totalROI = calc.calculatePnL(
		runtime.raw.liquidity,
		snapshot.raw.liquidity,
	);

	return (
		<>
			<div className="container m-auto gap-4 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<Globe className="w-5 h-5 mr-2" />
							NETWORK NODES STATUS
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-w-0 overflow-hidden">
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">
									TOTAL HETEROGENS
								</div>
								<div className="text-2xl font-bold text-white mb-1">
									{networkAnalysis.totalNodes}
								</div>
								<div className="text-xs text-gray-400">
									distributed globally
								</div>
							</div>

							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">ACTIVE NODES</div>
								<div className="text-2xl font-bold text-emerald-400 mb-1">
									{networkAnalysis.activeNodes}
								</div>
								<div className="text-xs text-emerald-400">
									{networkAnalysis.totalNodes > 0
										? ((networkAnalysis.activeNodes /
											networkAnalysis.totalNodes) * 100).toFixed(1)
										: 0}% online
								</div>
							</div>

							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">NETWORK HEALTH</div>
								<Badge
									variant="outline"
									className={cn(
										"text-sm px-3 py-1",
										networkAnalysis.healthStatus === "EXCELLENT" &&
											"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
										networkAnalysis.healthStatus === "GOOD" &&
											"border-blue-500/30 bg-blue-500/10 text-blue-400",
										networkAnalysis.healthStatus === "STABLE" &&
											"border-amber-500/30 bg-amber-500/10 text-amber-400",
										networkAnalysis.healthStatus === "CRITICAL" &&
											"border-red-500/30 bg-red-500/10 text-red-400",
									)}
								>
									{networkAnalysis.healthStatus}
								</Badge>
								<div className="text-xs text-gray-400 mt-1">
									overall status
								</div>
							</div>

							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">REGIONS</div>
								<div className="text-sm font-medium text-blue-400">
									{Object.keys(networkAnalysis.regions).length}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									countries
								</div>
							</div>
						</div>

						{/* Regional Distribution */}
						<div className="mt-6 pt-4 border-t  min-w-0 overflow-hidden">
							<div className="text-xs text-gray-400 mb-3">
								REGIONAL DISTRIBUTION
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 min-w-0 overflow-hidden">
								{Object.entries(networkAnalysis.regions)
									.sort(([, a], [, b]) => b - a)
									.slice(0, 8)
									.map(([country, count]) => (
										<div
											key={country}
											className="flex items-center justify-between text-xs min-w-0"
										>
											<div className="flex items-center min-w-0 overflow-hidden">
												<MapPin className="w-3 h-3 mr-1 text-gray-400" />
												<span className="text-gray-300 truncate">
													{country}
												</span>
											</div>
											<Badge
												variant="outline"
												className="text-xs px-2 py-0.5 border-gray-600 text-gray-300"
											>
												{count}
											</Badge>
										</div>
									))}
							</div>
						</div>
						
					</CardContent>
				</Card>

				{/* Key Performance Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
					{/* Total Liquidity */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<Wallet className="w-4 h-4 mr-2" />
								TOTAL LIQUIDITY
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{calc.formatCurrency(runtime.raw.liquidity)}
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									liquidityPnL.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{liquidityPnL.isProfit
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatCurrency(liquidityPnL.absolute)}
								<span className="ml-1">
									({calc.formatPercentage(liquidityPnL.percentage)})
								</span>
							</div>
							<div className="text-xs text-gray-500 mt-1">
								vs previous snapshot
							</div>
						</CardContent>
					</Card>

					{/* Available Balance */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<DollarSign className="w-4 h-4 mr-2" />
								AVAILABLE BALANCE
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{calc.formatCurrency(runtime.raw.available)}
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									availablePnL.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{availablePnL.isProfit
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatCurrency(availablePnL.absolute)}
								<span
									className={cn(
										"ml-1",
										availablePnL.isProfit ? "text-emerald-400" : "text-red-400",
									)}
								>
									({calc.formatPercentage(availablePnL.percentage)})
								</span>
							</div>
							<div className="text-xs text-gray-500 mt-1">
								<span className="text-blue-400 font-medium">
									{((runtime.raw.available / runtime.raw.liquidity) * 100)
										.toFixed(1)}%
								</span>{" "}
								of total liquidity
							</div>
						</CardContent>
					</Card>

					{/* Portfolio ROI */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<Target className="w-4 h-4 mr-2" />
								PORTFOLIO ROI
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div
								className={cn(
									"text-2xl font-bold mb-2",
									totalROI.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{calc.formatPercentage(totalROI.percentage, 3)}
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									totalROI.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{totalROI.isProfit
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatCurrency(totalROI.absolute)}
							</div>
							<div className="text-xs text-gray-500 mt-1">unrealized P&L</div>
						</CardContent>
					</Card>

					{/* Performance Rate */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<Activity className="w-4 h-4 mr-2" />
								PERFORMANCE RATE
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{(runtime.raw.rate * 100).toFixed(3)}%
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									runtime.raw.rate > snapshot.raw.rate
										? "text-emerald-400"
										: "text-red-400",
								)}
							>
								{runtime.raw.rate > snapshot.raw.rate
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatPercentage(
									((runtime.raw.rate - snapshot.raw.rate) / snapshot.raw.rate) *
										100,
									3,
								)}
							</div>
							<div className="text-xs text-gray-500 mt-1">vs previous rate</div>
						</CardContent>
					</Card>
				</div>
				
				{/* Protection & Risk Management */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<Shield className="w-5 h-5 mr-2" />
							PROTECTION & RISK MANAGEMENT
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">
									PROTECTION VALUE
								</div>
								<div
									className={cn(
										"text-2xl font-bold mb-1",
										runtime.raw.protection >= 0
											? "text-emerald-400"
											: "text-red-400",
									)}
								>
									{calc.formatCurrency(runtime.raw.protection)}
								</div>
								<div
									className={cn(
										"text-xs flex items-center justify-center",
										protectionPnL.isProfit
											? "text-emerald-400"
											: "text-red-400",
									)}
								>
									{protectionPnL.isProfit
										? <TrendingUp className="w-3 h-3 mr-1" />
										: <TrendingDown className="w-3 h-3 mr-1" />}
									{calc.formatCurrency(protectionPnL.absolute)}
								</div>
							</div>
							
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">RISK LEVEL</div>
								<Badge
									variant="outline"
									className={cn(
										"text-sm px-3 py-1",
										marginAnalysis.riskLevel === "LOW" &&
										"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
										marginAnalysis.riskLevel === "MEDIUM" &&
										"border-amber-500/30 bg-amber-500/10 text-amber-400",
										marginAnalysis.riskLevel === "HIGH" &&
										"border-orange-500/30 bg-orange-500/10 text-orange-400",
										marginAnalysis.riskLevel === "CRITICAL" &&
										"border-red-500/30 bg-red-500/10 text-red-400",
									)}
								>
									{marginAnalysis.riskLevel}
								</Badge>
								<div className="text-xs text-gray-400 mt-1">
									based on margin
								</div>
							</div>
							
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">EXCHANGE</div>
								<div className="text-sm font-medium text-amber-400">
									{runtime.raw.exchanges[0].toUpperCase()}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									primary exchange
								</div>
							</div>
							
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">ACCOUNTS</div>
								<div className="text-sm font-medium text-blue-400">
									{runtime.raw.accounts.length}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									active accounts
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
				
				{/* Advanced Analytics Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
					{/* Margin Analysis */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Calculator className="w-5 h-5 mr-2" />
								MARGIN ANALYSIS
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-xs text-gray-400 mb-1">BALANCE</div>
									<div className="text-lg font-bold text-white">
										{calc.formatCurrency(runtime.raw.margin.balance)}
									</div>
									<div
										className={cn(
											"text-xs",
											marginPnL.isProfit ? "text-emerald-400" : "text-red-400",
										)}
									>
										{calc.formatCurrency(marginPnL.absolute)}{" "}
										({calc.formatPercentage(marginPnL.percentage)})
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">MARGIN LEVEL</div>
									<div className="text-lg font-bold text-white">
										{marginAnalysis.marginLevel.toFixed(2)}×
									</div>
									<Badge
										variant="outline"
										className={cn(
											"text-xs",
											marginAnalysis.riskLevel === "LOW" &&
												"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
											marginAnalysis.riskLevel === "MEDIUM" &&
												"border-amber-500/30 bg-amber-500/10 text-amber-400",
											marginAnalysis.riskLevel === "HIGH" &&
												"border-orange-500/30 bg-orange-500/10 text-orange-400",
											marginAnalysis.riskLevel === "CRITICAL" &&
												"border-red-500/30 bg-red-500/10 text-red-400",
										)}
									>
										{marginAnalysis.riskLevel}
									</Badge>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm text-gray-400">
										UTILIZATION RATIO
									</span>
									<span
										className={cn(
											"text-sm font-mono",
											marginAnalysis.utilizationRatio > 80
												? "text-red-400"
												: marginAnalysis.utilizationRatio > 60
												? "text-amber-400"
												: "text-emerald-400",
										)}
									>
										{marginAnalysis.utilizationRatio.toFixed(2)}%
									</span>
								</div>
								<Progress
									value={marginAnalysis.utilizationRatio}
									className="h-2"
								/>
							</div>

							<div className="pt-2 space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-gray-400">Initial Margin:</span>
									<span className="text-white font-mono">
										{calc.formatCurrency(runtime.raw.margin.initial)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Maintenance:</span>
									<span className="text-white font-mono">
										{calc.formatCurrency(runtime.raw.margin.maintenance)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Worker Optimization */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Users className="w-5 h-5 mr-2" />
								WORKER OPTIMIZATION
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-4 text-center">
								<div>
									<div className="text-xs text-gray-400 mb-1">ACTIVE</div>
									<div className="text-2xl font-bold text-emerald-400">
										{runtime.raw.workers.active}
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">STOPPED</div>
									<div className="text-2xl font-bold text-red-400">
										{runtime.raw.workers.stopped}
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">TOTAL</div>
									<div className="text-2xl font-bold text-white">
										{runtime.raw.workers.total}
									</div>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm text-gray-400">EFFICIENCY</span>
									<div className="flex items-center space-x-2">
										<span
											className={cn(
												"text-sm font-mono",
												workerAnalysis.efficiency >= 95
													? "text-emerald-400"
													: workerAnalysis.efficiency >= 80
													? "text-blue-400"
													: workerAnalysis.efficiency >= 60
													? "text-amber-400"
													: "text-red-400",
											)}
										>
											{workerAnalysis.efficiency.toFixed(1)}%
										</span>
										<Badge
											variant="outline"
											className={cn(
												"text-xs",
												workerAnalysis.status === "OPTIMAL" &&
													"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
												workerAnalysis.status === "GOOD" &&
													"border-blue-500/30 bg-blue-500/10 text-blue-400",
												workerAnalysis.status === "WARNING" &&
													"border-amber-500/30 bg-amber-500/10 text-amber-400",
												workerAnalysis.status === "CRITICAL" &&
													"border-red-500/30 bg-red-500/10 text-red-400",
											)}
										>
											{workerAnalysis.status}
										</Badge>
									</div>
								</div>
								<Progress
									value={workerAnalysis.efficiency}
									className="h-2 bg-gray-800"
								/>
							</div>

							<div className="pt-2">
								<div className="text-xs text-gray-400 mb-2">
									PERFORMANCE INSIGHTS
								</div>
								<div className="space-y-1 text-xs">
									<div className="flex justify-between">
										<span className="text-gray-400">Uptime:</span>
										<span className="text-white">
											{workerAnalysis.efficiency.toFixed(1)}%
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Avg. Load:</span>
										<span className="text-white">
											{((runtime.raw.workers.active /
												runtime.raw.workers.total) * 100).toFixed(1)}%
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Markets />
			</div>
		</>
	);
}

export default Welcome;
