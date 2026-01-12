/**
 * STELS Runtime API Types
 * Based on API v2.0.0 specification
 */

// ============================================
// Protocol and Account Types
// ============================================

export type ProtocolData = {
  maxRiskPerTrade: number;
  strategy: string;
  maxLeverage: number;
  markets: string[];
  maxDrawdown: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  tradingStyle: string;
  positionSizing: string;
  portfolioAllocation: number;
  slippageTolerance: number;
  orderTypes: string[];
  timeframes: string[];
  marketConditions: string[];
  hedgingEnabled: boolean;
  scalingEnabled: boolean;
  trailingStopEnabled: boolean;
  dynamicPositionSizing: boolean;
};

export interface AccountRequest {
  id?: string;
  nid: string;
  connection: boolean;
  exchange: string;
  note: string;
  apiKey: string;
  secret: string;
  workers?: string[];
  status: "active" | "learn" | "stopped";
  password?: string;
  protocol?: ProtocolData;
  viewers?: string[];
}

/**
 * New request type: signed package + public key and address
 */
export interface SignedAccountRequest {
  account: AccountRequest;
  publicKey: string;
  signature: string;
  address: string;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthSession {
  sessionId: string;
  token: string;
  username: string;
  isDeveloper: boolean;
  expiresAt: number;
  /** Session creation timestamp for max lifetime validation */
  createdAt: number;
}

export interface ConnectionInfo {
  network: string;
  title: string;
  nid: string;
  payload: {
    webfix: string;
    method: string;
    params: string[];
    body: {
      githubUsername: string;
    };
  };
  transport: string;
  connector: {
    protocols: string[];
    socket: string;
  };
  api: string;
  developer: boolean;
}

export interface AuthResponse {
  channel: string;
  module: "session";
  widget: string;
  raw: {
    headers: Record<string, string>;
    session: string;
    token: string;
    info: ConnectionInfo;
  };
  timestamp: number;
}

// ============================================
// Workers Types
// ============================================

export type WorkerMode = "loop" | "single";
export type WorkerScope = "local" | "network";
export type WorkerExecutionMode = "parallel" | "leader" | "exclusive";
export type WorkerPriority = "critical" | "high" | "normal" | "low";

export interface WorkerScript {
  sid: string;
  nid: string;
  active: boolean;
  mode: WorkerMode;
  scope?: WorkerScope;
  executionMode?: WorkerExecutionMode;
  priority?: WorkerPriority;
  accountId?: string;
  assignedNode?: string;
  /** Sandbox mode for isolated execution in subprocess */
  sandbox?: boolean;
  note: string;
  script: string;
  dependencies: string[];
  version: string;
  timestamp: number;
}

export interface WorkerStatsApi {
  sid: string;
  started: number;
  executions: number;
  errors: number;
  networkErrors: number;
  criticalErrors: number;
  lastError?: string;
  lastErrorType?: "network" | "critical";
  lastRun?: number;
  consecutiveErrors: number;
  isRunning: boolean;
  scriptHash?: string;
}

// ============================================
// Trading Types
// ============================================

export interface Balance {
  free: Record<string, number>;
  used: Record<string, number>;
  total: Record<string, number>;
  timestamp: number;
  datetime: string;
}

export type OrderType = "market" | "limit" | "stop" | "stopLimit";
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "closed" | "canceled";

export interface Order {
  id: string;
  clientOrderId?: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number;
  stopPrice?: number;
  status: OrderStatus;
  filled: number;
  remaining: number;
  cost: number;
  fee?: {
    cost: number;
    currency: string;
  };
  timestamp: number;
  datetime: string;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  type: string;
  side: OrderSide;
  amount: number;
  price: number;
  cost: number;
  fee?: {
    cost: number;
    currency: string;
  };
  timestamp: number;
  datetime: string;
}

export interface OrderBook {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
  datetime: string;
  nonce?: number;
}

export interface Ticker {
  symbol: string;
  high: number;
  low: number;
  bid: number;
  ask: number;
  last: number;
  open: number;
  close: number;
  change: number;
  percentage: number;
  baseVolume: number;
  quoteVolume: number;
  timestamp: number;
  datetime: string;
}

// ============================================
// Stels AI Types
// ============================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  seed?: number;
}

export interface ChatResponse {
  model: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

// ============================================
// API Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface WebfixSuccessResponse<T> {
  webfix: "1.0";
  result: T;
}

export interface WebfixErrorResponse {
  webfix: "1.0";
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}

export type WebfixResponse<T> = WebfixSuccessResponse<T> | WebfixErrorResponse;

// ============================================
// Session Security Constants
// ============================================

/** Session validity period in milliseconds (24 hours) */
export const SESSION_VALIDITY_MS = 24 * 60 * 60 * 1000;

/** Absolute maximum session lifetime in milliseconds (7 days) */
export const SESSION_MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** Session expiry warning threshold in milliseconds (6 days) */
export const SESSION_EXPIRY_WARNING_MS = 6 * 24 * 60 * 60 * 1000;

/** Inactivity timeout in milliseconds (30 minutes) */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
