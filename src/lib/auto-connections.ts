import type {
	FlowNode,
	FlowNodeData,
	ConnectionKeys,
	AutoConnectionConfig,
	EdgeGroup,
	GroupedEdgeData,
} from "@/lib/canvas-types";
import type { Edge } from "reactflow";

/**
 * Extract connection keys from node data
 */
export function extractConnectionKeys(
	nodeData: FlowNodeData,
): ConnectionKeys {
	const keys: ConnectionKeys = {};

	// For schema nodes, extract from channelKeys
	if (nodeData.isSchema && nodeData.channelKeys && nodeData.channelKeys.length > 0) {
		// Parse first channelKey to extract connection info
		// Example: testnet.runtime.ticker.BTC/USDT.bybit.spot
		const firstChannel = nodeData.channelKeys[0];
		const parts = firstChannel.split(".");
		
		if (parts.length >= 3) {
			// Extract module (ticker, book, trades)
			keys.module = parts[2]; // "ticker"
			
			// Extract market (BTC/USDT) and exchange from the rest
			const remaining = parts.slice(3).join(".");
			const match = remaining.match(/^([^.]+)\.([^.]+)\.([^.]+)$/);
			
			if (match) {
				const [, market, exchange, type] = match;
				keys.market = market; // "BTC/USDT"
				keys.exchange = exchange; // "bybit"
				keys.type = type; // "spot"
				
				// Extract base/quote from market
				if (market.includes("/")) {
					const [base, quote] = market.split("/");
					keys.base = base; // "BTC"
					keys.quote = quote; // "USDT"
					keys.asset = base; // "BTC"
				}
			}
		}
		
		return keys;
	}

	// Extract from sessionData (regular widgets)
	if (nodeData.sessionData) {
		const { sessionData } = nodeData;
		
		// Extract exchange from raw data or module
		if (sessionData.raw?.exchange) {
			keys.exchange = sessionData.raw.exchange as string;
		} else if (sessionData.module) {
			// Try to extract exchange from module name (e.g., "testnet.runtime.connector.exchange.crypto.bybit")
			const exchangeMatch = sessionData.module.match(/exchange\.(\w+)/);
			if (exchangeMatch) {
				keys.exchange = exchangeMatch[1].toLowerCase();
			} else {
				// Fallback: try to extract any exchange-like pattern
				const fallbackMatch = sessionData.module.match(/(binance|bybit|coinbase|kraken|okx|kucoin)/i);
				if (fallbackMatch) {
					keys.exchange = fallbackMatch[1].toLowerCase();
				}
			}
		}

		// Extract market information
		if (sessionData.raw?.market) {
			keys.market = sessionData.raw.market as string;
			
			// Parse trading pair if available
			const marketStr = keys.market;
			if (marketStr.includes("/") || marketStr.includes("_")) {
				const separator = marketStr.includes("/") ? "/" : "_";
				const [base, quote] = marketStr.split(separator);
				keys.base = base?.toUpperCase();
				keys.quote = quote?.toUpperCase();
				keys.asset = base?.toUpperCase(); // Primary asset
			}
		}

		// Extract widget type
		if (sessionData.widget) {
			keys.type = sessionData.widget.split(".").pop() || sessionData.widget;
		}

		// Extract module
		if (sessionData.module) {
			keys.module = sessionData.module;
		}
	}

	// Extract from channel name as fallback
	if (!keys.exchange && nodeData.channel) {
		// Try to extract exchange from channel (e.g., "testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.ticker")
		const exchangeMatch = nodeData.channel.match(/exchange\.(\w+)/);
		if (exchangeMatch) {
			keys.exchange = exchangeMatch[1].toLowerCase();
		}
		
		// Try to extract market from channel
		const marketMatch = nodeData.channel.match(/\.([A-Z0-9]+\/[A-Z0-9]+:[A-Z0-9]+)\./);
		if (marketMatch) {
			keys.market = marketMatch[1];
			// Parse trading pair
			const marketStr = keys.market;
			if (marketStr.includes("/")) {
				const [base, quote] = marketStr.split("/");
				keys.base = base?.toUpperCase();
				keys.quote = quote?.toUpperCase();
				keys.asset = base?.toUpperCase();
			}
		}
	}

	// Simple fallback for testing - use channel as type if no other keys found
	if (Object.keys(keys).length === 0 && nodeData.channel) {
		keys.type = nodeData.channel.split(".").pop() || "unknown";
	}

	return keys;
}

/**
 * Group nodes by connection keys
 */
export function groupNodesByKeys(
	nodes: FlowNode[],
	config: AutoConnectionConfig,
): EdgeGroup[] {
	const groups: Map<string, EdgeGroup> = new Map();

	console.log("Grouping nodes by keys:", {
		nodeCount: nodes.length,
		config: config.groupByKeys,
	});

	nodes.forEach((node) => {
		const keys = extractConnectionKeys(node.data);
		
		config.groupByKeys.forEach((keyType) => {
			const keyValue = keys[keyType];
			if (!keyValue) return;

			const groupKey = `${keyType}:${keyValue}`;
			
			console.log(`Found group: ${groupKey} for node ${node.id}`, {
				keyType,
				keyValue,
				keys,
			});
			
			if (!groups.has(groupKey)) {
				groups.set(groupKey, {
					key: keyValue,
					type: keyType,
					nodes: [],
					color: getEdgeColor(keyType),
					label: `${keyType}: ${keyValue}`,
				});
			}

			groups.get(groupKey)!.nodes.push(node.id);
		});
	});

	return Array.from(groups.values()).filter((group) => group.nodes.length > 1);
}

/**
 * Generate automatic connections between nodes
 */
export function generateAutoConnections(
	nodes: FlowNode[],
	config: AutoConnectionConfig,
): Edge<GroupedEdgeData>[] {
	const edges: Edge<GroupedEdgeData>[] = [];
	const edgeGroups = groupNodesByKeys(nodes, config);

	console.log("Generated edge groups:", edgeGroups);

	edgeGroups.forEach((group) => {
		// Create connections between all nodes in the group
		for (let i = 0; i < group.nodes.length; i++) {
			for (let j = i + 1; j < group.nodes.length; j++) {
				const sourceId = group.nodes[i];
				const targetId = group.nodes[j];
				
				const edge = {
					id: `auto-${group.type}-${sourceId}-${targetId}`,
					source: sourceId,
					target: targetId,
					sourceHandle: "auto-source",
					targetHandle: "auto-target",
					type: "grouped",
					data: {
						groupKey: group.key,
						groupType: group.type,
						connectionCount: group.nodes.length,
						relatedNodes: group.nodes,
					},
					style: {
						stroke: group.color,
						strokeWidth: 2,
						strokeDasharray: getEdgeDashArray(group.type),
					},
					label: config.showLabels ? group.label : undefined,
					labelStyle: {
						fill: group.color,
						fontSize: 10,
						fontWeight: "bold",
					},
				};
				
				// console.log("Creating auto edge:", edge);
				edges.push(edge);
			}
		}
	});

	return edges;
}

/**
 * Get edge color based on connection type
 */
function getEdgeColor(type: keyof ConnectionKeys): string {
	const colors = {
		exchange: "#f59e0b", // amber-500
		market: "#10b981",   // emerald-500
		asset: "#3b82f6",    // blue-500
		base: "#8b5cf6",     // violet-500
		quote: "#06b6d4",    // cyan-500
		type: "#ef4444",     // red-500
		module: "#84cc16",   // lime-500
	};
	
	return colors[type] || "#6b7280"; // gray-500 as fallback
}

/**
 * Get edge dash array based on connection type
 */
function getEdgeDashArray(type: keyof ConnectionKeys): string {
	const dashArrays = {
		exchange: "5,5",
		market: "10,5",
		asset: "15,5",
		base: "5,10",
		quote: "10,10",
		type: "20,5",
		module: "3,3",
	};
	
	return dashArrays[type] || "5,5";
}

/**
 * Filter edges to remove duplicates and keep only relevant connections
 */
export function filterAutoConnections(
	autoEdges: Edge<GroupedEdgeData>[],
	existingEdges: Edge[],
): Edge<GroupedEdgeData>[] {
	// Remove auto connections that already exist as manual connections
	return autoEdges.filter((autoEdge) => {
		return !existingEdges.some((existingEdge) => {
			return (
				(existingEdge.source === autoEdge.source && 
				 existingEdge.target === autoEdge.target) ||
				(existingEdge.source === autoEdge.target && 
				 existingEdge.target === autoEdge.source)
			);
		});
	});
}

/**
 * Default auto connection configuration
 */
export const defaultAutoConnectionConfig: AutoConnectionConfig = {
	enabled: true,
	groupByKeys: ["exchange", "market", "asset"],
	showLabels: true,
	edgeStyles: {
		exchange: "#f59e0b",
		market: "#10b981",
		asset: "#3b82f6",
		type: "#ef4444",
	},
};

/**
 * Get connection statistics for debugging
 */
export function getConnectionStats(
	nodes: FlowNode[],
	edges: Edge[],
): {
	nodeCount: number;
	edgeCount: number;
	groupCount: number;
	connectionsByType: Record<string, number>;
} {
	const config = defaultAutoConnectionConfig;
	const autoEdges = generateAutoConnections(nodes, config);
	const edgeGroups = groupNodesByKeys(nodes, config);
	
	const connectionsByType: Record<string, number> = {};
	autoEdges.forEach((edge) => {
		const type = edge.data?.groupType || "unknown";
		connectionsByType[type] = (connectionsByType[type] || 0) + 1;
	});

	return {
		nodeCount: nodes.length,
		edgeCount: edges.length,
		groupCount: edgeGroups.length,
		connectionsByType,
	};
}
