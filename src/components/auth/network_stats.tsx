import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
	Activity,
	Server,
	AlertCircle,
	CheckCircle2,
	Coins,
	DollarSign,
	Network,
	Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SonarNodeData } from "@/types/auth/types";

const SONAR_CHANNEL = "testnet.runtime.sonar";

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(num);
}

/**
 * Format large numbers (millions, billions)
 */
function formatLargeNumber(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(2)}B`;
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(2)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(2)}K`;
	}
	return formatNumber(num);
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

/**
 * Get color based on success rate
 */
function getSuccessRateColor(rate: number): string {
	if (rate >= 99) return "text-green-500";
	if (rate >= 95) return "text-amber-500";
	return "text-red-500";
}

/**
 * Network statistics component
 * Displays real-time network data from Sonar module
 */
export function NetworkStats(): React.ReactElement {
	const [sonarData, setSonarData] = useState<SonarNodeData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Read data from sessionStorage
	useEffect(() => {
		const readSonarData = (): void => {
			try {
				const data = sessionStorage.getItem(SONAR_CHANNEL);
				if (data) {
					const parsed = JSON.parse(data) as SonarNodeData;
					setSonarData(parsed);
					setIsLoading(false);
				} else {
					setIsLoading(false);
				}
			} catch {
				setIsLoading(false);
			}
		};

		// Initial read
		readSonarData();

		// Listen for storage events (updates from WebSocket)
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === SONAR_CHANNEL) {
				readSonarData();
			}
		};

		// Poll for updates (WebSocket updates sessionStorage directly)
		const interval = setInterval(() => {
			readSonarData();
		}, 1000);

		window.addEventListener("storage", handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	// Memoized calculations
	const networkStats = useMemo(() => {
		if (!sonarData?.raw) return null;

		const { network, nodes, liquidity, coins } = sonarData.raw;

		// Calculate total liquidity across all nodes
		const totalLiquidity = liquidity || 0;

		// Get top coins by value
		const coinEntries = Object.entries(coins || {});
		const topCoins = coinEntries
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5);

		return {
			network,
			nodes,
			totalNodes: sonarData.raw.totalNodes || 0,
			totalLiquidity,
			topCoins,
			allCoins: coins,
		};
	}, [sonarData]);

	if (isLoading) {
		return (
			<div className="w-full max-w-6xl mx-auto">
				<div className="text-center text-muted-foreground py-8">
					<Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
					<p>Loading network statistics...</p>
				</div>
			</div>
		);
	}

	if (!sonarData || !networkStats) {
		return (
			<div className="w-full max-w-6xl mx-auto">
				<div className="text-center text-muted-foreground py-8">
					<Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p>Network data will appear here once connected</p>
				</div>
			</div>
		);
	}

	const { network, nodes, totalNodes, totalLiquidity, topCoins } = networkStats;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="w-full max-w-6xl mx-auto space-y-6"
		>
			{/* Description */}
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground leading-relaxed">
					Live network performance metrics from STELS distributed infrastructure. 
					All statistics reflect real-time operations as the network continuously monitors 
					and aggregates public market data from sources worldwide.
				</p>
			</div>

			{/* Network Overview */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-card/80 border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Server className="h-4 w-4" />
							Total Nodes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold text-foreground">
							{totalNodes}
						</div>
						<p className="text-xs text-muted-foreground mt-1">Active network nodes</p>
					</CardContent>
				</Card>

				<Card className="bg-card/80 border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Zap className="h-4 w-4" />
							Active Workers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold text-foreground">
							{formatLargeNumber(network.activeWorkers)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{network.totalWorkers} total workers
						</p>
					</CardContent>
				</Card>

				<Card className="bg-card/80 border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Operations
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold text-foreground">
							{formatLargeNumber(network.totalOperations)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{formatLargeNumber(network.totalErrors)} errors
						</p>
					</CardContent>
				</Card>

				<Card className="bg-card/80 border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<CheckCircle2
								className={`h-4 w-4 ${getSuccessRateColor(network.successRate)}`}
							/>
							Success Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-2xl sm:text-3xl font-bold ${getSuccessRateColor(network.successRate)}`}
						>
							{network.successRate.toFixed(2)}%
						</div>
						<p className="text-xs text-muted-foreground mt-1">Network reliability</p>
					</CardContent>
				</Card>
			</div>

			{/* Liquidity & Assets */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				<Card className="bg-card/80 border-border">
					<CardHeader>
						<CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
							<DollarSign className="h-5 w-5 text-primary" />
							Total Liquidity
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
							{formatCurrency(totalLiquidity)}
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Top Assets</span>
							</div>
							<div className="space-y-2">
								{topCoins.map(([coin, amount]) => (
									<div
										key={coin}
										className="flex items-center justify-between p-2 bg-muted/50 rounded"
									>
										<div className="flex items-center gap-2">
											<Coins className="h-4 w-4 text-amber-500" />
											<span className="font-medium">{coin}</span>
										</div>
										<span className="text-sm font-semibold">
											{formatNumber(amount)}
										</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/80 border-border">
					<CardHeader>
						<CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
							<Server className="h-5 w-5 text-primary" />
							Network Nodes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3 max-h-[400px] overflow-y-auto">
							{Object.entries(nodes).map(([nodeId, nodeData]) => {
								const { raw } = nodeData;
								const { operations, workers } = raw.currentNode || raw;

								return (
									<motion.div
										key={nodeId}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										className="p-3 bg-muted/50 rounded border border-border/50"
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="font-mono text-xs">
													{nodeId}
												</Badge>
												{operations.successRate >= 99 && (
													<CheckCircle2 className="h-4 w-4 text-green-500" />
												)}
												{operations.successRate < 99 && operations.successRate >= 95 && (
													<AlertCircle className="h-4 w-4 text-amber-500" />
												)}
												{operations.successRate < 95 && (
													<AlertCircle className="h-4 w-4 text-red-500" />
												)}
											</div>
											<span
												className={`text-xs font-semibold ${getSuccessRateColor(operations.successRate)}`}
											>
												{operations.successRate.toFixed(1)}%
											</span>
										</div>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div>
												<span className="text-muted-foreground">Workers: </span>
												<span className="font-medium">{workers.active}</span>
											</div>
											<div>
												<span className="text-muted-foreground">Ops: </span>
												<span className="font-medium">
													{formatLargeNumber(operations.total)}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground">Errors: </span>
												<span className="font-medium text-red-500">
													{formatLargeNumber(operations.errors)}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground">Liquidity: </span>
												<span className="font-medium">
													{formatCurrency(raw.liquidity || 0)}
												</span>
											</div>
										</div>
									</motion.div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			</div>
		</motion.div>
	);
}

