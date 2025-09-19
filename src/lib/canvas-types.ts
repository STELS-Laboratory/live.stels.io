import type { Node } from "reactflow";

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
  sessionData?: SessionWidgetData;
  // Node state for persistence
  nodeState?: NodeState;
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
