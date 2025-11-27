/**
 * Trading Terminal Types
 */

export interface TradingOrder {
	id: string;
	clientOrderId?: string;
	symbol: string;
	type?: "market" | "limit" | "stop" | "stopLimit";
	side?: "buy" | "sell";
	amount?: number;
	price?: number;
	stopPrice?: number;
	status?: "open" | "closed" | "canceled" | "filled" | "partiallyFilled";
	timestamp?: number;
	datetime?: string;
	filled?: number;
	remaining?: number;
	cost?: number;
	fee?: {
		currency: string;
		cost: number;
	};
	trades?: unknown[];
	info?: Record<string, unknown>;
}

export interface TradingTrade {
	id: string;
	orderId?: string;
	symbol: string;
	type?: string;
	side: "buy" | "sell";
	amount: number;
	price: number;
	cost: number;
	fee?: {
		currency?: string;
		cost?: number;
	};
	fees?: Array<{
		currency?: string;
		cost?: number;
	}>;
	timestamp: number;
	datetime: string;
	info?: Record<string, unknown>;
}

export interface OrderBookLevel {
	price: number;
	amount: number;
}

export interface OrderBook {
	bids: OrderBookLevel[];
	asks: OrderBookLevel[];
	timestamp: number;
	datetime: string;
	nonce?: number;
}

export interface Ticker {
	symbol: string;
	bid: number;
	ask: number;
	last: number;
	high: number;
	low: number;
	vwap: number;
	open: number;
	close: number;
	change: number;
	percentage: number;
	average: number;
	baseVolume: number;
	quoteVolume: number;
	timestamp: number;
	datetime: string;
	info?: Record<string, unknown>;
}

export interface Balance {
	free: number;
	used: number;
	total: number;
}

export interface AccountBalance {
	balances: Record<string, Balance>;
	timestamp: number;
	datetime: string;
}

export interface ExchangeAccount {
	nid: string;
	exchange: string;
	name?: string;
	apiKey?: string;
	apiSecret?: string;
}

export interface CreateOrderParams {
	nid: string;
	symbol: string;
	type: "market" | "limit" | "stop" | "stopLimit";
	side: "buy" | "sell";
	amount: number;
	price?: number;
	stopPrice?: number;
	timeInForce?: "GTC" | "IOC" | "FOK";
	reduceOnly?: boolean;
}

export interface TradingStoreState {
	selectedAccount: ExchangeAccount | null;
	selectedSymbol: string | null;
	orders: TradingOrder[];
	trades: TradingTrade[];
	orderBook: OrderBook | null;
	ticker: Ticker | null;
	balance: AccountBalance | null;
	accounts: ExchangeAccount[];
	loading: boolean;
	error: string | null;
	// UI State
	activeTab: string;
	activeOrdersTradesTab: string;
	autoRefreshEnabled: boolean;
	autoRefreshInterval: number;
	lastUpdateTime: number | null;
	selectedPrice: number | null;
	// View-only mode (when user has no accounts but can view markets)
	isViewOnly: boolean;
	// Selected exchange (for view-only mode when no account)
	selectedExchange: string | null;
}

export interface TradingStoreActions {
	setSelectedAccount: (account: ExchangeAccount | null) => void;
	setSelectedSymbol: (symbol: string | null) => void;
	setOrders: (orders: TradingOrder[]) => void;
	setTrades: (trades: TradingTrade[]) => void;
	setOrderBook: (orderBook: OrderBook | null) => void;
	setTicker: (ticker: Ticker | null) => void;
	setBalance: (balance: AccountBalance | null) => void;
	setAccounts: (accounts: ExchangeAccount[]) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	addOrder: (order: TradingOrder) => void;
	updateOrder: (orderId: string, updates: Partial<TradingOrder>) => void;
	removeOrder: (orderId: string) => void;
	addTrade: (trade: TradingTrade) => void;
	refreshOrders: () => Promise<void>;
	refreshTrades: () => Promise<void>;
	refreshOrderBook: () => Promise<void>;
	refreshTicker: () => Promise<void>;
	refreshBalance: () => Promise<void>;
	// UI Actions
	setActiveTab: (tab: string) => void;
	setActiveOrdersTradesTab: (tab: string) => void;
	setAutoRefreshEnabled: (enabled: boolean) => void;
	setAutoRefreshInterval: (interval: number) => void;
	setLastUpdateTime: (time: number | null) => void;
	setSelectedPrice: (price: number | null) => void;
	setIsViewOnly: (isViewOnly: boolean) => void;
	setSelectedExchange: (exchange: string | null) => void;
}

export type TradingStore = TradingStoreState & TradingStoreActions;
