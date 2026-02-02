/**
 * Airnet Real-time Data Types
 * Defines structures for real-time streaming data from the airnet network
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Base structure for all airnet channel data
 */
export interface AirnetChannelData {
  channel: string;
  module: string;
  widget: string;
  raw: unknown;
  timestamp: number;
}

// ============================================================================
// Network & Monitoring Types
// ============================================================================

/**
 * Network connections monitoring data
 */
export interface NetworkConnectionsRaw {
  network: string;
  totalClients: number;
  anonymousClients: number;
  authenticatedClients: number;
  sessionCount: number;
  maxConnectionsPerSession: number;
  streamingActive: boolean;
  dataTransmissionInterval: number;
  heartbeatInterval: number;
  cleanupRunning: boolean;
  timestamp: number;
}

export interface NetworkConnectionsData extends AirnetChannelData {
  module: "monitoring";
  widget: "widget.airnet.network.connections";
  raw: NetworkConnectionsRaw;
}

// ============================================================================
// Peer & Node Types
// ============================================================================

/**
 * Geo location data for peers
 */
export interface PeerLocation {
  ip: string;
  country: string;
  country_name: string;
  region: string | null;
  region_code: string | null;
  city: string;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  org: string;
  asn: string;
}

/**
 * Memory usage data
 */
export interface PeerMemory {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

/**
 * Time data for peer
 */
export interface PeerTime {
  timestamp: number;
  iso: string;
  utc: string;
}

/**
 * Version info
 */
export interface PeerVersion {
  deno: string;
  v8: string;
  typescript: string;
}

/**
 * Network peer detailed data
 */
export interface NetworkPeerRaw {
  peer: string;
  ppid: number;
  pid: number;
  cpu: number[];
  location: PeerLocation;
  network: string;
  title: string;
  memory: PeerMemory;
  time: PeerTime;
  copyright: string;
  company: string;
  link: string;
  version: PeerVersion;
}

export interface NetworkPeerData extends AirnetChannelData {
  module: "network";
  raw: NetworkPeerRaw;
}

/**
 * Peer registry data (lightweight)
 */
export interface PeerRegistryRaw {
  nodeId: string;
  host: string;
  port: number;
  protocol: string;
  openApi: boolean;
  lastSeen: number;
  status: "online" | "offline" | "unknown";
}

export interface PeerRegistryData extends AirnetChannelData {
  module: "node-registry";
  raw: PeerRegistryRaw;
}

// ============================================================================
// Trading Data Types
// ============================================================================

/**
 * Order book data
 */
export interface OrderBookRaw {
  exchange: string;
  market: string;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][]; // [price, amount]
  volume: [number, number]; // [bidVolume, askVolume]
  timestamp: number;
  latency: number;
}

export interface OrderBookData extends AirnetChannelData {
  module: "book";
  widget: "widget.runtime.book";
  raw: OrderBookRaw;
}

/**
 * OHLCV Candle data
 * Candle format: [timestamp, open, high, low, close, volume]
 */
export type OHLCVCandle = [number, number, number, number, number, number];

export interface CandlesRaw {
  exchange: string;
  market: string;
  type: string; // "spot" | "futures" etc.
  timeframe: string; // "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d"
  candles: OHLCVCandle[];
}

export interface CandlesData extends AirnetChannelData {
  module: "ohlcv";
  widget: "widget.candles.ohlcv";
  raw: CandlesRaw;
}

/**
 * Ticker data
 */
export interface TickerRaw {
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
  latency: number;
}

export interface TickerData extends AirnetChannelData {
  module: "ticker";
  widget: "widget.tickers.live";
  raw: TickerRaw;
}

// ============================================================================
// Trades Data Types
// ============================================================================

/**
 * Single trade info from exchange
 */
export interface TradeInfo {
  execId: string;
  symbol: string;
  price: string;
  size: string;
  side: "Buy" | "Sell";
  time: string;
  isBlockTrade: boolean;
  isRPITrade?: boolean;
  seq: string;
}

/**
 * Single trade record
 */
export interface Trade {
  id: string;
  info: TradeInfo;
  timestamp: number;
  datetime: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  cost: number;
  fee: Record<string, unknown>;
  fees: unknown[];
}

/**
 * Trades stream data
 */
export interface TradesRaw {
  exchange: string;
  market: string;
  trades: Trade[];
  timestamp: number;
  latency: number;
}

export interface TradesData extends AirnetChannelData {
  module: "trades";
  widget: "widget.runtime.trades";
  raw: TradesRaw;
}

// ============================================================================
// Account Balance Types
// ============================================================================

/**
 * Coin balance entry
 */
export interface CoinBalance {
  free: number;
  used: number;
  total: number;
  debt?: number;
}

/**
 * Detailed coin info (from OKX and similar exchanges)
 */
export interface CoinDetailedInfo {
  ccy: string;
  availBal: string;
  cashBal: string;
  eq: string;
  eqUsd: string;
  frozenBal: string;
  spotBal: string;
  spotUpl: string;
  spotUplRatio: string;
  totalPnl: string;
  totalPnlRatio: string;
  uTime: string;
  collateralEnabled?: boolean;
}

/**
 * Wallet balance structure
 */
export interface WalletBalance {
  info?: {
    code?: string;
    data?: Array<{
      totalEq?: string;
      details?: CoinDetailedInfo[];
    }>;
    result?: {
      list?: Array<{
        totalEquity?: string;
        totalWalletBalance?: string;
        totalAvailableBalance?: string;
        totalPerpUPL?: string;
        coin?: Array<{
          coin: string;
          equity: string;
          usdValue: string;
          walletBalance: string;
          unrealisedPnl: string;
          cumRealisedPnl: string;
          marginCollateral: boolean;
        }>;
      }>;
    };
  };
  timestamp?: number;
  datetime?: string;
  free: Record<string, number>;
  used: Record<string, number>;
  total: Record<string, number>;
  debt?: Record<string, number>;
  [coin: string]: CoinBalance | Record<string, number> | number | string | undefined | unknown;
}

/**
 * Account balance raw data
 */
export interface AccountBalanceRaw {
  nid: string;
  address: string;
  exchange: string;
  availableMarketTypes: string[];
  defaultMarketType: string;
  wallet: WalletBalance;
  workers: string[];
  connection: boolean;
  note?: string;
  timestamp: number;
  credentialsEncrypted?: boolean;
  lastBalanceSync?: number;
}

export interface AccountBalanceData extends AirnetChannelData {
  module: "balance";
  raw: AccountBalanceRaw;
}

// ============================================================================
// Sonar (Runtime Statistics) Types
// ============================================================================

/**
 * Node operations statistics
 */
export interface SonarOperations {
  total: number;
  errors: number;
  networkErrors: number;
  criticalErrors: number;
  successRate: number;
}

/**
 * Workers statistics
 */
export interface SonarWorkers {
  active: number;
  stopped: number;
  total: number;
  local: number;
  network: number;
}

/**
 * Margin data
 */
export interface SonarMargin {
  balance: number;
  initial: number;
  maintenance: number;
}

/**
 * Current node info in sonar
 */
export interface SonarCurrentNode {
  id: string;
  operations: SonarOperations;
  workers: SonarWorkers;
}

/**
 * Individual node sonar data
 */
export interface SonarNodeRaw {
  accounts: unknown[];
  connectors: unknown[];
  liquidity: number;
  protection: number;
  available: number;
  margin: SonarMargin;
  rate: number;
  exchanges: unknown[];
  uniqueExchange: number;
  coins: Record<string, unknown>;
  timestamp: number;
  currentNode: SonarCurrentNode;
  workers: SonarWorkers;
}

export interface SonarNodeData extends AirnetChannelData {
  module: "sonar";
  raw: SonarNodeRaw;
}

/**
 * Network-wide sonar statistics
 */
export interface SonarNetworkStats {
  totalOperations: number;
  totalErrors: number;
  totalWorkers: number;
  activeWorkers: number;
  successRate: number;
}

export interface SonarRaw {
  timestamp: number;
  totalNodes: number;
  nodes: Record<string, {
    channel: string;
    module: string;
    widget: string;
    raw: SonarNodeRaw;
    timestamp: number;
  }>;
  network: SonarNetworkStats;
  accounts: unknown[];
  exchanges: unknown[];
  liquidity: number;
  protection: number;
  available: number;
  margin: SonarMargin;
  rate: number;
  coins: Record<string, unknown>;
}

export interface SonarData extends AirnetChannelData {
  module: "sonar";
  widget: "widget.airnet.runtime.sonar";
  raw: SonarRaw;
}

// ============================================================================
// Type Guards & Utilities
// ============================================================================

/**
 * Detect the type of channel data based on module or channel name
 */
export function detectDataType(data: AirnetChannelData | null): string | null {
  if (!data) return null;

  const { module, channel, widget } = data;

  // Check module first
  switch (module) {
    case "monitoring":
      return "connections";
    case "network":
      return "peer";
    case "node-registry":
      return "registry";
    case "book":
      return "book";
    case "ohlcv":
      return "candles";
    case "ticker":
      return "ticker";
    case "trades":
      return "trades";
    case "balance":
      return "balance";
    case "sonar":
      // Could be node sonar or network sonar
      if (channel.includes(".sonar.")) {
        return "sonar-node";
      }
      return "sonar";
  }

  // Fallback: check channel pattern
  if (channel.includes(".book.")) return "book";
  if (channel.includes(".candles.")) return "candles";
  if (channel.includes(".ticker.")) return "ticker";
  if (channel.includes(".trades.")) return "trades";
  if (channel.includes(".balance.") || channel.startsWith("account.balance.")) return "balance";
  if (channel.includes(".sonar")) return "sonar";
  if (channel.includes(".peer.")) return "peer";
  if (channel.includes(".network.peer.")) return "peer";
  if (channel.includes(".connections")) return "connections";

  // Check widget pattern
  if (widget?.includes("book")) return "book";
  if (widget?.includes("candles") || widget?.includes("ohlcv")) return "candles";
  if (widget?.includes("ticker")) return "ticker";
  if (widget?.includes("trades")) return "trades";
  if (widget?.includes("balance")) return "balance";
  if (widget?.includes("sonar")) return "sonar";

  return null;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format timestamp to time string
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Get color for price change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return "text-emerald-500";
  if (change < 0) return "text-red-500";
  return "text-muted-foreground";
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return "text-emerald-500";
    case "offline":
      return "text-red-500";
    default:
      return "text-amber-500";
  }
}
