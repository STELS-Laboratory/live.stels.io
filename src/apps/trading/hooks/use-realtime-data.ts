/**
 * Optimized Realtime Data Hooks for Trading Terminal
 * Provides subscription to KV store data via sessionStorage with proper caching
 *
 * KV Key formats:
 * - Ticker: snaga.runtime.ticker.{SYMBOL}.{EXCHANGE}.{MARKET}
 * - Order Book: snaga.runtime.book.{SYMBOL}.{EXCHANGE}.{MARKET}
 * - Candles: snaga.runtime.candles.{SYMBOL}.{EXCHANGE}.{MARKET}.{TIMEFRAME}
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  RealtimeTicker,
  RealtimeOrderBook,
  RealtimeCandles,
} from "../types";

// ============================================
// Key Generation Utilities
// ============================================

/**
 * Generate KV key for ticker data
 */
export function getTickerKey(
  symbol: string,
  exchange: string,
  market: string
): string {
  return `snaga.runtime.ticker.${symbol}.${exchange}.${market}`;
}

/**
 * Generate KV key for order book data
 */
export function getOrderBookKey(
  symbol: string,
  exchange: string,
  market: string
): string {
  return `snaga.runtime.book.${symbol}.${exchange}.${market}`;
}

/**
 * Generate KV key for candles data
 */
export function getCandlesKey(
  symbol: string,
  exchange: string,
  market: string,
  timeframe: string
): string {
  return `snaga.runtime.candles.${symbol}.${exchange}.${market}.${timeframe}`;
}

// ============================================
// Optimized Session Storage Hook
// ============================================

interface UseSessionStorageOptions {
  /** Polling interval in ms (default: 1000) */
  interval?: number;
  /** Enable polling (default: true) */
  enabled?: boolean;
}

/**
 * Optimized hook for reading sessionStorage with proper caching
 * Uses polling with hash comparison to minimize re-renders
 */
function useSessionStorageData<T>(
  key: string,
  options: UseSessionStorageOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
} {
  const { interval = 1000, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Track previous raw string to avoid unnecessary parsing and state updates
  const prevRawRef = useRef<string | null>(null);

  const fetchData = useCallback(() => {
    if (!key || !enabled) {
      setLoading(false);
      return;
    }

    try {
      const raw = sessionStorage.getItem(key);

      // Skip if value hasn't changed (string comparison is fast)
      if (raw === prevRawRef.current) {
        return;
      }

      prevRawRef.current = raw;

      if (!raw) {
        // No data yet - keep loading state if we never had data
        if (data === null) {
          setLoading(true);
        }
        return;
      }

      const parsed = JSON.parse(raw) as T;
      setData(parsed);
      setLastUpdate(Date.now());
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse data");
      setLoading(false);
    }
  }, [key, enabled, data]);

  // Setup polling
  useEffect(() => {
    if (!enabled || !key) {
      setLoading(false);
      return;
    }

    // Reset state when key changes
    setData(null);
    setLoading(true);
    setError(null);
    setLastUpdate(null);
    prevRawRef.current = null;

    // Initial fetch
    fetchData();

    // Start polling
    const intervalId = setInterval(fetchData, interval);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, interval]); // fetchData excluded to avoid re-creating interval

  return { data, loading, error, lastUpdate };
}

// ============================================
// Specialized Realtime Hooks
// ============================================

interface UseRealtimeDataResult<T> {
  data: T | null;
  raw: T extends { raw: infer R } ? R | null : null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  latency: number | null;
}

/**
 * Hook for realtime ticker data
 *
 * @example
 * const { data, raw, loading } = useRealtimeTicker("BTC/USDT", "bybit", "spot");
 * // raw.last, raw.bid, raw.ask, raw.change, raw.percentage, etc.
 */
export function useRealtimeTicker(
  symbol: string,
  exchange: string,
  market: string,
  options?: UseSessionStorageOptions
): UseRealtimeDataResult<RealtimeTicker> {
  const key = useMemo(
    () => (symbol && exchange && market ? getTickerKey(symbol, exchange, market) : ""),
    [symbol, exchange, market]
  );

  const { data, loading, error, lastUpdate } = useSessionStorageData<RealtimeTicker>(
    key,
    options
  );

  return useMemo(
    () => ({
      data,
      raw: data?.raw ?? null,
      loading,
      error,
      lastUpdate,
      latency: data?.raw?.latency ?? null,
    }),
    [data, loading, error, lastUpdate]
  );
}

/**
 * Hook for realtime order book data
 *
 * @example
 * const { data, raw, loading } = useRealtimeOrderBook("BTC/USDT", "bybit", "spot");
 * // raw.bids: [[price, amount], ...], raw.asks: [[price, amount], ...]
 */
export function useRealtimeOrderBook(
  symbol: string,
  exchange: string,
  market: string,
  options?: UseSessionStorageOptions
): UseRealtimeDataResult<RealtimeOrderBook> {
  const key = useMemo(
    () => (symbol && exchange && market ? getOrderBookKey(symbol, exchange, market) : ""),
    [symbol, exchange, market]
  );

  const { data, loading, error, lastUpdate } = useSessionStorageData<RealtimeOrderBook>(
    key,
    options
  );

  return useMemo(
    () => ({
      data,
      raw: data?.raw ?? null,
      loading,
      error,
      lastUpdate,
      latency: data?.raw?.latency ?? null,
    }),
    [data, loading, error, lastUpdate]
  );
}

/**
 * Hook for realtime candles (OHLCV) data
 *
 * @example
 * const { data, raw, loading } = useRealtimeCandles("BTC/USDT", "bybit", "spot", "1h");
 * // raw.candles: [[time, open, high, low, close, volume], ...]
 */
export function useRealtimeCandles(
  symbol: string,
  exchange: string,
  market: string,
  timeframe: string,
  options?: UseSessionStorageOptions
): UseRealtimeDataResult<RealtimeCandles> {
  const key = useMemo(
    () =>
      symbol && exchange && market && timeframe
        ? getCandlesKey(symbol, exchange, market, timeframe)
        : "",
    [symbol, exchange, market, timeframe]
  );

  const { data, loading, error, lastUpdate } = useSessionStorageData<RealtimeCandles>(
    key,
    options
  );

  return useMemo(
    () => ({
      data,
      raw: data?.raw ?? null,
      loading,
      error,
      lastUpdate,
      latency: data?.raw?.latency ?? null,
    }),
    [data, loading, error, lastUpdate]
  );
}

// ============================================
// Multi-Symbol Hook (for Watchlist)
// ============================================

interface WatchlistTickerItem {
  symbol: string;
  exchange: string;
  market: string;
}

/**
 * Hook for watching multiple tickers (for watchlist)
 * Returns a map of symbol -> ticker data
 */
export function useMultipleTickers(
  items: WatchlistTickerItem[],
  options?: UseSessionStorageOptions
): Map<string, RealtimeTicker["raw"] | null> {
  const [tickers, setTickers] = useState<Map<string, RealtimeTicker["raw"] | null>>(
    () => new Map()
  );

  const { interval = 1000, enabled = true } = options || {};

  // Memoize items key to avoid unnecessary re-runs
  const itemsKey = useMemo(
    () => items.map((i) => `${i.symbol}:${i.exchange}:${i.market}`).join("|"),
    [items]
  );

  // Store items in ref to avoid dependency issues
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Track previous values to avoid unnecessary state updates
  const prevValuesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled || itemsRef.current.length === 0) return;

    const fetchAll = () => {
      const currentItems = itemsRef.current;
      let hasChanges = false;
      const newTickers = new Map<string, RealtimeTicker["raw"] | null>();
      const newPrevValues = new Map<string, string>();

      for (const item of currentItems) {
        const key = getTickerKey(item.symbol, item.exchange, item.market);
        try {
          const raw = sessionStorage.getItem(key);
          newPrevValues.set(item.symbol, raw || "");

          // Check if this item changed
          if (raw !== prevValuesRef.current.get(item.symbol)) {
            hasChanges = true;
          }

          if (raw) {
            const parsed = JSON.parse(raw) as RealtimeTicker;
            newTickers.set(item.symbol, parsed.raw);
          } else {
            newTickers.set(item.symbol, null);
          }
        } catch {
          newTickers.set(item.symbol, null);
        }
      }

      prevValuesRef.current = newPrevValues;

      // Only update state if something changed
      if (hasChanges || tickers.size !== newTickers.size) {
        setTickers(newTickers);
      }
    };

    // Reset on items change
    prevValuesRef.current = new Map();
    fetchAll();

    const intervalId = setInterval(fetchAll, interval);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, interval, enabled]); // tickers excluded to avoid loop

  return tickers;
}

// ============================================
// Account Balance Hook
// ============================================

/**
 * Generate KV key for account balance data
 * Key format: account.balance.{address}.{exchange}.{nid}
 */
export function getAccountBalanceKey(
  address: string,
  exchange: string,
  nid: string
): string {
  return `account.balance.${address}.${exchange}.${nid}`;
}

/**
 * Realtime account balance data from KV store
 */
export interface RealtimeAccountBalance {
  channel: string;
  module: "balance";
  widget: string;
  raw: {
    nid: string;
    address: string;
    exchange: string;
    connection: boolean;
    timestamp: number;
    lastBalanceSync: number;
    wallet: {
      timestamp: number;
      datetime: string;
      free: Record<string, number>;
      used: Record<string, number>;
      total: Record<string, number>;
      debt?: Record<string, number>;
      info?: unknown;
      [currency: string]: unknown;
    };
    workers?: string[];
    note?: string;
  };
  timestamp: number;
}

/**
 * Hook for realtime account balance data
 * 
 * @example
 * const { data, balances, loading } = useRealtimeAccountBalance("chabanov", "bybit", "g-gnl");
 */
export function useRealtimeAccountBalance(
  address: string,
  exchange: string,
  nid: string,
  options?: UseSessionStorageOptions
): {
  data: RealtimeAccountBalance | null;
  balances: Record<string, { free: number; used: number; total: number }>;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  isConnected: boolean;
} {
  const key = useMemo(
    () => (address && exchange && nid ? getAccountBalanceKey(address, exchange, nid) : ""),
    [address, exchange, nid]
  );

  const { data, loading, error, lastUpdate } = useSessionStorageData<RealtimeAccountBalance>(
    key,
    options
  );

  // Parse balances into normalized format
  const balances = useMemo(() => {
    if (!data?.raw?.wallet) return {};

    const wallet = data.raw.wallet;
    const result: Record<string, { free: number; used: number; total: number }> = {};

    // Get all currency keys from total object
    const currencies = Object.keys(wallet.total || {});

    for (const currency of currencies) {
      const total = wallet.total?.[currency] ?? 0;
      // Only include currencies with non-zero total
      if (total > 0) {
        result[currency] = {
          free: wallet.free?.[currency] ?? 0,
          used: wallet.used?.[currency] ?? 0,
          total,
        };
      }
    }

    return result;
  }, [data]);

  return useMemo(
    () => ({
      data,
      balances,
      loading,
      error,
      lastUpdate,
      isConnected: data?.raw?.connection ?? false,
    }),
    [data, balances, loading, error, lastUpdate]
  );
}

// ============================================
// Available Timeframes
// ============================================

export const AVAILABLE_TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
] as const;

export type Timeframe = (typeof AVAILABLE_TIMEFRAMES)[number]["value"];
