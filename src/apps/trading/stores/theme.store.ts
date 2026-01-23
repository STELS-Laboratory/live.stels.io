/**
 * Trading Theme Store
 * Manages trading color preferences with presets
 */

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// ============================================
// Types
// ============================================

export type TradingColorScheme = "default" | "binance" | "tradingview" | "inverse" | "custom";

export interface TradingThemeColors {
  buy: string;
  sell: string;
  buyBg: string;
  sellBg: string;
}

export interface TradingThemePreset {
  name: string;
  colors: TradingThemeColors;
}

// ============================================
// Presets
// ============================================

export const TRADING_THEME_PRESETS: Record<Exclude<TradingColorScheme, "custom">, TradingThemePreset> = {
  default: {
    name: "Default (Green/Red)",
    colors: {
      buy: "#22c55e",
      sell: "#ef4444",
      buyBg: "rgba(34, 197, 94, 0.1)",
      sellBg: "rgba(239, 68, 68, 0.1)",
    },
  },
  binance: {
    name: "Binance (Teal/Pink)",
    colors: {
      buy: "#02c076",
      sell: "#f84960",
      buyBg: "rgba(2, 192, 118, 0.1)",
      sellBg: "rgba(248, 73, 96, 0.1)",
    },
  },
  tradingview: {
    name: "TradingView (Teal/Coral)",
    colors: {
      buy: "#26a69a",
      sell: "#ef5350",
      buyBg: "rgba(38, 166, 154, 0.1)",
      sellBg: "rgba(239, 83, 80, 0.1)",
    },
  },
  inverse: {
    name: "Inverse (Red/Green)",
    colors: {
      buy: "#ef4444",
      sell: "#22c55e",
      buyBg: "rgba(239, 68, 68, 0.1)",
      sellBg: "rgba(34, 197, 94, 0.1)",
    },
  },
};

// ============================================
// Store Interface
// ============================================

interface TradingThemeStore {
  // State
  colorScheme: TradingColorScheme;
  customColors: TradingThemeColors;

  // Computed
  getCurrentColors: () => TradingThemeColors;

  // Actions
  setColorScheme: (scheme: TradingColorScheme) => void;
  setCustomColors: (colors: Partial<TradingThemeColors>) => void;
  resetToDefault: () => void;

  // Apply theme to CSS variables
  applyTheme: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useTradingThemeStore = create<TradingThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        colorScheme: "default",
        customColors: {
          buy: "#22c55e",
          sell: "#ef4444",
          buyBg: "rgba(34, 197, 94, 0.1)",
          sellBg: "rgba(239, 68, 68, 0.1)",
        },

        // Get current active colors
        getCurrentColors: () => {
          const { colorScheme, customColors } = get();
          if (colorScheme === "custom") {
            return customColors;
          }
          return TRADING_THEME_PRESETS[colorScheme].colors;
        },

        // Set color scheme
        setColorScheme: (scheme: TradingColorScheme) => {
          set({ colorScheme: scheme }, false, "setColorScheme");
          // Apply theme immediately
          get().applyTheme();
        },

        // Set custom colors
        setCustomColors: (colors: Partial<TradingThemeColors>) => {
          set(
            (state) => ({
              customColors: { ...state.customColors, ...colors },
              colorScheme: "custom" as const,
            }),
            false,
            "setCustomColors"
          );
          // Apply theme immediately
          get().applyTheme();
        },

        // Reset to default
        resetToDefault: () => {
          set(
            {
              colorScheme: "default",
              customColors: TRADING_THEME_PRESETS.default.colors,
            },
            false,
            "resetToDefault"
          );
          get().applyTheme();
        },

        // Apply theme to CSS variables
        applyTheme: () => {
          const colors = get().getCurrentColors();
          const root = document.documentElement;

          // Apply trading colors to CSS variables
          root.style.setProperty("--trading-buy", colors.buy);
          root.style.setProperty("--trading-sell", colors.sell);
          root.style.setProperty("--trading-buy-bg", colors.buyBg);
          root.style.setProperty("--trading-sell-bg", colors.sellBg);
          
          // Calculate hover colors (slightly more opaque)
          const buyHover = colors.buyBg.replace("0.1)", "0.2)");
          const sellHover = colors.sellBg.replace("0.1)", "0.2)");
          root.style.setProperty("--trading-buy-hover", buyHover);
          root.style.setProperty("--trading-sell-hover", sellHover);

          // Order book depth colors
          const buyDepth = colors.buyBg.replace("0.1)", "0.15)");
          const sellDepth = colors.sellBg.replace("0.1)", "0.15)");
          root.style.setProperty("--orderbook-bid-depth", buyDepth);
          root.style.setProperty("--orderbook-ask-depth", sellDepth);

          // Chart colors
          root.style.setProperty("--chart-up", colors.buy);
          root.style.setProperty("--chart-down", colors.sell);
        },
      }),
      {
        name: "trading-theme-store",
        partialize: (state) => ({
          colorScheme: state.colorScheme,
          customColors: state.customColors,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme after rehydration
          if (state) {
            state.applyTheme();
          }
        },
      }
    ),
    { name: "trading-theme" }
  )
);

// Export preset options for UI
export const THEME_PRESET_OPTIONS = [
  { value: "default", label: "Default (Green/Red)" },
  { value: "binance", label: "Binance (Teal/Pink)" },
  { value: "tradingview", label: "TradingView (Teal/Coral)" },
  { value: "inverse", label: "Inverse (Red/Green)" },
  { value: "custom", label: "Custom" },
] as const;
