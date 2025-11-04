/**
 * Heterogen Runtime Worker SDK Type Definitions
 * Auto-completion for Monaco Editor
 * @version 2.1.0
 */

/**
 * Worker logger with automatic KV storage (30 min TTL)
 */
interface WorkerLogger {
  /**
   * Log informational message
   * @param message - Message to log
   * @param data - Optional data to include
   */
  info(message: string, data?: any): void;

  /**
   * Log warning message
   * @param message - Warning message
   * @param data - Optional data to include
   */
  warn(message: string, data?: any): void;

  /**
   * Log error message
   * @param message - Error message
   * @param error - Error object or data
   */
  error(message: string, error?: any): void;

  /**
   * Log debug message
   * @param message - Debug message
   * @param data - Optional data to include
   */
  debug(message: string, data?: any): void;
}

/**
 * Application configuration
 */
interface AppConfig {
  /** Network name (e.g., "testnet", "mainnet") */
  network: string;

  /** Application title */
  title: string;

  /** Node ID (e.g., "s-0001") */
  nid: string;

  /** Tick rate (updates per second) */
  tick: number;

  /** Rate limiting enabled */
  limit: boolean;

  /** Network workers enabled (0 = disabled, 1 = enabled) */
  workers: number;

  /** Wallet lists for access control */
  walletList: {
    owners: string[];
    advisors: string[];
    developers: string[];
    partners: string[];
  };

  /** Server configuration */
  server: {
    /** API server open (0 = closed, 1 = open) */
    open: number;
    /** Transport type */
    transport: string;
    /** Protocol name */
    protocol: string;
    /** Server hostname */
    hostname: string;
    /** Server port */
    port: string;
  };

  /** Access token */
  token: string;

  /** Process ID */
  pid: string;

  /** Allow anonymous connections */
  allowAnonymousConnections?: boolean;
}

/**
 * Order types
 */
type OrderSide = "buy" | "sell";
type OrderType = "limit" | "market" | "stop-loss" | "stop-loss-limit" | "take-profit" | "take-profit-limit";
type OrderStatus = "open" | "closed" | "canceled" | "expired" | "rejected";

interface Ticker {
  symbol: string;
  info: any;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  bidVolume: number;
  ask: number;
  askVolume: number;
  vwap: number;
  open: number;
  close: number;
  last: number;
  previousClose: number;
  change: number;
  percentage: number;
  average: number;
  quoteVolume: number;
  baseVolume: number;
}

interface OrderBook {
  asks: [number, number][];
  bids: [number, number][];
  datetime: string;
  timestamp: number;
  nonce: number;
  symbol: string;
}

interface Balance {
  free: number;
  used: number;
  total: number;
  debt?: number;
}

interface Balances {
  [currency: string]: Balance;
  free: { [currency: string]: number };
  used: { [currency: string]: number };
  total: { [currency: string]: number };
  info: any;
}

interface Order {
  id: string;
  clientOrderId: string;
  datetime: string;
  timestamp: number;
  lastTradeTimestamp: number;
  status: OrderStatus;
  symbol: string;
  type: OrderType;
  timeInForce?: string;
  side: OrderSide;
  price: number;
  average?: number;
  amount: number;
  filled: number;
  remaining: number;
  stopPrice?: number;
  triggerPrice?: number;
  cost: number;
  trades: Trade[];
  fee: {
    currency: string;
    cost: number;
    rate?: number;
  };
  info: any;
}

interface Trade {
  info: any;
  amount: number;
  datetime: string;
  id: string;
  order: string;
  price: number;
  timestamp: number;
  type: OrderType;
  side: OrderSide;
  symbol: string;
  takerOrMaker: "taker" | "maker";
  cost: number;
  fee: {
    currency: string;
    cost: number;
    rate?: number;
  };
}

interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}



/**
 * Gliesereum blockchain wallet
 */
interface BlockchainWallet {
  /** Public key (66 chars hex) */
  readonly publicKey: string;
  
  /** Private key (64 chars hex) */
  readonly privateKey: string;
  
  /** Gliesereum address (g-prefixed) */
  readonly address: string;
  
  /** Biometric data (optional) */
  readonly biometric?: string | null;
  
  /** Card number (16 digits) */
  readonly number: string;
}

/**
 * Smart operation types
 */
type SmartOp =
  | {
      op: "transfer";
      to: string;
      amount: string;
      memo?: string;
    }
  | {
      op: "assert.time";
      before_ms?: number;
      after_ms?: number;
    }
  | {
      op: "assert.balance";
      address: string;
      gte: string;
    }
  | {
      op: "assert.compare";
      left: string;
      cmp: "<" | "<=" | "==" | ">=" | ">";
      right: string;
    }
  | {
      op: "emit.event";
      kind: string;
      data?: Record<string, unknown>;
    };

/**
 * Transaction signature
 */
interface TransactionSignature {
  kid: string;
  alg: "ecdsa-secp256k1";
  sig: string;
}

/**
 * Basic transaction structure
 */
interface Transaction {
  from: {
    address: string;
    publicKey: string;
    number: string;
  };
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  hash: string;
  status?: "pending" | "confirmed" | "failed";
  verified?: boolean;
  validators: string[];
  signature?: string;
  data?: string;
}

/**
 * Smart transaction structure
 */
interface SmartTransaction {
  type: "smart";
  method: "smart.exec";
  args: {
    ops: SmartOp[];
    memo?: string;
  };
  from: string;
  fee: string;
  currency: "TST";
  prev_hash: string | null;
  timestamp: number;
  signatures: TransactionSignature[];
  raw?: string;
  raw_encoding?: "utf8";
  raw_sha256?: string;
  methods?: CosignMethod[];
  cosigs?: CosignSignature[];
}

/**
 * Cosign method configuration
 */
interface CosignMethod {
  id: string;
  type: "cosign";
  threshold?: {
    k: number;
    n: number;
  };
  approvers?: string[];
  deadline_ms?: number;
}

/**
 * Cosign signature
 */
interface CosignSignature {
  method_id: string;
  kid: string;
  alg: "ecdsa-secp256k1";
  sig: string;
}

/**
 * Gliesereum blockchain SDK
 */
interface GliesereumSDK {
  // Wallet functions
  /** Generate deterministic 16-digit Luhn-valid card number */
  cardNumber(
    input: string | Uint8Array,
    prefix?: string,
    secretKey?: string | Uint8Array,
  ): string;
  
  /** Create new wallet with random keys */
  createWallet(): BlockchainWallet;
  
  /** Import wallet from private key (64 chars hex) */
  importWallet(privateKey: string): BlockchainWallet;
  
  /** Validate Gliesereum address format */
  validateAddress(address: string): boolean;
  
  /** Generate address from bytes */
  getAddress(bytes: Uint8Array): string;
  
  /** Get address from public key */
  getAddressFromPublicKey(publicKey: string): string;
  
  /** Verify public key matches address */
  verifyPublicKeyAddress(publicKey: string, address: string): boolean;
  
  // Transaction functions
  /** Create and sign a basic transaction */
  createSignedTransaction(
    wallet: BlockchainWallet,
    to: string,
    amount: number,
    fee: number,
    data?: string,
  ): Transaction;
  
  /** Validate transaction integrity */
  validateTransaction(tx: Transaction): boolean;
  
  // Smart transaction functions
  /** Create smart transaction with multiple operations */
  createSmartTransaction(
    wallet: BlockchainWallet,
    ops: SmartOp[],
    fee?: string,
    memo?: string,
    prevHash?: string | null,
    rawData?: string,
  ): SmartTransaction;
  
  /** Validate smart transaction */
  validateSmartTransaction(tx: SmartTransaction): boolean;
  
  /** Validate smart operation */
  validateSmartOperation(op: SmartOp): boolean;
  
  /** Calculate smart transaction fee */
  calculateSmartTransactionFee(
    ops: SmartOp[],
    rawBytes?: number,
    baseFee?: string,
  ): string;
  
  // Cosign functions
  /** Create cosign method configuration */
  createCosignMethod(
    id: string,
    approvers: string[],
    threshold: { k: number; n: number },
    deadlineMs?: number,
  ): CosignMethod;
  
  /** Create cosign signature */
  createCosignSignature(
    methodId: string,
    publicKey: string,
    privateKey: string,
    transaction: SmartTransaction,
  ): CosignSignature;
  
  /** Sign with domain separation */
  signWithDomain(
    data: string,
    privateKey: string,
    domain: string[],
  ): string;
  
  // Cryptographic functions
  /** Sign data with private key (returns DER format) */
  sign(data: string, privateKey: string): string;
  
  /** Verify signature */
  verify(data: string, signature: string, publicKey: string): boolean;
  
  // Validation functions
  validateCosignMethod(method: CosignMethod): boolean;
  validateCosignSignature(cosig: CosignSignature): boolean;
  validateTransactionSignature(sig: TransactionSignature): boolean;
  validateFeeFormat(fee: string): boolean;
  validateAmountFormat(amount: string): boolean;
  validateRawData(rawData: string): boolean;
  validateMemo(memo: string): boolean;
  validateEventKind(kind: string): boolean;
  validateEventData(data: Record<string, unknown>): boolean;
}

/**
 * WebFIX configuration for KV operations
 */
interface WebfixConfig {
  /** KV database instance (Stels.local or Stels.net) */
  brain: Deno.Kv;

  /** Operation method */
  method: "get" | "set" | "update" | "delete";

  /** Key path as array */
  channel: string[];

  /** Module name */
  module: string;

  /** Data to store (for set/update) */
  raw?: any;

  /** Timestamp */
  timestamp: number;

  /** Expiration time in milliseconds */
  expireIn?: number;

  /** Version stamp for optimistic locking */
  versionstamp?: string;
}

/**
 * WebFIX operation result
 */
interface WebfixResult {
  /** Stored/retrieved value */
  value: any;

  /** Version stamp */
  versionstamp: string | null;

  /** Operation key */
  key: string[];
}

/**
 * Main Stels global object available in worker scripts
 */
interface StelsGlobal {
  /**
   * Deno runtime engine
   * @example
   * const version = Stels.engine.version;
   */
  engine: typeof Deno;

  /**
   * Distributed KV database (shared across all nodes)
   * @example
   * const data = await Stels.net.get(["key", "path"]);
   * await Stels.net.set(["key", "path"], { value: 123 });
   */
  net: Deno.Kv;

  /**
   * Local KV database (node-specific storage)
   * @example
   * const localData = await Stels.local.get(["local", "key"]);
   */
  local: Deno.Kv;

  /**
   * Gliesereum blockchain SDK
   * @example
   * const wallet = Stels.blockchain.importWallet(privateKey);
   */
  blockchain: GliesereumSDK;


  /**
   * Blockchain wallet instance
   * @example
   * const address = Stels.wallet.address;
   * const signature = Stels.wallet.sign("message");
   */
  wallet: BlockchainWallet;

  /**
   * Application configuration
   * @example
   * const nodeId = Stels.config.nid;
   * const network = Stels.config.network;
   */
  config: AppConfig;

  /**
   * WebFIX KV operations wrapper
   * @example
   * const result = await Stels.webfix({
   *   brain: Stels.local,
   *   method: "set",
   *   channel: ["my", "key"],
   *   module: "worker",
   *   raw: { data: 123 },
   *   timestamp: Date.now()
   * });
   */
  webfix(config: WebfixConfig): Promise<WebfixResult>;

  /**
   * Sleep with abort signal support
   * Automatically uses worker's abort signal for graceful shutdown
   * @param ms - Milliseconds to sleep
   * @throws {DOMException} When worker is stopped
   * @example
   * await Stels.sleep(5000); // Sleeps for 5 seconds
   * await Stels.sleep(1000); // Auto-cancels if worker stopped
   */
  sleep(ms: number): Promise<void>;

  /**
   * Hybrid timestamp (set at script start)
   */
  hybridTimestamp: number;

  /** DNS URL */
  dns: string;

  /** Encrypted DNS access token */
  dns_map: string;
}

/**
 * Logger instance for worker (auto-created per worker)
 * Logs are automatically saved to KV with 30-minute TTL
 * @example
 * logger.info("Worker iteration", { count: 1 });
 * logger.error("Failed to fetch data", error);
 */
declare const logger: WorkerLogger;

/**
 * Global Stels context with all APIs
 * @example
 * const { config, net, local } = Stels;
 * logger.info("Node ID:", config.nid);
 * await Stels.sleep(1000);
 */
declare const Stels: StelsGlobal;

/**
 * Application configuration shorthand
 * @example
 * logger.info("Running on:", config.nid);
 */
declare const config: AppConfig;

/**
 * Abort signal for worker lifecycle
 * Check this to know if worker should stop
 * @example
 * if (signal.aborted) {
 *   logger.info("Worker is stopping");
 *   return;
 * }
 */
declare const signal: AbortSignal;

/**
 * Check if worker should stop
 * Use this in loops for graceful shutdown
 * @returns true if worker should stop, false otherwise
 * @example
 * while (!shouldStop()) {
 *   await doWork();
 *   await Stels.sleep(1000);
 * }
 */
declare function shouldStop(): boolean;

/**
 * Utility Types
 */

/** Order side */
type OrderSide = "buy" | "sell";

/** Order type */
type OrderType =
  | "limit"
  | "market"
  | "stop-loss"
  | "stop-loss-limit"
  | "take-profit"
  | "take-profit-limit";

/** Timeframe for candles */
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | "1M";

/**
 * Common Exchange Interfaces
 */

interface Ticker {
  symbol: string;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  ask: number;
  last: number;
  close: number;
  baseVolume: number;
  quoteVolume: number;
}

interface OrderBook {
  symbol: string;
  timestamp: number;
  datetime: string;
  bids: [number, number][];
  asks: [number, number][];
}

interface Balance {
  free: { [currency: string]: number };
  used: { [currency: string]: number };
  total: { [currency: string]: number };
}

interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number;
  filled: number;
  remaining: number;
  status: "open" | "closed" | "canceled";
  timestamp: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  timestamp: number;
}

interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
