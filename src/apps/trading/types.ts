/**
 * Trading API Types
 * Based on OpenAPI specification docs/openapi/schemas/trading.yaml
 * Full implementation with all trading operations
 */

// ============================================
// Common Types
// ============================================

export type Symbol = string; // Format: "BTC/USDT"

export type OrderSide = "buy" | "sell";

export type PositionSide = "long" | "short";

export type OrderType =
  | "market"
  | "limit"
  | "stop"
  | "stop_limit"
  | "trailing_stop"
  | "take_profit"
  | "take_profit_limit";

export type OrderStatus =
  | "pending"
  | "open"
  | "partial"
  | "filled"
  | "cancelled"
  | "rejected"
  | "expired";

export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTD" | "PO";

export type AccountType = "spot" | "margin" | "futures" | "funding";

// Market types for multi-market trading (v2.13.0)
export type MarketType = "spot" | "linear" | "inverse" | "option";

export type ConditionalOrderStatus = "pending" | "active" | "executed" | "cancelled" | "expired";

export type ConditionType = "price" | "time" | "indicator";

export type ConditionOperator = "gt" | "lt" | "eq" | "gte" | "lte";

// ============================================
// Data Types
// ============================================

export interface Order {
  id: string;
  accountId?: string;
  exchangeOrderId?: string;
  symbol: Symbol;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price?: number;
  amount: number;
  filled: number;
  remaining: number;
  cost: number;
  average?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  fee?: {
    cost: number;
    currency: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: Symbol;
  side: OrderSide;
  price: number;
  amount: number;
  cost: number;
  fee?: {
    cost: number;
    currency: string;
  };
  timestamp: number;
}

export interface Balance {
  currency: string;
  free: number;
  used: number;
  total: number;
}

export interface BalanceMap {
  [currency: string]: Balance;
}

export interface OrderBook {
  symbol: Symbol;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][]; // [price, amount]
  timestamp: number;
}

export interface Ticker {
  symbol: Symbol;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface Position {
  symbol: Symbol;
  side: PositionSide;
  amount: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice?: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  percentage: number;
}

export interface ConditionalOrderCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: number;
  symbol?: Symbol;
  indicator?: string; // e.g., "RSI", "MACD"
}

export interface ConditionalOrder {
  id: string;
  taskId?: string;
  accountId: string;
  agentId?: string;
  condition: ConditionalOrderCondition;
  order: {
    symbol: Symbol;
    side: OrderSide;
    type: OrderType;
    amount: number;
    price?: number;
  };
  status: ConditionalOrderStatus;
  createdAt: number;
  expiresAt?: number | null;
}

export interface BatchOrderItem {
  symbol: Symbol;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  reduceOnly?: boolean;
  params?: Record<string, unknown>;
}

export interface BatchOrderResult {
  order: BatchOrderItem;
  success: boolean;
  data?: Order | null;
  error?: string | null;
}

// ============================================
// Request Types
// ============================================

export interface GetBalanceParams {
  nid: string;
}

export interface GetTickerParams {
  nid: string;
  symbol: Symbol;
}

export interface GetOrderBookParams {
  nid: string;
  symbol: Symbol;
  limit?: number;
}

export interface ListOrdersParams {
  nid: string;
  symbol?: Symbol;
  status?: OrderStatus;
  since?: number;
  limit?: number;
}

export interface ListTradesParams {
  nid: string;
  symbol?: Symbol;
  since?: number;
  limit?: number;
}

export interface CreateOrderParams {
  nid: string;
  symbol: Symbol;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  reduceOnly?: boolean;
}

export interface GetOrderParams {
  nid: string;
  orderId: string;
  symbol?: Symbol;
}

export interface CancelOrderParams {
  nid: string;
  orderId: string;
  symbol?: Symbol;
}

// New Trading Actions - using accountId (UUID)
export interface FetchBalanceParams {
  accountId: string;
}

export interface FetchPositionsParams {
  accountId: string;
  symbol?: Symbol;
}

export interface FetchOpenOrdersParams {
  accountId: string;
  symbol?: Symbol;
}

export interface FetchOrderHistoryParams {
  accountId: string;
  symbol?: Symbol;
  since?: number;
  limit?: number; // default: 50, max: 1000
}

export interface FetchTradesParams {
  accountId: string;
  symbol?: Symbol;
  since?: number;
  limit?: number; // default: 50, max: 1000
}

export interface SetLeverageParams {
  accountId: string;
  leverage: number; // 1-125
  symbol?: Symbol;
}

export interface TransferFundsParams {
  accountId: string;
  currency: string;
  amount: number;
  fromAccount: AccountType;
  toAccount: AccountType;
}

export interface CreateBatchOrdersParams {
  accountId: string;
  orders: BatchOrderItem[];
}

export interface CreateConditionalOrderParams {
  accountId: string;
  condition: ConditionalOrderCondition;
  order: {
    symbol: Symbol;
    side: OrderSide;
    type: OrderType;
    amount: number;
    price?: number;
  };
  expiresAt?: number | null;
}

// Multi-Market Trading (v2.13.0)
export interface GetAccountMarketTypesParams {
  accountId?: string;
  nid?: string;
}

export interface MarketTypeInfo {
  type: MarketType;
  name: string;
  description: string;
  isDefault: boolean;
  isAvailable: boolean;
  availableMethods: string[];
}

export interface GetAccountMarketTypesResponse {
  accountId: string;
  exchange: string;
  exchangeSupportedTypes: MarketType[];
  availableMarketTypes: MarketType[];
  defaultMarketType: MarketType;
  marketTypes: MarketTypeInfo[];
}

// ============================================
// Professional Trading Types (v2.15.0)
// ============================================

// Bybit-specific types
export type PositionIdx = 0 | 1 | 2; // 0=one-way, 1=buy side hedge, 2=sell side hedge

export type TriggerBy = "LastPrice" | "MarkPrice" | "IndexPrice";

export type TpSlMode = "Full" | "Partial";

export type OrderFilter = "Order" | "StopOrder" | "tpslOrder";

export type StopOrderType = 
  | "stop_loss" 
  | "take_profit" 
  | "stop_loss_limit" 
  | "take_profit_limit" 
  | "trailing_stop";

export type MarginMode = "cross" | "isolated";

export type MarginAction = "add" | "reduce";

export type MarketTypeOverride = "spot" | "linear" | "inverse" | "option";

// === Order Management (v2.15.0) ===

export interface EditOrderParams {
  accountId: string;
  orderId: string;
  symbol: Symbol;
  type?: OrderType;
  side?: OrderSide;
  amount?: number;
  price?: number;
  positionIdx?: PositionIdx;
}

export interface EditOrderResponse {
  success: boolean;
  raw?: {
    orderId: string;
    symbol: Symbol;
    type: OrderType;
    side: OrderSide;
    amount: number;
    price: number;
    status: OrderStatus;
    timestamp: number;
  };
  error?: string;
}

export interface CancelAllOrdersParams {
  accountId: string;
  symbol?: Symbol;
  marketType?: MarketTypeOverride;
  orderFilter?: OrderFilter;
}

export interface CancelAllOrdersResponse {
  success: boolean;
  raw?: {
    canceledCount: number;
    canceledOrders: Order[];
    symbol?: Symbol;
    timestamp: number;
  };
  error?: string;
}

export interface CreateOrderWithTpSlParams {
  accountId: string;
  symbol: Symbol;
  type: "market" | "limit";
  side: OrderSide;
  amount: number;
  price?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  tpTriggerBy?: TriggerBy;
  slTriggerBy?: TriggerBy;
  tpslMode?: TpSlMode;
  positionIdx?: PositionIdx;
  reduceOnly?: boolean;
  timeInForce?: "GTC" | "IOC" | "FOK" | "PostOnly";
  marketType?: MarketTypeOverride;
}

export interface CreateOrderWithTpSlResponse {
  success: boolean;
  raw?: {
    orderId: string;
    symbol: Symbol;
    type: string;
    side: OrderSide;
    amount: number;
    price?: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    status: OrderStatus;
    timestamp: number;
    info?: Record<string, unknown>;
  };
  error?: string;
}

export interface CreateStopOrderParams {
  accountId: string;
  symbol: Symbol;
  stopOrderType: StopOrderType;
  side: OrderSide;
  amount: number;
  triggerPrice: number;
  price?: number; // For limit stop orders
  triggerBy?: TriggerBy;
  positionIdx?: PositionIdx;
  reduceOnly?: boolean;
  timeInForce?: "GTC" | "IOC" | "FOK" | "PostOnly";
  trailingDelta?: number; // For trailing_stop
  activationPrice?: number; // For trailing_stop
  marketType?: MarketTypeOverride;
}

export interface CreateStopOrderResponse {
  success: boolean;
  raw?: {
    orderId: string;
    symbol: Symbol;
    stopOrderType: StopOrderType;
    side: OrderSide;
    amount: number;
    triggerPrice: number;
    price?: number;
    status: OrderStatus;
    timestamp: number;
    info?: Record<string, unknown>;
  };
  error?: string;
}

// === Position Management (v2.15.0) ===

export interface SetMarginModeParams {
  accountId: string;
  marginMode: MarginMode;
  symbol: Symbol;
  marketType?: "linear" | "inverse";
}

export interface SetMarginModeResponse {
  success: boolean;
  raw?: {
    marginMode: MarginMode;
    symbol: Symbol;
    timestamp: number;
  };
  error?: string;
}

export interface ClosePositionParams {
  accountId: string;
  symbol: Symbol;
  amount?: number; // Full position if not provided
  positionIdx?: PositionIdx;
  price?: number; // Market close if not provided
  marketType?: "linear" | "inverse" | "option";
}

export interface ClosePositionResponse {
  success: boolean;
  raw?: {
    orderId: string;
    symbol: Symbol;
    side: OrderSide;
    amount: number;
    price?: number;
    status: OrderStatus;
    closedPosition?: {
      side: string;
      contracts: number;
    };
    timestamp: number;
    info?: Record<string, unknown>;
  };
  error?: string;
}

export interface SetPositionModeParams {
  accountId: string;
  hedged: boolean; // true = hedge mode, false = one-way
  symbol?: Symbol;
  marketType?: "linear" | "inverse";
}

export interface SetPositionModeResponse {
  success: boolean;
  raw?: {
    hedged: boolean;
    positionMode: "hedge" | "one-way";
    symbol?: Symbol;
    timestamp: number;
  };
  error?: string;
}

export interface ModifyMarginParams {
  accountId: string;
  symbol: Symbol;
  amount: number;
  action: MarginAction;
  positionIdx?: PositionIdx;
  marketType?: "linear" | "inverse";
}

export interface ModifyMarginResponse {
  success: boolean;
  raw?: {
    symbol: Symbol;
    action: MarginAction;
    amount: number;
    timestamp: number;
    result?: Record<string, unknown>;
  };
  error?: string;
}

// === Risk Management (v2.15.0) ===

export interface FetchLeverageTiersParams {
  accountId: string;
  symbol?: Symbol;
  symbols?: Symbol[];
  marketType?: "linear" | "inverse";
}

export interface LeverageTier {
  tier: number;
  currency?: string;
  minNotional: number;
  maxNotional: number;
  maintenanceMarginRate: number;
  maxLeverage: number;
  info?: Record<string, unknown>;
}

export interface FetchLeverageTiersResponse {
  success: boolean;
  raw?: {
    tiers: Record<string, LeverageTier[]>;
    timestamp: number;
  };
  error?: string;
}

export interface FetchFundingRateParams {
  accountId: string;
  symbol: Symbol;
  history?: boolean;
  since?: number;
  limit?: number;
  marketType?: "linear" | "inverse";
}

export interface FundingRate {
  symbol: Symbol;
  fundingRate: number;
  fundingTimestamp: number;
  fundingDatetime?: string;
  nextFundingTimestamp?: number;
  nextFundingDatetime?: string;
  nextFundingRate?: number;
  previousFundingTimestamp?: number;
  previousFundingDatetime?: string;
  previousFundingRate?: number;
  markPrice?: number;
  indexPrice?: number;
  interestRate?: number;
  estimatedSettlePrice?: number;
  interval?: string;
  timestamp: number;
  datetime?: string;
  info?: Record<string, unknown>;
}

export interface FetchFundingRateResponse {
  success: boolean;
  raw?: {
    fundingRate?: FundingRate;
    fundingRates?: FundingRate[]; // For historical data
    timestamp: number;
  };
  error?: string;
}

export interface FetchMyLiquidationsParams {
  accountId: string;
  symbol?: Symbol;
  since?: number;
  limit?: number;
  marketType?: "linear" | "inverse" | "option";
}

export interface Liquidation {
  id: string;
  symbol: Symbol;
  timestamp: number;
  datetime?: string;
  price: number;
  baseValue?: number;
  quoteValue?: number;
  contracts?: number;
  contractSize?: number;
  side: string;
  info?: Record<string, unknown>;
}

export interface FetchMyLiquidationsResponse {
  success: boolean;
  raw?: {
    liquidations: Liquidation[];
    total: number;
    timestamp: number;
  };
  error?: string;
}

export interface FetchGreeksParams {
  accountId: string;
  symbol?: Symbol;
  baseCurrency?: string; // Fetch all Greeks for base currency (e.g., BTC)
}

export interface Greeks {
  symbol: Symbol;
  timestamp: number;
  datetime?: string;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho?: number;
  bidIv?: number;
  askIv?: number;
  markIv?: number;
  underlyingPrice?: number;
  markPrice?: number;
  info?: Record<string, unknown>;
}

export interface FetchGreeksResponse {
  success: boolean;
  raw?: {
    greeks: Greeks | Greeks[];
    baseCurrency?: string;
    total?: number;
    timestamp: number;
  };
  error?: string;
}

// ============================================
// Response Types
// ============================================

export interface GetBalanceResponse {
  success: boolean;
  data?: BalanceMap;
  error?: string;
}

export interface GetTickerResponse {
  success: boolean;
  data?: Ticker;
  error?: string;
}

export interface GetOrderBookResponse {
  success: boolean;
  data?: OrderBook;
  error?: string;
}

export interface ListOrdersResponse {
  success: boolean;
  data?: Order[];
  orders?: Order[];
  error?: string;
}

export interface ListTradesResponse {
  success: boolean;
  data?: Trade[];
  trades?: Trade[];
  error?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  data?: Order;
  order?: Order;
  error?: string;
}

export interface GetOrderResponse {
  success: boolean;
  data?: Order;
  order?: Order;
  error?: string;
}

export interface CancelOrderResponse {
  success: boolean;
  data?: Order;
  order?: Order;
  error?: string;
}

// New Trading Actions Responses
export interface FetchBalanceResponse {
  success: boolean;
  data?: BalanceMap;
  error?: string;
}

export interface FetchPositionsResponse {
  success: boolean;
  data?: Position[];
  positions?: Position[];
  error?: string;
}

export interface FetchOpenOrdersResponse {
  success: boolean;
  data?: Order[];
  orders?: Order[];
  error?: string;
}

export interface FetchOrderHistoryResponse {
  success: boolean;
  data?: Order[];
  orders?: Order[];
  error?: string;
}

export interface FetchTradesResponse {
  success: boolean;
  data?: Trade[];
  trades?: Trade[];
  error?: string;
}

export interface SetLeverageResponse {
  success: boolean;
  leverage?: number;
  symbol?: Symbol;
  error?: string;
}

export interface TransferFundsResponse {
  success: boolean;
  transferId?: string;
  amount?: number;
  currency?: string;
  fromAccount?: AccountType;
  toAccount?: AccountType;
  error?: string;
}

export interface CreateBatchOrdersResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: BatchOrderResult[];
  timestamp: number;
  error?: string;
}

export interface CreateConditionalOrderResponse {
  success: boolean;
  conditionalOrderId?: string;
  status?: "pending";
  message?: string;
  timestamp?: number;
  error?: string;
}

// ============================================
// Realtime KV Data Types (from session storage)
// ============================================

/**
 * Realtime ticker data from KV store
 * Key format: airnet.runtime.ticker.{SYMBOL}.{EXCHANGE}.{MARKET}
 */
export interface RealtimeTicker {
  channel: string;
  module: "ticker";
  widget: string;
  raw: {
    exchange: string;
    market: string;
    last: number;
    bid: number;
    ask: number;
    change: number;
    percentage: number;
    baseVolume: number;
    quoteVolume: number;
    timestamp: number;
    latency?: number;
  };
  timestamp: number;
}

/**
 * Realtime order book data from KV store
 * Key format: airnet.runtime.book.{SYMBOL}.{EXCHANGE}.{MARKET}
 */
export interface RealtimeOrderBook {
  channel: string;
  module: "book";
  widget: string;
  raw: {
    exchange: string;
    market: string;
    bids: [number, number][]; // [price, amount]
    asks: [number, number][]; // [price, amount]
    volume: [number, number]; // [bid volume, ask volume]
    timestamp: number;
    latency?: number;
  };
  timestamp: number;
}

/**
 * Realtime candles (OHLCV) data from KV store
 * Key format: airnet.runtime.candles.{SYMBOL}.{EXCHANGE}.{MARKET}.{TIMEFRAME}
 */
export interface RealtimeCandles {
  channel: string;
  module: "ohlcv";
  widget: string;
  raw: {
    exchange: string;
    market: string;
    type: string;
    timeframe: string;
    candles: CandleData[];
    candleCount: number;
    timestamp: number;
    latency?: number;
  };
  timestamp: number;
}

/**
 * Single candle data: [timestamp, open, high, low, close, volume]
 */
export type CandleData = [number, number, number, number, number, number];

// ============================================
// Watchlist Types
// ============================================

export interface WatchlistItem {
  symbol: string;
  exchange: string;
  market: string;
  isFavorite: boolean;
}

// ============================================
// Price Alert Types
// ============================================

export type AlertCondition = "above" | "below" | "cross";
export type AlertNotifyMethod = "sound" | "notification" | "both";

export interface PriceAlert {
  id: string;
  symbol: string;
  exchange: string;
  market: string;
  condition: AlertCondition;
  price: number;
  isActive: boolean;
  notifyMethod: AlertNotifyMethod;
  createdAt: number;
  triggeredAt?: number;
}

// ============================================
// P&L Analytics Types
// ============================================

export interface PnLStats {
  totalPnl: number;
  unrealizedPnl: number;
  realizedPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
}

// ============================================
// Layout Types
// ============================================

export type LayoutPreset = "compact" | "standard" | "pro";

export interface TradingLayoutState {
  panelSizes: Record<string, number[]>;
  activePreset: LayoutPreset;
}

// ============================================
// Store Types
// ============================================

export interface TradingFilters {
  symbol?: Symbol;
  status?: OrderStatus;
  side?: OrderSide;
}

export interface TradingStore {
  // State
  balances: BalanceMap;
  orders: Order[];
  trades: Trade[];
  positions: Position[];
  conditionalOrders: ConditionalOrder[];
  ticker: Ticker | null;
  orderBook: OrderBook | null;
  selectedOrder: Order | null;
  selectedPosition: Position | null;
  filters: TradingFilters;
  currentLeverage: number | null;
  
  // Market Types State (v2.13.0)
  marketTypes: MarketTypeInfo[];
  selectedMarketType: MarketType | null;
  availableMethods: string[];
  
  // Risk Management State (v2.15.0)
  leverageTiers: Record<string, LeverageTier[]>;
  fundingRate: FundingRate | null;
  fundingRateHistory: FundingRate[];
  liquidations: Liquidation[];
  greeks: Greeks | Greeks[] | null;
  marginMode: MarginMode | null;
  positionMode: "hedge" | "one-way" | null;

  // Loading states
  balanceLoading: boolean;
  ordersLoading: boolean;
  tradesLoading: boolean;
  positionsLoading: boolean;
  tickerLoading: boolean;
  orderBookLoading: boolean;
  orderCreating: boolean;
  orderCancelling: boolean;
  batchOrdersCreating: boolean;
  conditionalOrderCreating: boolean;
  leverageUpdating: boolean;
  transferring: boolean;
  marketTypesLoading: boolean;
  // Professional Trading Loading States (v2.15.0)
  orderEditing: boolean;
  cancellingAll: boolean;
  closingPosition: boolean;
  marginModeUpdating: boolean;
  positionModeUpdating: boolean;
  marginModifying: boolean;
  leverageTiersLoading: boolean;
  fundingRateLoading: boolean;
  liquidationsLoading: boolean;
  greeksLoading: boolean;

  // Error states
  balanceError: string | null;
  ordersError: string | null;
  tradesError: string | null;
  positionsError: string | null;
  tickerError: string | null;
  orderBookError: string | null;
  marketTypesError: string | null;
  // Professional Trading Error States (v2.15.0)
  leverageTiersError: string | null;
  fundingRateError: string | null;
  liquidationsError: string | null;
  greeksError: string | null;

  // NID-based Actions (using network identifier)
  getBalance: (params: GetBalanceParams) => Promise<BalanceMap | null>;
  getTicker: (params: GetTickerParams) => Promise<Ticker | null>;
  getOrderBook: (params: GetOrderBookParams) => Promise<OrderBook | null>;
  listOrders: (params: ListOrdersParams) => Promise<void>;
  listTrades: (params: ListTradesParams) => Promise<void>;
  createOrder: (params: CreateOrderParams) => Promise<Order | null>;
  getOrder: (params: GetOrderParams) => Promise<Order | null>;
  cancelOrder: (params: CancelOrderParams) => Promise<boolean>;

  // AccountId-based Actions (using UUID)
  fetchBalance: (params: FetchBalanceParams) => Promise<BalanceMap | null>;
  fetchPositions: (params: FetchPositionsParams) => Promise<Position[] | null>;
  fetchOpenOrders: (params: FetchOpenOrdersParams) => Promise<Order[] | null>;
  fetchOrderHistory: (params: FetchOrderHistoryParams) => Promise<Order[] | null>;
  fetchTrades: (params: FetchTradesParams) => Promise<Trade[] | null>;
  setLeverage: (params: SetLeverageParams) => Promise<boolean>;
  transferFunds: (params: TransferFundsParams) => Promise<boolean>;
  createBatchOrders: (params: CreateBatchOrdersParams) => Promise<BatchOrderResult[] | null>;
  createConditionalOrder: (params: CreateConditionalOrderParams) => Promise<string | null>;
  
  // Multi-Market Trading (v2.13.0)
  getAccountMarketTypes: (params: GetAccountMarketTypesParams) => Promise<GetAccountMarketTypesResponse | null>;
  setSelectedMarketType: (marketType: MarketType) => void;
  
  // Professional Trading - Order Management (v2.15.0)
  editOrder: (params: EditOrderParams) => Promise<EditOrderResponse["raw"] | null>;
  cancelAllOrders: (params: CancelAllOrdersParams) => Promise<CancelAllOrdersResponse["raw"] | null>;
  createOrderWithTpSl: (params: CreateOrderWithTpSlParams) => Promise<CreateOrderWithTpSlResponse["raw"] | null>;
  createStopOrder: (params: CreateStopOrderParams) => Promise<CreateStopOrderResponse["raw"] | null>;
  
  // Professional Trading - Position Management (v2.15.0)
  setMarginMode: (params: SetMarginModeParams) => Promise<boolean>;
  closePosition: (params: ClosePositionParams) => Promise<ClosePositionResponse["raw"] | null>;
  setPositionMode: (params: SetPositionModeParams) => Promise<boolean>;
  modifyMargin: (params: ModifyMarginParams) => Promise<boolean>;
  
  // Professional Trading - Risk Management (v2.15.0)
  fetchLeverageTiers: (params: FetchLeverageTiersParams) => Promise<FetchLeverageTiersResponse["raw"] | null>;
  fetchFundingRate: (params: FetchFundingRateParams) => Promise<FetchFundingRateResponse["raw"] | null>;
  fetchMyLiquidations: (params: FetchMyLiquidationsParams) => Promise<Liquidation[] | null>;
  fetchGreeks: (params: FetchGreeksParams) => Promise<FetchGreeksResponse["raw"] | null>;

  // UI Actions
  setFilters: (filters: Partial<TradingFilters>) => void;
  clearFilters: () => void;
  setSelectedOrder: (order: Order | null) => void;
  setSelectedPosition: (position: Position | null) => void;
  clearBalances: () => void;
  clearOrders: () => void;
  clearTrades: () => void;
  clearPositions: () => void;
  clearAll: () => void;
}
