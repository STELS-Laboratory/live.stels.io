/**
 * Trading Hooks Index
 */

// Realtime Data
export {
  useRealtimeTicker,
  useRealtimeOrderBook,
  useRealtimeCandles,
  useMultipleTickers,
  useRealtimeAccountBalance,
  getTickerKey,
  getOrderBookKey,
  getCandlesKey,
  getAccountBalanceKey,
  AVAILABLE_TIMEFRAMES,
  type Timeframe,
  type RealtimeAccountBalance,
} from "./use-realtime-data";

// Hotkeys
export {
  useHotkeys,
  useHotkeysList,
  useHotkeysStore,
  DEFAULT_HOTKEYS,
  type HotkeyAction,
} from "./use-hotkeys";
