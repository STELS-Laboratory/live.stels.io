import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
	Activity,
	Server,
	AlertCircle,
	CheckCircle2,
	Network,
	Zap,
	Hash,
	MapPin,
	Globe,
	Cpu,
	HardDrive,
	Users,
	Target,
	Timer,
	Info,
	Circle,
	TrendingUp,
	AlertTriangle,
	BarChart3,
	Database,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useNetworkStore } from "@/stores/modules/network.store";
import type { SonarNodeData } from "@/types/auth/types";

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
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format uptime
 */
function formatUptime(seconds: number): string {
	if (seconds < 0 || seconds === 0) return "N/A";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

/**
 * Get color based on success rate
 */
function getSuccessRateColor(rate: number): string {
	if (rate >= 99.9) return "text-green-500";
	if (rate >= 99) return "text-green-400";
	if (rate >= 95) return "text-amber-500";
	return "text-red-500";
}

/**
 * Get color based on CPU load
 */
function getCpuLoadColor(load: number): string {
	if (load < 50) return "text-green-500";
	if (load < 75) return "text-amber-500";
	return "text-red-500";
}

/**
 * Get health color
 */
function getHealthColor(health: number): string {
	if (health >= 80) return "text-green-500";
	if (health >= 60) return "text-amber-500";
	return "text-red-500";
}

/**
 * Get memory usage percentage
 */
function getMemoryUsage(memory: { heapUsed: number; heapTotal: number }): number {
	if (memory.heapTotal === 0) return 0;
	return (memory.heapUsed / memory.heapTotal) * 100;
}

/**
 * Network statistics component
 * Professional document-oriented design with comprehensive system monitoring
 */
export function NetworkStats(): React.ReactElement {
	const [sonarData, setSonarData] = useState<SonarNodeData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { currentNetworkId } = useNetworkStore();

	// Read data from sessionStorage
	useEffect(() => {
		const sonarChannel = `${currentNetworkId}.runtime.sonar`;
		
		const readSonarData = (): void => {
			try {
				const data = sessionStorage.getItem(sonarChannel);
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

		readSonarData();
		const interval = setInterval(() => {
			readSonarData();
		}, 1000);

		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === sonarChannel) {
				readSonarData();
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => {
			clearInterval(interval);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [currentNetworkId]);

	// Memoized calculations
	const networkStats = useMemo(() => {
		if (!sonarData?.raw) return null;

		const { network, nodes, nodesNormalized } = sonarData.raw;
		const nodesToUse = nodesNormalized || nodes;

		// Calculate mining totals
		let totalMined = 0;
		let totalMinedSLI = 0;
		if (network.totalMined) {
			totalMined = Number.parseFloat(String(network.totalMined));
			totalMinedSLI = network.totalMinedSLI || 0;
		}

		return {
			network,
			nodes,
			nodesNormalized,
			nodesToUse,
			totalNodes: sonarData.raw.totalNodes || 0,
			totalMined,
			totalMinedSLI,
		};
	}, [sonarData]);

	if (isLoading) {
		return (
			<div className="w-full max-w-7xl mx-auto prose-professional">
				<div className="text-center text-muted-foreground py-12">
					<Activity className="h-8 w-8 animate-pulse mx-auto mb-3" />
					<p className="text-sm">Loading network statistics...</p>
				</div>
			</div>
		);
	}

	if (!sonarData || !networkStats) {
		return (
			<div className="w-full max-w-7xl mx-auto prose-professional">
				<div className="text-center text-muted-foreground py-12">
					<Network className="h-8 w-8 mx-auto mb-3 opacity-50" />
					<p className="text-sm">Network data will appear here once connected</p>
				</div>
			</div>
		);
	}

	const { network, nodes, nodesNormalized, nodesToUse, totalNodes, totalMined, totalMinedSLI } = networkStats;

	return (
		<div className="w-full max-w-7xl mx-auto prose-professional space-y-8 pb-12">
			{/* Document Header */}
			<header className="space-y-4 border-b border-border pb-6">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-foreground tracking-tight">
							Network Monitoring Dashboard
						</h1>
						<p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
							Comprehensive real-time system metrics and performance monitoring for STELS distributed infrastructure.
							All statistics reflect live operations as the network continuously processes and aggregates global market data.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-xs font-mono">
							<Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1.5" />
							Live
						</Badge>
					</div>
				</div>
			</header>

			{/* Network Health Overview */}
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-primary" />
					<h2 className="text-xl font-semibold text-foreground">Network Health Overview</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Network Health Score */}
					{network.networkHealth !== undefined && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Activity className="h-4 w-4" />
									Network Health
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className={`text-4xl font-bold ${getHealthColor(network.networkHealth)}`}>
									{network.networkHealth}
								</div>
								<Progress value={network.networkHealth} className="mt-3 h-2" />
								<p className="text-xs text-muted-foreground mt-2">Overall system health score</p>
							</CardContent>
						</Card>
					)}

					{/* Success Rate */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<CheckCircle2 className={`h-4 w-4 ${getSuccessRateColor(network.successRate)}`} />
								Success Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={`text-4xl font-bold ${getSuccessRateColor(network.successRate)}`}>
								{network.successRate.toFixed(3)}%
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								{network.averageSuccessRate && network.averageSuccessRate !== network.successRate
									? `Avg: ${network.averageSuccessRate.toFixed(3)}%`
									: "Network reliability"}
							</p>
						</CardContent>
					</Card>

					{/* Total Operations */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Activity className="h-4 w-4" />
								Operations
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">
								{formatLargeNumber(network.totalOperations)}
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								{network.totalErrors > 0 && (
									<span className="text-red-500">
										{formatLargeNumber(network.totalErrors)} errors
									</span>
								)}
								{network.totalErrors === 0 && "No errors"}
							</p>
						</CardContent>
					</Card>

					{/* Active Workers */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Zap className="h-4 w-4" />
								Workers
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">
								{network.activeWorkers}
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								{network.nodesWithActiveWorkers !== undefined && (
									<>
										{network.nodesWithActiveWorkers} nodes active ·{" "}
										{network.averageWorkersPerNode !== undefined && (
											<>Avg: {network.averageWorkersPerNode.toFixed(1)}/node</>
										)}
									</>
								)}
								{network.nodesWithActiveWorkers === undefined && `${network.totalWorkers} total`}
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Network Performance Metrics */}
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<Database className="h-5 w-5 text-primary" />
					<h2 className="text-xl font-semibold text-foreground">Performance Metrics</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Mining */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Hash className="h-4 w-4" />
								Total Mined
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{totalMined > 0 ? formatLargeNumber(totalMined) : "0"}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{totalMinedSLI > 0 ? `${totalMinedSLI.toFixed(3)} SLI` : "Mining rewards"}
							</p>
							{network.lastEpoch && (
								<p className="text-xs text-muted-foreground mt-1">
									Last Epoch: {formatLargeNumber(network.lastEpoch)}
								</p>
							)}
						</CardContent>
					</Card>

					{/* CPU Load */}
					{network.averageCpuLoad !== undefined && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Cpu className="h-4 w-4" />
									Avg CPU Load
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className={`text-2xl font-bold ${getCpuLoadColor(network.averageCpuLoad)}`}>
									{network.averageCpuLoad.toFixed(2)}%
								</div>
								<Progress value={network.averageCpuLoad} className="mt-2 h-2" />
								<p className="text-xs text-muted-foreground mt-1">Network average</p>
							</CardContent>
						</Card>
					)}

					{/* Memory */}
					{network.totalMemoryUsed !== undefined && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<HardDrive className="h-4 w-4" />
									Memory Usage
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-foreground">
									{formatBytes(network.totalMemoryUsed)}
								</div>
								{network.averageMemoryUsage !== undefined && (
									<>
										<Progress 
											value={Math.min(network.averageMemoryUsage, 100)} 
											className="mt-2 h-2" 
										/>
										<p className="text-xs text-muted-foreground mt-1">
											Avg: {network.averageMemoryUsage.toFixed(1)} MB/node
										</p>
									</>
								)}
								{network.averageMemoryUsage === undefined && (
									<p className="text-xs text-muted-foreground mt-1">Network-wide</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* P2P Connections */}
					{network.totalPeerConnections !== undefined && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Users className="h-4 w-4" />
									P2P Network
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-foreground">
									{network.totalPeerConnections}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Peer connections active
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Error Breakdown */}
				{(network.totalNetworkErrors !== undefined || network.totalCriticalErrors !== undefined) && (
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-amber-500" />
								Error Breakdown
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<div className="text-xs text-muted-foreground mb-1">Total Errors</div>
									<div className="text-lg font-semibold text-red-500">
										{network.totalErrors}
									</div>
								</div>
								{network.totalNetworkErrors !== undefined && (
									<div>
										<div className="text-xs text-muted-foreground mb-1">Network Errors</div>
										<div className="text-lg font-semibold text-amber-500">
											{network.totalNetworkErrors}
										</div>
									</div>
								)}
								{network.totalCriticalErrors !== undefined && (
									<div>
										<div className="text-xs text-muted-foreground mb-1">Critical Errors</div>
										<div className="text-lg font-semibold text-red-600">
											{network.totalCriticalErrors}
										</div>
									</div>
								)}
								{network.totalEpochParticipation !== undefined && (
									<div>
										<div className="text-xs text-muted-foreground mb-1">Epoch Participation</div>
										<div className="text-lg font-semibold text-foreground">
											{formatLargeNumber(network.totalEpochParticipation)}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</section>

			{/* Node Details */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Server className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold text-foreground">Node Details</h2>
					</div>
					<Badge variant="secondary" className="text-xs">
						{totalNodes} nodes
					</Badge>
				</div>

				<Accordion type="multiple" className="space-y-3">
					{Object.entries(nodesToUse || {}).map(([nodeId, nodeData]) => {
						const isNormalized = nodesNormalized !== undefined;
						
						let operations: { total: number; errors: number; networkErrors: number; criticalErrors: number; successRate: number } | undefined;
						let workers: { active: number; stopped: number; total: number; local: number; network: number } | undefined;
						let mining: { totalMined: string; totalMinedSLI: number; lastRewardEpoch: number } | undefined;
						let location: { ip: string; country: string; timezone: string; latitude?: number | null; longitude?: number | null } | undefined;
						let system: { cpu: { load1min: number; load5min: number; load15min: number }; memory: { heapUsed: number; heapTotal: number; external: number; rss: number }; uptime: number; version: { deno: string; v8: string; typescript: string }; pid: number; ppid: number } | undefined;
						let p2p: { peerConnections: number; onlinePeers: number; offlinePeers: number; p2pErrors: number } | undefined;
						let workerPerformance: { averageExecutionTime: number; totalExecutionTime: number; fastestExecution: number; slowestExecution: number; executionCount: number } | undefined;
						let consensus: { currentEpoch: number; epochParticipation: number; leaderElections: number; consensusErrors: number; workerOperationsTracked: number } | undefined;

						if (isNormalized) {
							const normalizedNode = nodeData as typeof nodesNormalized[string];
							operations = normalizedNode.operations;
							workers = normalizedNode.workers;
							mining = normalizedNode.mining;
							location = normalizedNode.location;
							system = normalizedNode.system;
							p2p = normalizedNode.p2p;
							workerPerformance = normalizedNode.workerPerformance;
							consensus = normalizedNode.consensus;
						} else {
							const rawNode = nodeData as typeof nodes[string];
							operations = rawNode.raw.currentNode?.operations;
							workers = rawNode.raw.currentNode?.workers || rawNode.raw.workers;
							mining = rawNode.raw.currentNode?.mining;
							location = rawNode.raw.currentNode?.location;
							system = rawNode.raw.currentNode?.system;
							p2p = rawNode.raw.currentNode?.p2p;
							workerPerformance = rawNode.raw.currentNode?.workerPerformance;
							consensus = rawNode.raw.currentNode?.consensus;
						}

						if (!operations || !workers) return null;

						const memoryUsage = system ? getMemoryUsage(system.memory) : 0;

						return (
							<AccordionItem key={nodeId} value={nodeId} className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center justify-between w-full pr-4">
										<div className="flex items-center gap-3">
											<Badge variant="outline" className="font-mono text-xs">
												{nodeId}
											</Badge>
											{operations.successRate >= 99.9 && (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											)}
											{operations.successRate < 99.9 && operations.successRate >= 99 && (
												<CheckCircle2 className="h-4 w-4 text-green-400" />
											)}
											{operations.successRate < 99 && operations.successRate >= 95 && (
												<AlertCircle className="h-4 w-4 text-amber-500" />
											)}
											{operations.successRate < 95 && (
												<AlertCircle className="h-4 w-4 text-red-500" />
											)}
											{location && (
												<div className="flex items-center gap-1 text-xs text-muted-foreground">
													<MapPin className="h-3 w-3" />
													<span>{location.country}</span>
												</div>
											)}
										</div>
										<div className={`text-sm font-semibold ${getSuccessRateColor(operations.successRate)}`}>
											{operations.successRate.toFixed(3)}%
										</div>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-4 space-y-6">
										{/* Operations & Workers Grid */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Operations */}
											<div className="space-y-3">
												<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
													<Activity className="h-4 w-4" />
													Operations
												</h3>
												<div className="grid grid-cols-2 gap-2">
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Total</div>
														<div className="text-lg font-semibold">{formatLargeNumber(operations.total)}</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Errors</div>
														<div className="text-lg font-semibold text-red-500">
															{operations.errors}
														</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Network</div>
														<div className="text-lg font-semibold">{operations.networkErrors}</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Critical</div>
														<div className="text-lg font-semibold text-red-600">
															{operations.criticalErrors}
														</div>
													</div>
												</div>
											</div>

											{/* Workers */}
											<div className="space-y-3">
												<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
													<Zap className="h-4 w-4" />
													Workers
												</h3>
												<div className="grid grid-cols-2 gap-2">
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Active</div>
														<div className="text-lg font-semibold">{workers.active}</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Total</div>
														<div className="text-lg font-semibold">{workers.total}</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Local</div>
														<div className="text-lg font-semibold">{workers.local}</div>
													</div>
													<div className="p-3 bg-muted/50 rounded border border-border/50">
														<div className="text-xs text-muted-foreground mb-1">Network</div>
														<div className="text-lg font-semibold">{workers.network}</div>
													</div>
												</div>
											</div>
										</div>

										{/* System Metrics */}
										{system && (
											<div className="space-y-4 pt-4 border-t border-border">
												<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
													<Cpu className="h-4 w-4" />
													System Metrics
												</h3>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													{/* CPU */}
													<div className="space-y-2">
														<div className="text-xs text-muted-foreground mb-2">CPU Load</div>
														<div className="space-y-2">
															<div className="flex items-center justify-between text-xs">
																<span>1 min</span>
																<span className={`font-semibold ${getCpuLoadColor(system.cpu.load1min)}`}>
																	{system.cpu.load1min.toFixed(2)}%
																</span>
															</div>
															<Progress value={system.cpu.load1min} className="h-1.5" />
															<div className="flex items-center justify-between text-xs">
																<span>5 min</span>
																<span className={`font-semibold ${getCpuLoadColor(system.cpu.load5min)}`}>
																	{system.cpu.load5min.toFixed(2)}%
																</span>
															</div>
															<Progress value={system.cpu.load5min} className="h-1.5" />
															<div className="flex items-center justify-between text-xs">
																<span>15 min</span>
																<span className={`font-semibold ${getCpuLoadColor(system.cpu.load15min)}`}>
																	{system.cpu.load15min.toFixed(2)}%
																</span>
															</div>
															<Progress value={system.cpu.load15min} className="h-1.5" />
														</div>
													</div>

													{/* Memory */}
													<div className="space-y-2">
														<div className="text-xs text-muted-foreground mb-2">Memory Usage</div>
														<div className="space-y-2">
															<div className="flex items-center justify-between text-xs">
																<span>Heap Used</span>
																<span className="font-semibold">{formatBytes(system.memory.heapUsed)}</span>
															</div>
															<Progress value={memoryUsage} className="h-1.5" />
															<div className="grid grid-cols-2 gap-2 text-xs mt-2">
																<div>
																	<span className="text-muted-foreground">Total: </span>
																	<span className="font-medium">{formatBytes(system.memory.heapTotal)}</span>
																</div>
																<div>
																	<span className="text-muted-foreground">RSS: </span>
																	<span className="font-medium">{formatBytes(system.memory.rss)}</span>
																</div>
																<div>
																	<span className="text-muted-foreground">External: </span>
																	<span className="font-medium">{formatBytes(system.memory.external)}</span>
																</div>
																<div>
																	<span className="text-muted-foreground">Usage: </span>
																	<span className="font-medium">{memoryUsage.toFixed(1)}%</span>
																</div>
															</div>
														</div>
													</div>
												</div>
												<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2">
													<div>
														<span className="text-muted-foreground">Uptime: </span>
														<span className="font-medium">{formatUptime(system.uptime)}</span>
													</div>
													<div>
														<span className="text-muted-foreground">PID: </span>
														<span className="font-medium font-mono">{system.pid}</span>
													</div>
													<div>
														<span className="text-muted-foreground">Deno: </span>
														<span className="font-medium">{system.version.deno}</span>
													</div>
													<div>
														<span className="text-muted-foreground">V8: </span>
														<span className="font-medium text-xs">{system.version.v8}</span>
													</div>
												</div>
											</div>
										)}

										{/* Mining, P2P, Consensus, Performance */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
											{/* Mining */}
											{mining && (
												<div className="space-y-3">
													<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
														<Hash className="h-4 w-4" />
														Mining
													</h3>
													<div className="grid grid-cols-2 gap-2">
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Total Mined</div>
															<div className="text-base font-semibold">
																{formatLargeNumber(Number.parseFloat(String(mining.totalMined || "0")))}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">SLI</div>
															<div className="text-base font-semibold">
																{(mining.totalMinedSLI || 0).toFixed(3)}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50 col-span-2">
															<div className="text-xs text-muted-foreground mb-1">Last Reward Epoch</div>
															<div className="text-base font-semibold">{mining.lastRewardEpoch || "N/A"}</div>
														</div>
													</div>
												</div>
											)}

											{/* P2P */}
											{p2p && (
												<div className="space-y-3">
													<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
														<Users className="h-4 w-4" />
														P2P Network
													</h3>
													<div className="grid grid-cols-2 gap-2">
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Connections</div>
															<div className="text-base font-semibold">{p2p.peerConnections}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Online</div>
															<div className="text-base font-semibold text-green-500">{p2p.onlinePeers}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Offline</div>
															<div className="text-base font-semibold text-red-500">{p2p.offlinePeers}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Errors</div>
															<div className="text-base font-semibold text-red-500">{p2p.p2pErrors}</div>
														</div>
													</div>
												</div>
											)}

											{/* Consensus */}
											{consensus && (
												<div className="space-y-3">
													<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
														<Target className="h-4 w-4" />
														Consensus
													</h3>
													<div className="grid grid-cols-2 gap-2">
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Current Epoch</div>
															<div className="text-base font-semibold">{consensus.currentEpoch}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Participation</div>
															<div className="text-base font-semibold">{consensus.epochParticipation}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Leader Elections</div>
															<div className="text-base font-semibold">{consensus.leaderElections}</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Errors</div>
															<div className={`text-base font-semibold ${consensus.consensusErrors > 0 ? "text-red-500" : "text-green-500"}`}>
																{consensus.consensusErrors}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50 col-span-2">
															<div className="text-xs text-muted-foreground mb-1">Operations Tracked</div>
															<div className="text-base font-semibold">{formatLargeNumber(consensus.workerOperationsTracked)}</div>
														</div>
													</div>
												</div>
											)}

											{/* Worker Performance */}
											{workerPerformance && (
												<div className="space-y-3">
													<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
														<Timer className="h-4 w-4" />
														Performance
													</h3>
													<div className="grid grid-cols-2 gap-2">
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Avg Execution</div>
															<div className="text-base font-semibold">
																{workerPerformance.averageExecutionTime > 0 
																	? `${workerPerformance.averageExecutionTime.toFixed(2)}ms`
																	: "N/A"}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Total Time</div>
															<div className="text-base font-semibold">
																{workerPerformance.totalExecutionTime > 0
																	? `${formatLargeNumber(workerPerformance.totalExecutionTime)}ms`
																	: "N/A"}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Fastest</div>
															<div className="text-base font-semibold text-green-500">
																{workerPerformance.fastestExecution > 0
																	? `${workerPerformance.fastestExecution.toFixed(2)}ms`
																	: "N/A"}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">Slowest</div>
															<div className="text-base font-semibold text-red-500">
																{workerPerformance.slowestExecution > 0
																	? `${workerPerformance.slowestExecution.toFixed(2)}ms`
																	: "N/A"}
															</div>
														</div>
														<div className="p-3 bg-muted/50 rounded border border-border/50 col-span-2">
															<div className="text-xs text-muted-foreground mb-1">Execution Count</div>
															<div className="text-base font-semibold">{formatLargeNumber(workerPerformance.executionCount)}</div>
														</div>
													</div>
												</div>
											)}

											{/* Location */}
											{location && (
												<div className="space-y-3">
													<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
														<Globe className="h-4 w-4" />
														Location
													</h3>
													<div className="space-y-2">
														<div className="p-3 bg-muted/50 rounded border border-border/50">
															<div className="text-xs text-muted-foreground mb-1">IP Address</div>
															<div className="text-base font-mono font-semibold">{location.ip}</div>
														</div>
														<div className="grid grid-cols-2 gap-2">
															<div className="p-3 bg-muted/50 rounded border border-border/50">
																<div className="text-xs text-muted-foreground mb-1">Country</div>
																<div className="text-base font-semibold">{location.country}</div>
															</div>
															<div className="p-3 bg-muted/50 rounded border border-border/50">
																<div className="text-xs text-muted-foreground mb-1">Timezone</div>
																<div className="text-base font-semibold">{location.timezone}</div>
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			</section>
		</div>
	);
}
