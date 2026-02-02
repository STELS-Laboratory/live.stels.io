/**
 * Account Data Normalizer
 * Normalizes exchange-specific wallet data to a unified format (Bybit-like structure)
 * 
 * Target format:
 * {
 *   info: {
 *     retCode: "0",
 *     retMsg: "OK",
 *     result: {
 *       list: [{
 *         accountType: string,
 *         totalEquity: string,
 *         totalWalletBalance: string,
 *         totalAvailableBalance: string,
 *         totalMarginBalance: string,
 *         totalPerpUPL: string,
 *         accountIMRate: string,
 *         accountMMRate: string,
 *         coin: NormalizedCoin[]
 *       }]
 *     },
 *     time: string
 *   },
 *   timestamp: number,
 *   datetime: string,
 *   free: Record<string, number>,
 *   used: Record<string, number>,
 *   total: Record<string, number>,
 *   debt: Record<string, number>
 * }
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Normalized coin balance entry (Bybit-like format)
 */
export interface NormalizedCoin {
  coin: string;
  equity: string;
  walletBalance: string;
  usdValue: string;
  unrealisedPnl: string;
  cumRealisedPnl: string;
  marginCollateral: boolean;
  borrowAmount: string;
  availableToWithdraw: string;
  totalOrderIM: string;
  totalPositionIM: string;
  totalPositionMM: string;
  locked: string;
  // Extended fields
  spotUpl?: string;
  spotUplRatio?: string;
  totalPnl?: string;
  totalPnlRatio?: string;
}

/**
 * Normalized account summary (Bybit-like format)
 */
export interface NormalizedAccountSummary {
  accountType: string;
  totalEquity: string;
  totalWalletBalance: string;
  totalAvailableBalance: string;
  totalMarginBalance: string;
  totalPerpUPL: string;
  totalInitialMargin: string;
  totalMaintenanceMargin: string;
  accountIMRate: string;
  accountMMRate: string;
  accountLTV: string;
  coin: NormalizedCoin[];
}

/**
 * Normalized wallet info structure
 */
export interface NormalizedWalletInfo {
  retCode: string;
  retMsg: string;
  result: {
    list: NormalizedAccountSummary[];
  };
  time: string;
}

/**
 * Normalized wallet data
 */
export interface NormalizedWallet {
  info: NormalizedWalletInfo;
  timestamp: number;
  datetime: string;
  free: Record<string, number>;
  used: Record<string, number>;
  total: Record<string, number>;
  debt: Record<string, number>;
}

/**
 * Raw OKX coin detail
 */
interface OKXCoinDetail {
  ccy: string;
  availBal?: string;
  cashBal?: string;
  eq?: string;
  eqUsd?: string;
  frozenBal?: string;
  spotBal?: string;
  spotUpl?: string;
  spotUplRatio?: string;
  totalPnl?: string;
  totalPnlRatio?: string;
  collateralEnabled?: boolean;
  uTime?: string;
  interest?: string;
  liab?: string;
  ordFrozen?: string;
  imr?: string;
  mmr?: string;
}

/**
 * Raw OKX account data
 */
interface OKXAccountData {
  totalEq?: string;
  adjEq?: string;
  availEq?: string;
  imr?: string;
  mmr?: string;
  mgnRatio?: string;
  details?: OKXCoinDetail[];
  uTime?: string;
}

/**
 * Raw OKX wallet info
 */
interface OKXWalletInfo {
  code?: string;
  data?: OKXAccountData[];
  msg?: string;
}

/**
 * Raw Bybit coin
 */
interface BybitCoin {
  coin: string;
  equity?: string;
  walletBalance?: string;
  usdValue?: string;
  unrealisedPnl?: string;
  cumRealisedPnl?: string;
  marginCollateral?: boolean;
  borrowAmount?: string;
  availableToWithdraw?: string;
  totalOrderIM?: string;
  totalPositionIM?: string;
  totalPositionMM?: string;
  locked?: string;
  spotBorrow?: string;
  accruedInterest?: string;
  bonus?: string;
  collateralSwitch?: boolean;
  spotHedgingQty?: string;
}

/**
 * Raw Bybit account summary
 */
interface BybitAccountSummary {
  accountType?: string;
  totalEquity?: string;
  totalWalletBalance?: string;
  totalAvailableBalance?: string;
  totalMarginBalance?: string;
  totalPerpUPL?: string;
  totalInitialMargin?: string;
  totalMaintenanceMargin?: string;
  accountIMRate?: string;
  accountMMRate?: string;
  accountLTV?: string;
  coin?: BybitCoin[];
}

/**
 * Raw Bybit wallet info
 */
interface BybitWalletInfo {
  retCode?: string;
  retMsg?: string;
  result?: {
    list?: BybitAccountSummary[];
  };
  time?: string;
}

/**
 * Raw wallet data from any exchange
 */
interface RawWallet {
  info?: OKXWalletInfo | BybitWalletInfo | unknown;
  timestamp?: number;
  datetime?: string;
  free?: Record<string, number>;
  used?: Record<string, number>;
  total?: Record<string, number>;
  debt?: Record<string, number>;
  [key: string]: unknown;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Safely convert value to string
 */
function toStr(value: unknown): string {
  if (value == null) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "0";
}

/**
 * Safely parse number
 */
function toNum(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Detect exchange type from wallet info structure
 */
export function detectExchange(wallet: RawWallet): "okx" | "bybit" | "unknown" {
  const info = wallet.info as Record<string, unknown> | undefined;
  
  if (!info) return "unknown";
  
  // OKX has 'code' and 'data' array
  if ("code" in info && "data" in info && Array.isArray(info.data)) {
    return "okx";
  }
  
  // Bybit has 'retCode' and 'result.list'
  if ("retCode" in info && "result" in info) {
    return "bybit";
  }
  
  return "unknown";
}

// =============================================================================
// OKX Normalizer
// =============================================================================

/**
 * Normalize OKX coin detail to unified format
 */
function normalizeOKXCoin(detail: OKXCoinDetail): NormalizedCoin {
  const usdValue = toStr(detail.eqUsd);
  const equity = toStr(detail.eq);
  const availBal = toStr(detail.availBal);
  const frozenBal = toStr(detail.frozenBal);
  
  return {
    coin: detail.ccy,
    equity: equity,
    walletBalance: toStr(detail.cashBal || detail.spotBal || detail.eq),
    usdValue: usdValue,
    unrealisedPnl: toStr(detail.spotUpl),
    cumRealisedPnl: toStr(detail.totalPnl),
    marginCollateral: detail.collateralEnabled ?? false,
    borrowAmount: toStr(detail.liab),
    availableToWithdraw: availBal,
    totalOrderIM: toStr(detail.ordFrozen),
    totalPositionIM: toStr(detail.imr),
    totalPositionMM: toStr(detail.mmr),
    locked: frozenBal,
    // OKX-specific extended fields
    spotUpl: toStr(detail.spotUpl),
    spotUplRatio: toStr(detail.spotUplRatio),
    totalPnl: toStr(detail.totalPnl),
    totalPnlRatio: toStr(detail.totalPnlRatio),
  };
}

/**
 * Normalize OKX wallet data to unified format
 */
function normalizeOKXWallet(wallet: RawWallet): NormalizedWallet {
  const info = wallet.info as OKXWalletInfo;
  const data = info?.data?.[0];
  const details = data?.details || [];
  
  // Calculate totals from details
  let totalEquity = toNum(data?.totalEq);
  let totalUPL = 0;
  
  if (totalEquity === 0) {
    details.forEach((d) => {
      totalEquity += toNum(d.eqUsd);
    });
  }
  
  details.forEach((d) => {
    totalUPL += toNum(d.spotUpl);
  });
  
  // Normalize coins
  const normalizedCoins: NormalizedCoin[] = details.map(normalizeOKXCoin);
  
  // Sort by USD value (descending)
  normalizedCoins.sort((a, b) => toNum(b.usdValue) - toNum(a.usdValue));
  
  // Build normalized structure
  const normalizedInfo: NormalizedWalletInfo = {
    retCode: info?.code || "0",
    retMsg: info?.msg || "OK",
    result: {
      list: [{
        accountType: "TRADING", // OKX default
        totalEquity: toStr(totalEquity),
        totalWalletBalance: toStr(data?.totalEq || totalEquity),
        totalAvailableBalance: toStr(data?.availEq || totalEquity),
        totalMarginBalance: toStr(data?.adjEq || "0"),
        totalPerpUPL: toStr(totalUPL),
        totalInitialMargin: toStr(data?.imr),
        totalMaintenanceMargin: toStr(data?.mmr),
        accountIMRate: toStr(data?.imr ? toNum(data.imr) / totalEquity : 0),
        accountMMRate: toStr(data?.mmr ? toNum(data.mmr) / totalEquity : 0),
        accountLTV: toStr(data?.mgnRatio),
        coin: normalizedCoins,
      }],
    },
    time: toStr(data?.uTime || wallet.timestamp),
  };
  
  return {
    info: normalizedInfo,
    timestamp: wallet.timestamp || Date.now(),
    datetime: wallet.datetime || new Date().toISOString(),
    free: wallet.free || {},
    used: wallet.used || {},
    total: wallet.total || {},
    debt: wallet.debt || {},
  };
}

// =============================================================================
// Bybit Normalizer (passthrough with defaults)
// =============================================================================

/**
 * Normalize Bybit coin to ensure all fields exist
 */
function normalizeBybitCoin(coin: BybitCoin): NormalizedCoin {
  return {
    coin: coin.coin,
    equity: toStr(coin.equity),
    walletBalance: toStr(coin.walletBalance),
    usdValue: toStr(coin.usdValue),
    unrealisedPnl: toStr(coin.unrealisedPnl),
    cumRealisedPnl: toStr(coin.cumRealisedPnl),
    marginCollateral: coin.marginCollateral ?? coin.collateralSwitch ?? false,
    borrowAmount: toStr(coin.borrowAmount || coin.spotBorrow),
    availableToWithdraw: toStr(coin.availableToWithdraw),
    totalOrderIM: toStr(coin.totalOrderIM),
    totalPositionIM: toStr(coin.totalPositionIM),
    totalPositionMM: toStr(coin.totalPositionMM),
    locked: toStr(coin.locked),
  };
}

/**
 * Normalize Bybit wallet data (mostly passthrough with defaults)
 */
function normalizeBybitWallet(wallet: RawWallet): NormalizedWallet {
  const info = wallet.info as BybitWalletInfo;
  const list = info?.result?.list || [];
  const first = list[0];
  const coins = first?.coin || [];
  
  // Normalize coins
  const normalizedCoins: NormalizedCoin[] = coins.map(normalizeBybitCoin);
  
  // Sort by USD value (descending)
  normalizedCoins.sort((a, b) => toNum(b.usdValue) - toNum(a.usdValue));
  
  const normalizedInfo: NormalizedWalletInfo = {
    retCode: toStr(info?.retCode || "0"),
    retMsg: info?.retMsg || "OK",
    result: {
      list: [{
        accountType: first?.accountType || "UNIFIED",
        totalEquity: toStr(first?.totalEquity),
        totalWalletBalance: toStr(first?.totalWalletBalance),
        totalAvailableBalance: toStr(first?.totalAvailableBalance),
        totalMarginBalance: toStr(first?.totalMarginBalance),
        totalPerpUPL: toStr(first?.totalPerpUPL),
        totalInitialMargin: toStr(first?.totalInitialMargin),
        totalMaintenanceMargin: toStr(first?.totalMaintenanceMargin),
        accountIMRate: toStr(first?.accountIMRate),
        accountMMRate: toStr(first?.accountMMRate),
        accountLTV: toStr(first?.accountLTV),
        coin: normalizedCoins,
      }],
    },
    time: toStr(info?.time || wallet.timestamp),
  };
  
  return {
    info: normalizedInfo,
    timestamp: wallet.timestamp || Date.now(),
    datetime: wallet.datetime || new Date().toISOString(),
    free: wallet.free || {},
    used: wallet.used || {},
    total: wallet.total || {},
    debt: wallet.debt || {},
  };
}

// =============================================================================
// Generic Normalizer (fallback)
// =============================================================================

/**
 * Normalize unknown exchange wallet data using CCXT standard fields
 */
function normalizeGenericWallet(wallet: RawWallet): NormalizedWallet {
  const total = wallet.total || {};
  const free = wallet.free || {};
  const used = wallet.used || {};
  
  // Build coins from total balances
  const normalizedCoins: NormalizedCoin[] = Object.entries(total)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([coin, value]) => ({
      coin,
      equity: toStr(value),
      walletBalance: toStr(value),
      usdValue: "0", // Unknown without price data
      unrealisedPnl: "0",
      cumRealisedPnl: "0",
      marginCollateral: false,
      borrowAmount: "0",
      availableToWithdraw: toStr(free[coin] || 0),
      totalOrderIM: "0",
      totalPositionIM: "0",
      totalPositionMM: "0",
      locked: toStr(used[coin] || 0),
    }));
  
  const normalizedInfo: NormalizedWalletInfo = {
    retCode: "0",
    retMsg: "OK",
    result: {
      list: [{
        accountType: "UNKNOWN",
        totalEquity: "0",
        totalWalletBalance: "0",
        totalAvailableBalance: "0",
        totalMarginBalance: "0",
        totalPerpUPL: "0",
        totalInitialMargin: "0",
        totalMaintenanceMargin: "0",
        accountIMRate: "0",
        accountMMRate: "0",
        accountLTV: "0",
        coin: normalizedCoins,
      }],
    },
    time: toStr(wallet.timestamp),
  };
  
  return {
    info: normalizedInfo,
    timestamp: wallet.timestamp || Date.now(),
    datetime: wallet.datetime || new Date().toISOString(),
    free,
    used,
    total,
    debt: wallet.debt || {},
  };
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Normalize any exchange wallet data to unified Bybit-like format
 * 
 * @param wallet - Raw wallet data from any exchange
 * @param exchangeHint - Optional exchange name hint for detection
 * @returns Normalized wallet data in Bybit-like format
 * 
 * @example
 * ```ts
 * const rawOKXWallet = account.raw.wallet;
 * const normalized = normalizeWallet(rawOKXWallet, 'okx');
 * 
 * // Access unified structure
 * const equity = normalized.info.result.list[0].totalEquity;
 * const coins = normalized.info.result.list[0].coin;
 * ```
 */
export function normalizeWallet(
  wallet: RawWallet,
  exchangeHint?: string
): NormalizedWallet {
  // Detect exchange if not provided
  let exchange = exchangeHint?.toLowerCase();
  
  if (!exchange) {
    exchange = detectExchange(wallet);
  }
  
  // Normalize based on exchange
  switch (exchange) {
    case "okx":
      return normalizeOKXWallet(wallet);
    
    case "bybit":
      return normalizeBybitWallet(wallet);
    
    // Add more exchanges as needed
    // case "binance":
    //   return normalizeBinanceWallet(wallet);
    
    default:
      return normalizeGenericWallet(wallet);
  }
}

/**
 * Normalize account balance data from session storage
 * 
 * @param accountData - Full account data with raw.wallet
 * @returns Account data with normalized wallet
 */
export function normalizeAccountBalance<T extends { raw?: { wallet?: RawWallet; exchange?: string } }>(
  accountData: T
): T & { raw: { wallet: NormalizedWallet } } {
  const raw = accountData.raw;
  
  if (!raw?.wallet) {
    throw new Error("Account data missing wallet");
  }
  
  const normalizedWallet = normalizeWallet(raw.wallet, raw.exchange);
  
  return {
    ...accountData,
    raw: {
      ...raw,
      wallet: normalizedWallet,
    },
  };
}

/**
 * Get unified account summary from any wallet data
 * Convenience function for quick access to key metrics
 */
export function getAccountSummary(wallet: RawWallet, exchangeHint?: string): {
  totalEquity: number;
  totalWalletBalance: number;
  totalAvailableBalance: number;
  totalPerpUPL: number;
  accountType: string;
  coinCount: number;
} {
  const normalized = normalizeWallet(wallet, exchangeHint);
  const summary = normalized.info.result.list[0];
  
  return {
    totalEquity: toNum(summary.totalEquity),
    totalWalletBalance: toNum(summary.totalWalletBalance),
    totalAvailableBalance: toNum(summary.totalAvailableBalance),
    totalPerpUPL: toNum(summary.totalPerpUPL),
    accountType: summary.accountType,
    coinCount: summary.coin.length,
  };
}
