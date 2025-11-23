/**
 * Market Indexes Application Store
 * Manages indexes data, selected index, timeframes, and UI state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  IndexCode,
  IndexData,
  IndexCandleData,
  Timeframe,
  IndexMetadata,
} from "./types";

/**
 * Index Store State
 */
interface IndexStoreState {
  /** All available indexes */
  indexes: Record<string, IndexData>;
  /** Candle data for indexes */
  candles: Record<string, IndexCandleData>;
  /** Currently selected index code */
  selectedIndex: IndexCode | null;
  /** Selected timeframe for charts */
  selectedTimeframe: Timeframe;
  /** UI state */
  ui: {
    /** Show detail panel */
    showDetailPanel: boolean;
    /** Show comparison mode */
    showComparison: boolean;
    /** Selected indexes for comparison */
    comparisonIndexes: IndexCode[];
    /** View mode: grid or list */
    viewMode: "grid" | "list";
    /** Search filter */
    searchFilter: string;
    /** Category filter */
    categoryFilter: string | null;
  };
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number | null;
  /** Cached indexes keys string for stable comparison */
  _indexesKeysCache: string;
}

/**
 * Index Store Actions
 */
interface IndexStoreActions {
  /** Load indexes from sessionStorage */
  loadIndexes: () => void;
  /** Set selected index */
  setSelectedIndex: (index: IndexCode | null) => void;
  /** Set selected timeframe */
  setSelectedTimeframe: (timeframe: Timeframe) => void;
  /** Toggle detail panel */
  toggleDetailPanel: () => void;
  /** Toggle comparison mode */
  toggleComparison: () => void;
  /** Add index to comparison */
  addToComparison: (index: IndexCode) => void;
  /** Remove index from comparison */
  removeFromComparison: (index: IndexCode) => void;
  /** Clear comparison */
  clearComparison: () => void;
  /** Set view mode */
  setViewMode: (mode: "grid" | "list") => void;
  /** Set search filter */
  setSearchFilter: (filter: string) => void;
  /** Set category filter */
  setCategoryFilter: (category: string | null) => void;
  /** Get index data by code */
  getIndexData: (code: IndexCode) => IndexData | null;
  /** Get candle data for index and timeframe */
  getCandleData: (code: IndexCode, timeframe: Timeframe) => IndexCandleData | null;
  /** Get all indexes metadata */
  getIndexesMetadata: () => IndexMetadata[];
  /** Clear error */
  clearError: () => void;
}

/**
 * Index Store Type
 */
export type IndexStore = IndexStoreState & IndexStoreActions;

/**
 * Index metadata configuration
 */
export const INDEXES_METADATA: Record<IndexCode, IndexMetadata> = {
  AOI: {
    code: "AOI",
    name: "Arbitrage Opportunity",
    description: "Identifies price differences between exchanges for arbitrage opportunities",
    category: "arbitrage",
    icon: "TrendingUp",
    color: "emerald",
  },
  BDI: {
    code: "BDI",
    name: "Bitcoin Dominance",
    description: "Bitcoin's market share as percentage of total cryptocurrency market capitalization",
    category: "market",
    icon: "Bitcoin",
    color: "amber",
  },
  CI: {
    code: "CI",
    name: "Correlation",
    description: "Measures price correlation between major cryptocurrencies",
    category: "technical",
    icon: "Network",
    color: "blue",
  },
  CEPI: {
    code: "CEPI",
    name: "Cross-Exchange Price",
    description: "Aggregates prices across multiple exchanges using VWAP",
    category: "market",
    icon: "BarChart3",
    color: "indigo",
  },
  EWI: {
    code: "EWI",
    name: "Equal Weighted",
    description: "Geometric mean of prices with equal weight for all components",
    category: "market",
    icon: "Equal",
    color: "purple",
  },
  ELI: {
    code: "ELI",
    name: "Exchange Liquidity",
    description: "Measures trading volume and liquidity across exchanges",
    category: "liquidity",
    icon: "Droplet",
    color: "cyan",
  },
  FGI: {
    code: "FGI",
    name: "Fear & Greed",
    description: "Measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed)",
    category: "sentiment",
    icon: "Brain",
    color: "rose",
  },
  LIQ: {
    code: "LIQ",
    name: "Liquidity",
    description: "Simple sum of prices for selected cryptocurrencies",
    category: "liquidity",
    icon: "Coins",
    color: "teal",
  },
  MBI: {
    code: "MBI",
    name: "Market Breadth",
    description: "Measures percentage of assets in uptrend vs downtrend",
    category: "market",
    icon: "TrendingUp",
    color: "green",
  },
  MCWI: {
    code: "MCWI",
    name: "Market Cap Weighted",
    description: "Price index weighted by market capitalization",
    category: "market",
    icon: "Weight",
    color: "orange",
  },
  MI: {
    code: "MI",
    name: "Momentum",
    description: "Average percentage change across selected assets",
    category: "technical",
    icon: "Zap",
    color: "yellow",
  },
  MECI: {
    code: "MECI",
    name: "Multi-Exchange Composite",
    description: "Comprehensive market index aggregating multiple assets across exchanges",
    category: "market",
    icon: "Layers",
    color: "violet",
  },
  PSI: {
    code: "PSI",
    name: "Price Spread",
    description: "Measures bid-ask spreads and price differences across exchanges",
    category: "liquidity",
    icon: "ArrowLeftRight",
    color: "slate",
  },
  PI: {
    code: "PI",
    name: "Price",
    description: "Arithmetic mean of prices across selected cryptocurrencies",
    category: "market",
    icon: "DollarSign",
    color: "emerald",
  },
  TSI: {
    code: "TSI",
    name: "Trend Strength",
    description: "Measures the strength and direction of market trends",
    category: "technical",
    icon: "Activity",
    color: "red",
  },
  VI: {
    code: "VI",
    name: "Volatility",
    description: "Average absolute price volatility across selected assets",
    category: "technical",
    icon: "Gauge",
    color: "amber",
  },
  VWPI: {
    code: "VWPI",
    name: "Volume Weighted Price",
    description: "Price index weighted by trading volume",
    category: "market",
    icon: "BarChart",
    color: "blue",
  },
};

/**
 * Parse index data from sessionStorage entry
 */
function parseIndexData(entry: unknown): IndexData | null {
  try {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "raw" in entry &&
      typeof entry.raw === "object" &&
      entry.raw !== null &&
      "index" in entry.raw
    ) {
      return entry.raw as IndexData;
    }
  } catch (error) {
    console.error("[IndexStore] Failed to parse index data:", error);
  }
  return null;
}

/**
 * Parse candle data from sessionStorage entry
 */
function parseCandleData(entry: unknown): IndexCandleData | null {
  try {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "raw" in entry &&
      typeof entry.raw === "object" &&
      entry.raw !== null &&
      "index" in entry.raw &&
      "candles" in entry.raw
    ) {
      const raw = entry.raw as {
        index: IndexCode;
        indexName: string;
        timeframe: Timeframe;
        candles: number[][];
        candleCount: number;
        lastUpdate: number;
      };

      // Convert candle arrays to Candle objects
      const candles = raw.candles.map((candle) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5] || 0,
      }));

      return {
        index: raw.index,
        indexName: raw.indexName,
        timeframe: raw.timeframe,
        candles,
        candleCount: raw.candleCount,
        lastUpdate: raw.lastUpdate,
      };
    }
  } catch (error) {
    console.error("[IndexStore] Failed to parse candle data:", error);
  }
  return null;
}

/**
 * Load indexes from sessionStorage
 */
function loadIndexesFromStorage(): {
  indexes: Record<string, IndexData>;
  candles: Record<string, IndexCandleData>;
} {
  const indexes: Record<string, IndexData> = {};
  const candles: Record<string, IndexCandleData> = {};

  try {
    // Iterate through all sessionStorage keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith("testnet.runtime.indexes.")) {
        continue;
      }

      try {
        const data = sessionStorage.getItem(key);
        if (!data) continue;

        const entry = JSON.parse(data) as {
          raw?: unknown;
        };

        // Check if it's candle data
        if (key.includes(".candles.")) {
          const candleData = parseCandleData(entry);
          if (candleData) {
            const candleKey = `${candleData.index}-${candleData.timeframe}`;
            candles[candleKey] = candleData;
          }
        } else {
          // Regular index data
          const indexData = parseIndexData(entry);
          if (indexData) {
            indexes[indexData.index] = indexData;
          }
        }
      } catch (error) {
        console.warn(`[IndexStore] Failed to parse entry ${key}:`, error);
      }
    }
  } catch (error) {
    console.error("[IndexStore] Failed to load indexes:", error);
  }

  return { indexes, candles };
}

/**
 * Index Store
 */
export const useIndexStore = create<IndexStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        indexes: {},
        candles: {},
        selectedIndex: null,
        selectedTimeframe: "15m",
        ui: {
          showDetailPanel: false,
          showComparison: false,
          comparisonIndexes: [],
          viewMode: "grid",
          searchFilter: "",
          categoryFilter: null,
        },
        loading: false,
        error: null,
        lastUpdate: null,
        _indexesKeysCache: "",

        // Actions
        loadIndexes: (): void => {
          const currentState = get();
          
          // Only set loading if not already loading
          if (!currentState.loading) {
            set({ loading: true, error: null });
          }

          try {
            const { indexes, candles } = loadIndexesFromStorage();
            
            // Quick check: compare keys and timestamps
            const currentIndexKeys = Object.keys(currentState.indexes).sort().join(',');
            const newIndexKeys = Object.keys(indexes).sort().join(',');
            const indexesChanged = currentIndexKeys !== newIndexKeys;
            
            // Check if any index data actually changed by comparing timestamps
            let dataChanged = indexesChanged;
            if (!dataChanged && currentIndexKeys === newIndexKeys) {
              // Compare timestamps of existing indexes
              for (const key of Object.keys(indexes)) {
                const currentIndex = currentState.indexes[key];
                const newIndex = indexes[key];
                if (currentIndex?.timestamp !== newIndex?.timestamp) {
                  dataChanged = true;
                  break;
                }
              }
            }
            
            // Check candles - compare keys
            const currentCandleKeys = Object.keys(currentState.candles).sort().join(',');
            const newCandleKeys = Object.keys(candles).sort().join(',');
            const candlesChanged = currentCandleKeys !== newCandleKeys;
            
            // Only update if data changed
            if (dataChanged || candlesChanged) {
              // Update cache with new keys string
              const newKeysString = Object.keys(indexes).sort().join(',');
              set({
                indexes,
                candles,
                loading: false,
                lastUpdate: Date.now(),
                _indexesKeysCache: newKeysString,
              });
            } else {
              // If nothing changed, just set loading to false without touching indexes/candles
              // This prevents creating new object references when data hasn't changed
              if (currentState.loading) {
                set({ loading: false });
              }
            }
          } catch (error) {
            set({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load indexes",
            });
          }
        },

        setSelectedIndex: (index: IndexCode | null): void => {
          set({ selectedIndex: index });
        },

        setSelectedTimeframe: (timeframe: Timeframe): void => {
          set({ selectedTimeframe: timeframe });
        },

        toggleDetailPanel: (): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              showDetailPanel: !state.ui.showDetailPanel,
            },
          }));
        },

        toggleComparison: (): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              showComparison: !state.ui.showComparison,
            },
          }));
        },

        addToComparison: (index: IndexCode): void => {
          set((state) => {
            if (state.ui.comparisonIndexes.includes(index)) {
              return state;
            }
            return {
              ui: {
                ...state.ui,
                comparisonIndexes: [...state.ui.comparisonIndexes, index],
              },
            };
          });
        },

        removeFromComparison: (index: IndexCode): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              comparisonIndexes: state.ui.comparisonIndexes.filter(
                (i) => i !== index,
              ),
            },
          }));
        },

        clearComparison: (): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              comparisonIndexes: [],
            },
          }));
        },

        setViewMode: (mode: "grid" | "list"): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              viewMode: mode,
            },
          }));
        },

        setSearchFilter: (filter: string): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              searchFilter: filter,
            },
          }));
        },

        setCategoryFilter: (category: string | null): void => {
          set((state) => ({
            ui: {
              ...state.ui,
              categoryFilter: category,
            },
          }));
        },

        getIndexData: (code: IndexCode): IndexData | null => {
          return get().indexes[code] || null;
        },

        getCandleData: (
          code: IndexCode,
          timeframe: Timeframe,
        ): IndexCandleData | null => {
          const key = `${code}-${timeframe}`;
          return get().candles[key] || null;
        },

        getIndexesMetadata: (): IndexMetadata[] => {
          const state = get();
          return Object.values(INDEXES_METADATA).filter((metadata) => {
            // Filter by search
            if (state.ui.searchFilter) {
              const searchLower = state.ui.searchFilter.toLowerCase();
              if (
                !metadata.name.toLowerCase().includes(searchLower) &&
                !metadata.code.toLowerCase().includes(searchLower) &&
                !metadata.description.toLowerCase().includes(searchLower)
              ) {
                return false;
              }
            }

            // Filter by category
            if (state.ui.categoryFilter) {
              if (metadata.category !== state.ui.categoryFilter) {
                return false;
              }
            }

            // Only show indexes that have data
            return state.indexes[metadata.code] !== undefined;
          });
        },

        clearError: (): void => {
          set({ error: null });
        },
      }),
      {
        name: "indexes-store",
        partialize: (state) => ({
          selectedIndex: state.selectedIndex,
          selectedTimeframe: state.selectedTimeframe,
          ui: {
            showDetailPanel: state.ui.showDetailPanel,
            showComparison: state.ui.showComparison,
            comparisonIndexes: state.ui.comparisonIndexes,
            viewMode: state.ui.viewMode,
            searchFilter: state.ui.searchFilter,
            categoryFilter: state.ui.categoryFilter,
          },
          // Don't persist cache - it will be recalculated on load
        }),
      },
    ),
    {
      name: "Indexes Store",
    },
  ),
);

/**
 * Hooks for specific parts of the store
 */
export const useIndexes = () => useIndexStore((state) => state.indexes);
export const useSelectedIndex = () =>
  useIndexStore((state) => state.selectedIndex);
export const useIndexActions = () =>
  useIndexStore((state) => ({
    loadIndexes: state.loadIndexes,
    setSelectedIndex: state.setSelectedIndex,
    setSelectedTimeframe: state.setSelectedTimeframe,
    toggleDetailPanel: state.toggleDetailPanel,
    toggleComparison: state.toggleComparison,
    addToComparison: state.addToComparison,
    removeFromComparison: state.removeFromComparison,
    clearComparison: state.clearComparison,
    setViewMode: state.setViewMode,
    setSearchFilter: state.setSearchFilter,
    setCategoryFilter: state.setCategoryFilter,
    getIndexData: state.getIndexData,
    getCandleData: state.getCandleData,
    getIndexesMetadata: state.getIndexesMetadata,
    clearError: state.clearError,
  }));

