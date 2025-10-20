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

	// Enhanced channel parsing for dynamic keys
	if (nodeData.channel) {
		const channel = nodeData.channel;
		
		// Parse complex channel structures like:
		// testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.ticker
		// testnet.runtime.book.BTC/USDT.bybit.spot
		// testnet.runtime.trades.SOL/USDT.bybit.spot
		
		// Extract exchange from various patterns
		const exchangePatterns = [
			/exchange\.(\w+)/,           // exchange.bybit
			/\.(\w+)\.futures\./,        // .bybit.futures.
			/\.(\w+)\.spot\./,           // .bybit.spot.
			/\.(\w+)\.ticker$/,          // .bybit.ticker
			/\.(\w+)\.book$/,            // .bybit.book
			/\.(\w+)\.trades$/,          // .bybit.trades
		];
		
		for (const pattern of exchangePatterns) {
			const match = channel.match(pattern);
			if (match) {
				keys.exchange = match[1].toLowerCase();
				break;
			}
		}
		
		// Extract market from various patterns
		const marketPatterns = [
			/\.([A-Z0-9]+\/[A-Z0-9]+:[A-Z0-9]+)\./,  // .BTC/USDT:USDT.
			/\.([A-Z0-9]+\/[A-Z0-9]+)\./,             // .BTC/USDT.
			/\.([A-Z0-9]+_[A-Z0-9]+)\./,              // .BTC_USDT.
		];
		
		for (const pattern of marketPatterns) {
			const match = channel.match(pattern);
			if (match) {
				keys.market = match[1];
				// Parse trading pair
				const marketStr = keys.market;
				if (marketStr.includes("/")) {
					const [base, quote] = marketStr.split("/");
					keys.base = base?.toUpperCase();
					keys.quote = quote?.toUpperCase();
					keys.asset = base?.toUpperCase();
				}
				break;
			}
		}
		
		// Extract module type
		const modulePatterns = [
			/\.(ticker)$/,     // .ticker
			/\.(book)$/,       // .book
			/\.(trades)$/,     // .trades
			/\.(candles)$/,    // .candles
			/\.(orderbook)$/,  // .orderbook
		];
		
		for (const pattern of modulePatterns) {
			const match = channel.match(pattern);
			if (match) {
				keys.type = match[1];
				break;
			}
		}
		
		// Extract module from path
		const moduleMatch = channel.match(/\.(runtime|connector)\.([^.]+)/);
		if (moduleMatch) {
			keys.module = moduleMatch[2];
		}
	}

	// Extract from sessionData (regular widgets)
	if (nodeData.sessionData) {
		const sessionData = nodeData.sessionData as Record<string, unknown>;
		
		// Extract exchange from raw data or module
		const raw = sessionData.raw as Record<string, unknown> | undefined;
		if (raw?.exchange && typeof raw.exchange === 'string') {
			keys.exchange = raw.exchange;
		} else if (sessionData.module && typeof sessionData.module === 'string') {
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
		if (raw?.market && typeof raw.market === 'string') {
			keys.market = raw.market;
			
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
		if (sessionData.widget && typeof sessionData.widget === 'string') {
			keys.type = sessionData.widget.split(".").pop() || sessionData.widget;
		}

		// Extract module
		if (sessionData.module && typeof sessionData.module === 'string') {
			keys.module = sessionData.module;
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
		// Use enhanced key extraction for better grouping
		const keys = extractSmartConnectionKeys(node.data);
		
		config.groupByKeys.forEach((keyType) => {
			const keyValue = keys[keyType];
			if (!keyValue) return;

			const groupKey = `${keyType}:${keyValue}`;
			
			console.log(`Found group: ${groupKey} for node ${node.id}`, {
				keyType,
				keyValue,
				keys,
				channel: node.data.channel,
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
		// Enhanced keys
		network: "#06b6d4",  // cyan-500
		session: "#8b5cf6",  // violet-500
		category: "#84cc16", // lime-500
		dataType: "#f97316", // orange-500
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
		// Enhanced keys
		network: "2,8",
		session: "8,2",
		category: "4,4",
		dataType: "12,3",
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
 * Enhanced connection key extraction with smart grouping
 */
export function extractSmartConnectionKeys(nodeData: FlowNodeData): ConnectionKeys {
	const keys = extractConnectionKeys(nodeData);
	
	// Add smart grouping based on channel patterns
	if (nodeData.channel) {
		const channel = nodeData.channel;
		
		// Group by network (testnet, mainnet)
		const networkMatch = channel.match(/^(testnet|mainnet)/);
		if (networkMatch) {
			keys.network = networkMatch[1];
		}
		
		// Group by data type (real-time vs historical)
		if (channel.includes('runtime')) {
			keys.dataType = 'realtime';
		} else if (channel.includes('historical') || channel.includes('snapshot')) {
			keys.dataType = 'historical';
		}
		
		// Group by instrument category
		if (channel.includes('crypto')) {
			keys.category = 'crypto';
		} else if (channel.includes('forex') || channel.includes('fx')) {
			keys.category = 'forex';
		} else if (channel.includes('stocks') || channel.includes('equity')) {
			keys.category = 'stocks';
		}
		
		// Group by trading session
		if (channel.includes('futures')) {
			keys.session = 'futures';
		} else if (channel.includes('spot')) {
			keys.session = 'spot';
		} else if (channel.includes('options')) {
			keys.session = 'options';
		}
	}
	
	return keys;
}

/**
 * Default auto connection configuration with enhanced grouping
 */
export const defaultAutoConnectionConfig: AutoConnectionConfig = {
	enabled: true,
	groupByKeys: ["exchange", "market", "asset", "type", "session"],
	showLabels: true,
	edgeStyles: {
		exchange: "#f59e0b",
		market: "#10b981",
		asset: "#3b82f6",
		type: "#ef4444",
		session: "#8b5cf6",
		network: "#06b6d4",
		category: "#84cc16",
		dataType: "#f97316",
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

/**
 * Get available connection keys from nodes data
 */
export function getAvailableConnectionKeys(nodes: FlowNode[]): string[] {
	const keySet = new Set<string>();
	
	nodes.forEach((node) => {
		const keys = extractSmartConnectionKeys(node.data);
		Object.keys(keys).forEach((key) => {
			if (keys[key as keyof ConnectionKeys]) {
				keySet.add(key);
			}
		});
	});
	
	// Return keys in a logical order
	const orderedKeys = [
		'exchange', 'market', 'asset', 'base', 'quote', 
		'type', 'module', 'session', 'network', 'category', 'dataType'
	];
	
	return orderedKeys.filter(key => keySet.has(key));
}

/**
 * Debug function to analyze channel patterns and extract keys
 */
export function analyzeChannelPatterns(nodes: FlowNode[]): {
	patterns: Record<string, number>;
	examples: Record<string, string[]>;
	extractedKeys: Record<string, ConnectionKeys>;
	availableKeys: string[];
} {
	const patterns: Record<string, number> = {};
	const examples: Record<string, string[]> = {};
	const extractedKeys: Record<string, ConnectionKeys> = {};

	nodes.forEach((node) => {
		const channel = node.data.channel;
		if (!channel) return;

		// Extract pattern type
		let patternType = "unknown";
		if (channel.includes("runtime.ticker")) patternType = "runtime.ticker";
		else if (channel.includes("runtime.book")) patternType = "runtime.book";
		else if (channel.includes("runtime.trades")) patternType = "runtime.trades";
		else if (channel.includes("connector.exchange")) patternType = "connector.exchange";
		else if (channel.includes("snapshot")) patternType = "snapshot";
		else if (channel.includes("historical")) patternType = "historical";

		patterns[patternType] = (patterns[patternType] || 0) + 1;
		
		if (!examples[patternType]) examples[patternType] = [];
		if (examples[patternType].length < 3) {
			examples[patternType].push(channel);
		}

		// Extract keys for this node
		extractedKeys[node.id] = extractSmartConnectionKeys(node.data);
	});

	const availableKeys = getAvailableConnectionKeys(nodes);

	return { patterns, examples, extractedKeys, availableKeys };
}
