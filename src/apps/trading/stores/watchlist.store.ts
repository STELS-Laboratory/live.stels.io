/**
 * Watchlist Store
 * Manages watchlist items with persistence
 */

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { WatchlistItem } from "../types";

// ============================================
// Default Watchlist Items
// ============================================

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "BTC/USDT", exchange: "bybit", market: "spot", isFavorite: true },
  { symbol: "ETH/USDT", exchange: "bybit", market: "spot", isFavorite: true },
  { symbol: "SOL/USDT", exchange: "bybit", market: "spot", isFavorite: false },
  { symbol: "BNB/USDT", exchange: "bybit", market: "spot", isFavorite: false },
  { symbol: "XRP/USDT", exchange: "bybit", market: "spot", isFavorite: false },
];

// ============================================
// Store Interface
// ============================================

interface WatchlistStore {
  // State
  items: WatchlistItem[];

  // Actions
  addItem: (item: Omit<WatchlistItem, "isFavorite">) => void;
  removeItem: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
  resetToDefault: () => void;

  // Getters
  hasItem: (symbol: string) => boolean;
  getFavorites: () => WatchlistItem[];
}

// ============================================
// Store Implementation
// ============================================

export const useWatchlistStore = create<WatchlistStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: DEFAULT_WATCHLIST,

        // Add item to watchlist
        addItem: (item) => {
          const { items, hasItem } = get();
          if (hasItem(item.symbol)) return;

          set(
            {
              items: [...items, { ...item, isFavorite: false }],
            },
            false,
            "addItem"
          );
        },

        // Remove item from watchlist
        removeItem: (symbol) => {
          set(
            (state) => ({
              items: state.items.filter((item) => item.symbol !== symbol),
            }),
            false,
            "removeItem"
          );
        },

        // Toggle favorite status
        toggleFavorite: (symbol) => {
          set(
            (state) => ({
              items: state.items.map((item) =>
                item.symbol === symbol
                  ? { ...item, isFavorite: !item.isFavorite }
                  : item
              ),
            }),
            false,
            "toggleFavorite"
          );
        },

        // Reorder items (for drag-and-drop)
        reorderItems: (fromIndex, toIndex) => {
          set(
            (state) => {
              const newItems = [...state.items];
              const [removed] = newItems.splice(fromIndex, 1);
              newItems.splice(toIndex, 0, removed);
              return { items: newItems };
            },
            false,
            "reorderItems"
          );
        },

        // Clear all items
        clearAll: () => {
          set({ items: [] }, false, "clearAll");
        },

        // Reset to default watchlist
        resetToDefault: () => {
          set({ items: DEFAULT_WATCHLIST }, false, "resetToDefault");
        },

        // Check if symbol exists in watchlist
        hasItem: (symbol) => {
          return get().items.some((item) => item.symbol === symbol);
        },

        // Get favorite items only
        getFavorites: () => {
          return get().items.filter((item) => item.isFavorite);
        },
      }),
      {
        name: "trading-watchlist-store",
        partialize: (state) => ({
          items: state.items,
        }),
      }
    ),
    { name: "watchlist" }
  )
);
