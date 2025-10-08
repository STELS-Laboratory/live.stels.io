import {
	type ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
	Activity,
	ChevronDown,
	ChevronRight,
	Eye,
	EyeOff,
	Globe as GlobeIcon,
	MapPin,
	Network,
	RefreshCw,
	Server,
	Shield,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";

import globeImage from "@/assets/stels-ai.jpg";

interface LocationData {
	latitude: number;
	longitude: number;
	name: string;
	ip: string;
	network: string;
	version: string;
	city: string;
	region: string | null;
	region_code: string | null;
	country: string;
	country_name: string;
	country_code: string;
	country_code_iso3: string;
	country_capital: string;
	country_tld: string;
	continent_code: string;
	in_eu: boolean;
	postal: string;
	timezone: string;
	utc_offset: string;
	country_calling_code: string;
	currency: string;
	currency_name: string;
	languages: string;
	country_area: number;
	country_population: number;
	asn: string;
	org: string;
}

interface ConfigData {
	network: string;
	title: string;
	type: string;
	brain: string;
	tick: number;
	limit: boolean;
	connectors: string[];
	markets: string[];
	dns: {
		public: boolean;
		hetNet: {
			socket: string;
			protocol: string;
		};
	};
}

interface NodeData {
	name: string;
	location: LocationData;
	config: ConfigData;
}

interface CountEntry {
	name: string;
	count: number;
}

interface NetworkStats {
	totalNodes: number;
	uniqueNetworks: number;
	uniqueCountries: number;
	topNetworks: CountEntry[];
	topCountries: CountEntry[];
	versions: CountEntry[];
}

interface SessionItem {
	key: string;
	value: {
		raw: {
			location: LocationData;
			network: string;
			name: string;
			protocol: string;
		};
	};
}

interface NetworkHealth {
	status: "excellent" | "good" | "warning" | "critical";
	uptime: number;
	latency: number;
	connections: number;
}

/**
 * Parse network data into node structure for Globe visualization
 */
function parseNodeData(data: unknown[]): NodeData[] {
	const nodeMap: Record<string, Partial<NodeData>> = {};

	data.forEach((item) => {
		try {
			const sessionItem = item as SessionItem;
			const nodeName = sessionItem.key;

			if (!nodeName || !sessionItem.value?.raw) {
				return; // Skip invalid items
			}

			if (!nodeMap[nodeName]) {
				nodeMap[nodeName] = { name: nodeName };
			}

			const node = nodeMap[nodeName];

			// Safely assign properties with fallbacks
			node.location = sessionItem.value.raw.location || {
				latitude: 0,
				longitude: 0,
				name: nodeName,
				ip: "Unknown",
				network: "Unknown",
				version: "Unknown",
				city: "Unknown",
				region: null,
				region_code: null,
				country: "Unknown",
				country_name: "Unknown",
				country_code: "Unknown",
				country_code_iso3: "Unknown",
				country_capital: "Unknown",
				country_tld: "Unknown",
				continent_code: "Unknown",
				in_eu: false,
				postal: "Unknown",
				timezone: "Unknown",
				utc_offset: "Unknown",
				country_calling_code: "Unknown",
				currency: "Unknown",
				currency_name: "Unknown",
				languages: "Unknown",
				country_area: 0,
				country_population: 0,
				asn: "Unknown",
				org: "Unknown",
			};

			node.config = {
				title: "Unknown",
				type: "Unknown",
				brain: "Unknown",
				tick: 0,
				limit: false,
				connectors: [],
				markets: [],
				dns: {
					public: false,
					hetNet: {
						socket: "Unknown",
						protocol: "Unknown",
					},
				},
				...sessionItem.value.raw,
				network: sessionItem.value.raw.network || "Unknown",
			} as ConfigData;
		} catch (error) {
			console.warn("Error parsing node item:", error);
		}
	});

	return Object.values(nodeMap).filter((node) =>
		node.location && node.config
	) as NodeData[];
}

/**
 * Generate mock network health data
 */
function generateNetworkHealth(): NetworkHealth {
	const random = Math.random();
	let status: NetworkHealth["status"] = "excellent";

	if (random < 0.1) status = "critical";
	else if (random < 0.3) status = "warning";
	else if (random < 0.7) status = "good";

	return {
		status,
		uptime: Math.random() * 100,
		latency: Math.random() * 200 + 10,
		connections: Math.floor(Math.random() * 1000) + 50,
	};
}

/**
 * Get status badge variant
 */
function getStatusBadgeVariant(
	status: NetworkHealth["status"],
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "excellent":
			return "default";
		case "good":
			return "secondary";
		case "warning":
			return "outline";
		case "critical":
			return "destructive";
		default:
			return "outline";
	}
}

// HeterogenComponent
const HeterogenComponent = (): ReactElement => {
	const globeEl = useRef<GlobeMethods | undefined>(undefined);
	const [nodes, setNodes] = useState<NodeData[]>([]);
	const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
	const [isGlobeVisible, setIsGlobeVisible] = useState(true);
	const [isAutoRotate, setIsAutoRotate] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	const session = useSessionStoreSync() as
		| Record<string, { value: { raw: { nodes: unknown[] } } }>
		| null;

	const netMap = useMemo(
		() => filterSession(session || {}, /\.heterogen\..*\.setting$/),
		[session],
	);

	useEffect(() => {
		try {
			const parsedNodes = parseNodeData(netMap);
			// Create new objects to avoid extensibility issues
			const safeNodes = parsedNodes.map((node) => ({
				...node,
				config: {
					...node.config,
					connectors: node.config.connectors || [],
					markets: node.config.markets || [],
				},
			}));
			setNodes(safeNodes);
		} catch (error) {
			console.error("Error parsing node data:", error);
			setNodes([]);
		}
	}, [netMap]);

	useEffect(() => {
		// Auto-rotate
		const controls = globeEl.current?.controls();
		if (controls) {
			controls.autoRotate = isAutoRotate;
			controls.autoRotateSpeed = 0.1;
		}
	}, [isAutoRotate]);

	const handleNodeClick = useCallback((node: NodeData) => {
		setSelectedNode(node);
	}, []);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		// Simulate refresh delay
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const parsedNodes = parseNodeData(netMap);
		setNodes(parsedNodes);
		setIsRefreshing(false);
	}, [netMap]);

	const toggleNodeExpansion = useCallback((nodeName: string) => {
		setExpandedNodes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(nodeName)) {
				newSet.delete(nodeName);
			} else {
				newSet.add(nodeName);
			}
			return newSet;
		});
	}, []);

	const stats: NetworkStats = useMemo(() => {
		const totalNodes = nodes.length;

		const countBy = (items: string[]): CountEntry[] => {
			const map = new Map<string, number>();
			items.forEach((key) => {
				if (!key) return;
				map.set(key, (map.get(key) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([name, count]) => ({ name, count }))
				.sort((a, b) => b.count - a.count);
		};

		const networks = countBy(nodes.map((n) => n.config.network || "Unknown"));
		const countries = countBy(
			nodes.map((n) => n.location.country_name || "Unknown"),
		);
		const versions = countBy(nodes.map((n) => n.location.version || "Unknown"));

		return {
			totalNodes,
			uniqueNetworks: networks.length,
			uniqueCountries: countries.length,
			topNetworks: networks.slice(0, 4),
			topCountries: countries.slice(0, 6),
			versions: versions.slice(0, 4),
		};
	}, [nodes]);

	// Node Details Component
	const NodeDetailsPanel = ({ node }: { node: NodeData }) => {
		const health = generateNetworkHealth();
		const isExpanded = expandedNodes.has(node.name);

		return (
			<Card className="mb-0 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
								<Server className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
							</div>
							<div>
								<CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row items-start sm:items-center gap-2">
									<span className="truncate max-w-[200px] sm:max-w-none">
										{node.name}
									</span>
									<Badge
										variant={getStatusBadgeVariant(health.status)}
										className="text-xs bg-white/10 border-white/20"
									>
										{health.status.toUpperCase()}
									</Badge>
								</CardTitle>
								<p className="text-xs sm:text-sm text-zinc-300">
									{node.location.city}, {node.location.country_name}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => toggleNodeExpansion(node.name)}
								className="flex items-center gap-1 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
							>
								{isExpanded
									? <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
									: <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
								<span className="hidden sm:inline">
									{isExpanded ? "Collapse" : "Expand"}
								</span>
								<span className="sm:hidden text-xs">
									{isExpanded ? "−" : "+"}
								</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSelectedNode(null)}
								className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
							>
								<X className="w-3 h-3 sm:w-4 sm:h-4" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 sm:space-y-4">
					{/* Network Health */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
						<div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
							<div className="text-xs text-zinc-300 mb-1">UPTIME</div>
							<div className="text-sm sm:text-lg font-bold text-emerald-400">
								{health.uptime.toFixed(1)}%
							</div>
						</div>
						<div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
							<div className="text-xs text-zinc-300 mb-1">LATENCY</div>
							<div className="text-sm sm:text-lg font-bold text-blue-400">
								{health.latency.toFixed(0)}ms
							</div>
						</div>
						<div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
							<div className="text-xs text-zinc-300 mb-1">
								CONNECTIONS
							</div>
							<div className="text-sm sm:text-lg font-bold text-amber-400">
								{health.connections}
							</div>
						</div>
						<div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
							<div className="text-xs text-zinc-300 mb-1">STATUS</div>
							<Badge
								variant={getStatusBadgeVariant(health.status)}
								className="text-xs bg-white/10 border-white/20"
							>
								{health.status.toUpperCase()}
							</Badge>
						</div>
					</div>

					{/* Basic Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
								<span className="text-xs sm:text-sm font-medium text-zinc-200">
									Location
								</span>
							</div>
							<div className="text-xs sm:text-sm text-zinc-300 pl-5 sm:pl-6">
								{node.location.city}, {node.location.region || "Unknown"},{" "}
								{node.location.country_name}
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Network className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
								<span className="text-xs sm:text-sm font-medium text-zinc-200">
									Network
								</span>
							</div>
							<div className="text-xs sm:text-sm text-zinc-300 pl-5 sm:pl-6">
								{node.config.network}
							</div>
						</div>
					</div>

					{/* Expanded Details */}
					{isExpanded && (
						<div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div className="space-y-2 sm:space-y-3">
									<h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
										<Shield className="w-3 h-3 sm:w-4 sm:h-4" />
										Network Details
									</h4>
									<div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
										<div className="flex justify-between">
											<span className="text-zinc-400">IP Address:</span>
											<span className="font-mono text-zinc-200">
												{node.location.ip || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">ASN:</span>
											<span className="font-mono text-zinc-200">
												{node.location.asn || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">
												Organization:
											</span>
											<span className="font-mono text-xs text-zinc-200">
												{node.location.org || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Timezone:</span>
											<span className="text-zinc-200">
												{node.location.timezone || "Unknown"}
											</span>
										</div>
									</div>
								</div>
								<div className="space-y-2 sm:space-y-3">
									<h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
										<Activity className="w-3 h-3 sm:w-4 sm:h-4" />
										Configuration
									</h4>
									<div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
										<div className="flex justify-between">
											<span className="text-zinc-400">Type:</span>
											<span className="text-zinc-200">
												{node.config.type || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Brain:</span>
											<span className="text-zinc-200">
												{node.config.brain || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Tick:</span>
											<span className="text-zinc-200">
												{node.config.tick || 0}ms
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Connectors:</span>
											<span className="text-zinc-200">
												{node.config.connectors?.length || 0}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	// Show loading state if no nodes
	if (nodes.length === 0) {
		return (
			<div className="relative w-full h-[100%] bg-black overflow-hidden flex items-center justify-center p-4">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl max-w-sm w-full">
					<CardContent className="p-4 sm:p-6 text-center">
						<div className="text-amber-400 mb-2 text-sm sm:text-base">
							Loading Network Data...
						</div>
						<div className="text-xs sm:text-sm text-zinc-300">
							Connecting to heterogen nodes
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="relative w-full h-[100%] bg-black overflow-hidden">
			{/* Mobile Header */}
			<div className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
				<div className="flex items-center justify-between p-3">
					<div className="flex items-center gap-2">
						<Network className="w-5 h-5 text-amber-400" />
						<span className="text-white font-semibold text-sm">
							Heterogen Network
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className="text-xs bg-white/10 border-white/20 text-white"
						>
							{stats.totalNodes} nodes
						</Badge>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGlobeVisible(!isGlobeVisible)}
							className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm p-2"
						>
							{isGlobeVisible
								? <EyeOff className="w-4 h-4" />
								: <Eye className="w-4 h-4" />}
						</Button>
					</div>
				</div>
			</div>
			{/* Globe Container */}
			<div
				className={cn(
					"absolute inset-0 transition-opacity duration-500",
					"top-[10px] h-[calc(100%-10px)] sm:top-0 sm:h-full",
					isGlobeVisible ? "opacity-100" : "opacity-0",
				)}
			>
				<Globe
					ref={globeEl}
					globeImageUrl={globeImage}
					pointsData={nodes}
					pointLat={(d) => (d as NodeData).location.latitude}
					pointLng={(d) => (d as NodeData).location.longitude}
					pointColor={() => {
						const health = generateNetworkHealth();
						switch (health.status) {
							case "excellent":
								return "#10b981";
							case "good":
								return "#3b82f6";
							case "warning":
								return "#f59e0b";
							case "critical":
								return "#ef4444";
							default:
								return "#f59e0b";
						}
					}}
					pointAltitude={0.001}
					pointRadius={1.2}
					onPointClick={(d) => handleNodeClick(d as NodeData)}
					// @ts-expect-error: react-Globe.gl library types are incomplete for pointLabel prop
					pointLabel={(d: NodeData) => {
						const health = generateNetworkHealth();
						return (
							<div className="p-4 bg-zinc-900/95 border border-zinc-700 rounded-lg backdrop-blur-sm max-w-xs">
								<div className="flex items-center gap-2 mb-2">
									<h3 className="text-sm font-bold text-white">{d.name}</h3>
									<Badge
										variant={getStatusBadgeVariant(health.status)}
										className="text-xs"
									>
										{health.status.toUpperCase()}
									</Badge>
								</div>
								<p className="text-xs text-amber-400 mb-1">
									Network: {d.config.network || "Unknown"}
								</p>
								<p className="text-xs text-zinc-300 mb-1">
									{d.location.city || "Unknown"},{" "}
									{d.location.country_name || "Unknown"}
								</p>
								<p className="text-xs text-zinc-400 mb-1">
									IP: {d.location.ip || "Unknown"}
								</p>
								<p className="text-xs text-zinc-400">
									Uptime: {health.uptime.toFixed(1)}% | Latency:{" "}
									{health.latency.toFixed(0)}ms
								</p>
							</div>
						);
					}}
					atmosphereColor="#646464"
					backgroundColor="#000000"
				/>
			</div>

			{/* Control Panel - Desktop */}
			<div className="hidden sm:block absolute top-4 left-4 z-20">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsGlobeVisible(!isGlobeVisible)}
								className="flex items-center gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
							>
								{isGlobeVisible
									? <EyeOff className="w-4 h-4" />
									: <Eye className="w-4 h-4" />}
								{isGlobeVisible ? "Hide" : "Show"} Globe
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsAutoRotate(!isAutoRotate)}
								className="flex items-center gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
							>
								<GlobeIcon className="w-4 h-4" />
								{isAutoRotate ? "Stop" : "Start"} Rotate
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRefresh}
								disabled={isRefreshing}
								className="flex items-center gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
							>
								<RefreshCw
									className={cn("w-4 h-4", isRefreshing && "animate-spin")}
								/>
								Refresh
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Mobile Control Panel */}
			<div className="sm:hidden fixed bottom-8 left-6 right-6 z-20">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
					<CardContent className="p-3">
						<div className="flex items-center justify-between gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsAutoRotate(!isAutoRotate)}
								className="flex items-center gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm flex-1"
							>
								<GlobeIcon className="w-4 h-4" />
								<span className="text-xs">
									{isAutoRotate ? "Stop" : "Start"} Rotate
								</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRefresh}
								disabled={isRefreshing}
								className="flex items-center gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm flex-1"
							>
								<RefreshCw
									className={cn("w-4 h-4", isRefreshing && "animate-spin")}
								/>
								<span className="text-xs">Refresh</span>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Network Stats Panel - Desktop */}
			<div className="hidden sm:block absolute top-6 right-6 z-20 max-w-[480px]">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-amber-400 flex items-center gap-2">
									<Network className="w-5 h-5" />
									Heterogen Network
								</CardTitle>
								<p className="text-sm text-zinc-400">
									Live overview aggregated from active nodes
								</p>
							</div>
							<Badge variant="outline" className="text-xs">
								{stats.totalNodes} nodes
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-3">
							<div className="text-center p-3 bg-muted/20 rounded-lg">
								<div className="text-xs text-muted-foreground mb-1">NODES</div>
								<div className="text-xl font-bold text-emerald-400">
									{stats.totalNodes}
								</div>
							</div>
							<div className="text-center p-3 bg-muted/20 rounded-lg">
								<div className="text-xs text-muted-foreground mb-1">
									NETWORKS
								</div>
								<div className="text-xl font-bold text-blue-400">
									{stats.uniqueNetworks}
								</div>
							</div>
							<div className="text-center p-3 bg-muted/20 rounded-lg">
								<div className="text-xs text-muted-foreground mb-1">
									COUNTRIES
								</div>
								<div className="text-xl font-bold text-amber-400">
									{stats.uniqueCountries}
								</div>
							</div>
						</div>

						<Separator className="bg-zinc-800" />

						<div className="space-y-3">
							<div className="text-xs uppercase tracking-wide text-zinc-400 flex items-center gap-2">
								<Activity className="w-3 h-3" />
								Top Networks
							</div>
							<div className="flex flex-wrap gap-2">
								{stats.topNetworks.length === 0
									? <span className="text-xs text-zinc-500">No data</span>
									: (
										stats.topNetworks.map((n) => (
											<Badge
												key={n.name}
												variant="secondary"
												className="bg-amber-500/10 text-amber-400 border-amber-400/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
												onClick={() => {/* Filter by network */}}
											>
												{n.name}
												<span className="ml-2 rounded bg-amber-500/20 px-1.5 text-[10px] text-amber-300">
													{n.count}
												</span>
											</Badge>
										))
									)}
							</div>
						</div>

						<div className="space-y-3">
							<div className="text-xs uppercase tracking-wide text-zinc-400 flex items-center gap-2">
								<MapPin className="w-3 h-3" />
								Top Countries
							</div>
							<div className="flex flex-wrap gap-2">
								{stats.topCountries.length === 0
									? <span className="text-xs text-zinc-500">No data</span>
									: (
										stats.topCountries.map((c) => (
											<Badge
												key={c.name}
												variant="outline"
												className="border-zinc-700 text-zinc-200 hover:border-zinc-600 transition-colors cursor-pointer"
												onClick={() => {/* Filter by country */}}
											>
												{c.name}
												<span className="ml-2 rounded bg-zinc-700/60 px-1.5 text-[10px] text-zinc-300">
													{c.count}
												</span>
											</Badge>
										))
									)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Mobile Network Stats Panel */}
			<div className="sm:hidden fixed top-20 left-4 right-4 z-20">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
					<CardContent className="p-3">
						<div className="grid grid-cols-3 gap-2">
							<div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
								<div className="text-xs text-zinc-300 mb-1">NODES</div>
								<div className="text-lg font-bold text-emerald-400">
									{stats.totalNodes}
								</div>
							</div>
							<div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
								<div className="text-xs text-zinc-300 mb-1">NETWORKS</div>
								<div className="text-lg font-bold text-blue-400">
									{stats.uniqueNetworks}
								</div>
							</div>
							<div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
								<div className="text-xs text-zinc-300 mb-1">COUNTRIES</div>
								<div className="text-lg font-bold text-amber-400">
									{stats.uniqueCountries}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Node Details Panel */}
			{selectedNode && (
				<div className="absolute bottom-1 left-4 right-4 z-20 max-w-4xl mx-auto sm:bottom-4">
					<div className="sm:hidden fixed bottom-32 left-4 right-4 z-50">
						<NodeDetailsPanel node={selectedNode} />
					</div>
					<div className="hidden sm:block">
						<NodeDetailsPanel node={selectedNode} />
					</div>
				</div>
			)}

			{/* Legend - Desktop */}
			<div className="hidden sm:block absolute bottom-1 right-4 z-20">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
					<CardContent className="p-4">
						<div className="space-y-2">
							<div className="text-xs font-medium text-zinc-200 mb-2">
								Node Status
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs">
									<div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg">
									</div>
									<span className="text-zinc-300">Excellent</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg">
									</div>
									<span className="text-zinc-300">Good</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg">
									</div>
									<span className="text-zinc-300">Warning</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<div className="w-3 h-3 rounded-full bg-red-500 shadow-lg">
									</div>
									<span className="text-zinc-300">Critical</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default HeterogenComponent;
