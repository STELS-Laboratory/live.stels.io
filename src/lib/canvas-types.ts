import type {Node} from "reactflow";

/**
 * Widget types enum for better type safety
 */
export const WidgetType = {
	INDICATOR: "indicator",
	TRADES: "trades",
	BOOK: "book",
	ARIADNA: "ariadna",
	FINANCE: "finance",
	CANDLES: "candles",
	SONAR: "sonar",
	TICKER: "ticker",
	TIMEZONE: "timezone",
} as const;

export type WidgetType = typeof WidgetType[keyof typeof WidgetType];

/**
 * Raw data structure for different widget types
 */
export interface WidgetRawData {
	exchange?: string;
	market?: string;
	trades?: Trade[];
	book?: OrderBookData;
	timestamp?: number | string | object;
	
	[key: string]: unknown;
}

/**
 * Trade data structure
 */
export interface Trade {
	id: string;
	price: number;
	amount: number;
	timestamp: number;
	side: "buy" | "sell";
}

/**
 * Order book data structure
 */
export interface OrderBookData {
	bids: [number, number][];
	asks: [number, number][];
	volume?: number;
	latency?: number;
}

/**
 * Session widget data structure
 */
export interface SessionWidgetData {
	module: string;
	channel: string;
	widget: string;
	raw: WidgetRawData;
	timestamp: number | string | object;
	
	// Schema-specific fields
	type?: "schema";
	name?: string;
	widgetKey?: string;
	schemaType?: string;
	
	[key: string]: unknown;
}

/**
 * Session storage data structure
 */
export interface SessionStore {
	[key: string]: SessionWidgetData;
}

/**
 * Flow node data structure
 */
export interface FlowNodeData {
	channel: string;
	label: string;
	onDelete: (nodeId: string) => void;
	sessionData?: SessionWidgetData | Record<string, unknown>;
	// Node state for persistence
	nodeState?: NodeState;
	// Schema support
	isSchema?: boolean;
	schemaId?: string;
	schemaType?: "static" | "dynamic";
	channelKeys?: string[];
}

/**
 * Flow node type
 */
export type FlowNode = Node<FlowNodeData>;

/**
 * Widget categories type
 */
export type WidgetCategories = Record<string, string[]>;

/**
 * Grouped widgets by exchange and asset
 */
export type GroupedWidgets = {
	[exchange: string]: {
		[asset: string]: string[];
	};
};

/**
 * Grouping mode type
 */
export type GroupingMode = "exchange" | "asset";

/**
 * UI state interface for widget store
 */
export interface WidgetStoreUIState {
	isOpen: boolean;
	activeCategory: string;
	searchTerm: string;
	expandedExchanges: Record<string, boolean>;
	expandedAssets: Record<string, boolean>;
	groupingMode: GroupingMode;
}

/**
 * Node state for macOS window controls
 */
export interface NodeState {
	minimized: boolean;
	maximized: boolean;
}

/**
 * Connection group keys for automatic node linking
 */
export interface ConnectionKeys {
	exchange?: string;
	market?: string;
	asset?: string;
	base?: string;
	quote?: string;
	type?: string;
	module?: string;
}

/**
 * Auto connection configuration
 */
export interface AutoConnectionConfig {
	enabled: boolean;
	groupByKeys: (keyof ConnectionKeys)[];
	showLabels: boolean;
	edgeStyles: {
		exchange: string;
		market: string;
		asset: string;
		type: string;
	};
}

/**
 * Custom edge data for grouped connections
 */
export interface GroupedEdgeData {
	groupKey: string;
	groupType: keyof ConnectionKeys;
	connectionCount: number;
	relatedNodes: string[];
}

/**
 * Edge grouping information
 */
export interface EdgeGroup {
	key: string;
	type: keyof ConnectionKeys;
	nodes: string[];
	color: string;
	label?: string;
}
