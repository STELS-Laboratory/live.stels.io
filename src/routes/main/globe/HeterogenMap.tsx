import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

/**
 * Parse network data into node structure for globe visualization
 */
function parseNodeData(data: unknown[]): NodeData[] {
	const nodeMap: Record<string, Partial<NodeData>> = {};

	data.forEach((item) => {
		const sessionItem = item as SessionItem;
		const nodeName = sessionItem.key;

		if (!nodeMap[nodeName]) {
			nodeMap[nodeName] = { name: nodeName };
		}

		const node = nodeMap[nodeName];

		node.location = sessionItem.value.raw.location;
		node.config = sessionItem.value.raw as unknown as ConfigData;
	});

	return Object.values(nodeMap).filter((node) =>
		node.location && node.config
	) as NodeData[];
}

// HeterogenComponent
const HeterogenComponent = (): ReactElement => {
	const globeEl = useRef<GlobeMethods | undefined>(undefined);
	const [nodes, setNodes] = useState<NodeData[]>([]);

	const session = useSessionStoreSync() as
		| Record<string, { value: { raw: { nodes: unknown[] } } }>
		| null;

	const netMap = useMemo(
		() => filterSession(session || {}, /\.heterogen\..*\.setting$/),
		[session],
	);

	useEffect(() => {
		const parsedNodes = parseNodeData(netMap);
		setNodes(parsedNodes);
	}, []);

	useEffect(() => {
		// Auto-rotate
		const controls = globeEl.current?.controls();
		if (controls) {
			controls.autoRotate = true;
			controls.autoRotateSpeed = 0.1;
		}
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

		const networks = countBy(nodes.map((n) => n.config.network));
		const countries = countBy(nodes.map((n) => n.location.country_name));
		const versions = countBy(nodes.map((n) => n.location.version));

		return {
			totalNodes,
			uniqueNetworks: networks.length,
			uniqueCountries: countries.length,
			topNetworks: networks.slice(0, 4),
			topCountries: countries.slice(0, 6),
			versions: versions.slice(0, 4),
		};
	}, [nodes]);

	return (
		<>
			<div className="fixed w-[100%] h-[100%] left-0 top-0 bottom-0 right-0 z-0">
				<Globe
					ref={globeEl}
					globeImageUrl={globeImage}
					pointsData={nodes}
					pointLat={(d) => (d as NodeData).location.latitude}
					pointLng={(d) => (d as NodeData).location.longitude}
					pointColor={() => "orange"}
					pointAltitude={0.001}
					pointRadius={0.8}
					// @ts-expect-error: react-globe.gl library types are incomplete for pointLabel prop
					pointLabel={(d: NodeData) => (
						<div className="p-4 border">
							<h3 className="text-sm font-bold">{d.name}</h3>
							<p className="text-xs">Network: {d.config.network}</p>
							<p className="text-xs">
								Location: {d.location.city}, {d.location.country_name}
							</p>
							<p className="text-xs">IP: {d.location.ip}</p>
							<p className="text-xs">
								ASN: {d.location.asn} - {d.location.org}
							</p>
						</div>
					)}
					atmosphereColor="gray"
					backgroundColor="black"
				/>
			</div>
			<div className="fixed z-10 max-w-[460px]">
				<Card
					aria-live="polite"
					className="bg-zinc-900/80 border-zinc-800 backdrop-blur"
				>
					<CardHeader className="pb-3">
						<CardTitle className="text-amber-400">Heterogen Network</CardTitle>
						<div className="text-sm text-zinc-400">
							Live overview aggregated from active nodes
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-md border  p-3">
								<div className="text-xs text-zinc-400">Nodes</div>
								<div className="text-xl font-semibold text-zinc-100">
									{stats.totalNodes}
								</div>
							</div>
							<div className="rounded-md border  p-3">
								<div className="text-xs text-zinc-400">Networks</div>
								<div className="text-xl font-semibold text-zinc-100">
									{stats.uniqueNetworks}
								</div>
							</div>
							<div className="rounded-md border  p-3">
								<div className="text-xs text-zinc-400">Countries</div>
								<div className="text-xl font-semibold text-zinc-100">
									{stats.uniqueCountries}
								</div>
							</div>
						</div>

						<Separator className="bg-zinc-800" />

						<div className="space-y-2">
							<div className="text-xs uppercase tracking-wide text-zinc-400">
								Heterogeneous
							</div>
							<div className="flex flex-wrap gap-2">
								{stats.topNetworks.length === 0
									? <span className="text-xs text-zinc-500">No data</span>
									: (
										stats.topNetworks.map((n) => (
											<Badge
												key={n.name}
												variant="secondary"
												className="bg-amber-500/10 text-amber-400 border-amber-400/30"
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

						<div className="space-y-2">
							<div className="text-xs uppercase tracking-wide text-zinc-400">
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
												className="border-zinc-700 text-zinc-200"
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
		</>
	);
};

export default HeterogenComponent;
