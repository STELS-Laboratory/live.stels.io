/**
 * Trading Hotkeys Hook
 * Keyboard shortcuts for trading operations
 */

import { useEffect, useCallback, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================
// Hotkey Definitions
// ============================================

export interface HotkeyAction {
  id: string;
  name: string;
  description: string;
  defaultKey: string;
  category: "trading" | "navigation" | "ui";
}

export const DEFAULT_HOTKEYS: HotkeyAction[] = [
  // Trading
  { id: "buy", name: "Buy", description: "Set order side to Buy", defaultKey: "b", category: "trading" },
  { id: "sell", name: "Sell", description: "Set order side to Sell", defaultKey: "s", category: "trading" },
  { id: "market", name: "Market Order", description: "Set order type to Market", defaultKey: "m", category: "trading" },
  { id: "limit", name: "Limit Order", description: "Set order type to Limit", defaultKey: "l", category: "trading" },
  { id: "cancel_all", name: "Cancel All", description: "Cancel all open orders", defaultKey: "c", category: "trading" },
  
  // Quick amounts
  { id: "amount_25", name: "25% Amount", description: "Set amount to 25% of balance", defaultKey: "1", category: "trading" },
  { id: "amount_50", name: "50% Amount", description: "Set amount to 50% of balance", defaultKey: "2", category: "trading" },
  { id: "amount_75", name: "75% Amount", description: "Set amount to 75% of balance", defaultKey: "3", category: "trading" },
  { id: "amount_100", name: "100% Amount", description: "Set amount to 100% of balance", defaultKey: "4", category: "trading" },
  
  // Navigation
  { id: "focus_price", name: "Focus Price", description: "Focus on price input", defaultKey: "p", category: "navigation" },
  { id: "focus_amount", name: "Focus Amount", description: "Focus on amount input", defaultKey: "a", category: "navigation" },
  
  // UI
  { id: "refresh", name: "Refresh", description: "Refresh all data", defaultKey: "r", category: "ui" },
  { id: "toggle_orderbook", name: "Toggle Order Book", description: "Toggle order book view", defaultKey: "o", category: "ui" },
  { id: "escape", name: "Close/Cancel", description: "Close dialogs or cancel", defaultKey: "Escape", category: "ui" },
];

// ============================================
// Hotkeys Store
// ============================================

interface HotkeysStore {
  bindings: Record<string, string>;
  setBinding: (actionId: string, key: string) => void;
  resetBindings: () => void;
  getKeyForAction: (actionId: string) => string;
}

export const useHotkeysStore = create<HotkeysStore>()(
  persist(
    (set, get) => ({
      bindings: {},

      setBinding: (actionId, key) => {
        set((state) => ({
          bindings: {
            ...state.bindings,
            [actionId]: key,
          },
        }));
      },

      resetBindings: () => {
        set({ bindings: {} });
      },

      getKeyForAction: (actionId) => {
        const { bindings } = get();
        const customKey = bindings[actionId];
        if (customKey) return customKey;

        const action = DEFAULT_HOTKEYS.find((h) => h.id === actionId);
        return action?.defaultKey || "";
      },
    }),
    {
      name: "trading-hotkeys-store",
    }
  )
);

// ============================================
// Hook Types
// ============================================

type HotkeyHandler = () => void;

interface UseHotkeysOptions {
  enabled?: boolean;
}

interface HotkeyHandlers {
  onBuy?: HotkeyHandler;
  onSell?: HotkeyHandler;
  onMarket?: HotkeyHandler;
  onLimit?: HotkeyHandler;
  onCancelAll?: HotkeyHandler;
  onAmount25?: HotkeyHandler;
  onAmount50?: HotkeyHandler;
  onAmount75?: HotkeyHandler;
  onAmount100?: HotkeyHandler;
  onFocusPrice?: HotkeyHandler;
  onFocusAmount?: HotkeyHandler;
  onRefresh?: HotkeyHandler;
  onToggleOrderbook?: HotkeyHandler;
  onEscape?: HotkeyHandler;
}

// ============================================
// Main Hook
// ============================================

export function useHotkeys(
  handlers: HotkeyHandlers,
  options: UseHotkeysOptions = {}
) {
  const { enabled = true } = options;
  const getKeyForAction = useHotkeysStore((s) => s.getKeyForAction);

  // Build key -> handler map
  const keyMap = useMemo(() => {
    const map = new Map<string, HotkeyHandler>();

    const actionHandlerMap: Record<string, HotkeyHandler | undefined> = {
      buy: handlers.onBuy,
      sell: handlers.onSell,
      market: handlers.onMarket,
      limit: handlers.onLimit,
      cancel_all: handlers.onCancelAll,
      amount_25: handlers.onAmount25,
      amount_50: handlers.onAmount50,
      amount_75: handlers.onAmount75,
      amount_100: handlers.onAmount100,
      focus_price: handlers.onFocusPrice,
      focus_amount: handlers.onFocusAmount,
      refresh: handlers.onRefresh,
      toggle_orderbook: handlers.onToggleOrderbook,
      escape: handlers.onEscape,
    };

    for (const [actionId, handler] of Object.entries(actionHandlerMap)) {
      if (handler) {
        const key = getKeyForAction(actionId).toLowerCase();
        map.set(key, handler);
      }
    }

    return map;
  }, [handlers, getKeyForAction]);

  // Handle keydown
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (event.key !== "Escape") return;
      }

      // Don't trigger with modifiers (except for special keys)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const handler = keyMap.get(key);

      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [enabled, keyMap]
  );

  // Attach event listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

// ============================================
// Utility Hook for Getting All Hotkeys
// ============================================

export function useHotkeysList() {
  const { bindings, setBinding, resetBindings, getKeyForAction } = useHotkeysStore();

  const hotkeysList = useMemo(() => {
    return DEFAULT_HOTKEYS.map((action) => ({
      ...action,
      currentKey: getKeyForAction(action.id),
      isCustom: !!bindings[action.id],
    }));
  }, [bindings, getKeyForAction]);

  return {
    hotkeys: hotkeysList,
    setBinding,
    resetBindings,
    categories: ["trading", "navigation", "ui"] as const,
  };
}
