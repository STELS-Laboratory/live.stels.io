/**
 * Trading Layout Store
 * Manages panel sizes and layout preferences with persistence
 */

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { LayoutPreset } from "../types";

// ============================================
// Layout Presets Configuration
// ============================================

interface LayoutPresetConfig {
  main: number[]; // [left, center, right]
  left: number[]; // [top, bottom] in left column
  center: number[]; // [chart, orderEntry] in center column
  right: number[]; // [orders, trades] in right column
}

const LAYOUT_PRESETS: Record<LayoutPreset, LayoutPresetConfig> = {
  compact: {
    main: [20, 50, 30],
    left: [40, 60],
    center: [60, 40],
    right: [50, 50],
  },
  standard: {
    main: [25, 50, 25],
    left: [35, 65],
    center: [65, 35],
    right: [60, 40],
  },
  pro: {
    main: [20, 55, 25],
    left: [30, 70],
    center: [70, 30],
    right: [55, 45],
  },
};

// ============================================
// Store Interface
// ============================================

interface TradingLayoutStore {
  // State
  panelSizes: Record<string, number[]>;
  activePreset: LayoutPreset;
  isCollapsed: Record<string, boolean>;
  
  // Panel visibility
  showOrderBook: boolean;
  showOrderForm: boolean;
  isChartFullscreen: boolean;

  // Actions
  setPanelSizes: (group: string, sizes: number[]) => void;
  setPreset: (preset: LayoutPreset) => void;
  toggleCollapse: (panelId: string) => void;
  setCollapsed: (panelId: string, collapsed: boolean) => void;
  resetToPreset: (preset?: LayoutPreset) => void;
  
  // Panel visibility toggles
  toggleOrderBook: () => void;
  toggleOrderForm: () => void;
  toggleChartFullscreen: () => void;
  setShowOrderBook: (show: boolean) => void;
  setShowOrderForm: (show: boolean) => void;
  setChartFullscreen: (fullscreen: boolean) => void;
  
  // Getters
  getPanelSizes: (group: string) => number[];
  getPresetConfig: () => LayoutPresetConfig;
}

// ============================================
// Store Implementation
// ============================================

export const useTradingLayoutStore = create<TradingLayoutStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state from standard preset
        panelSizes: {
          main: LAYOUT_PRESETS.standard.main,
          left: LAYOUT_PRESETS.standard.left,
          center: LAYOUT_PRESETS.standard.center,
          right: LAYOUT_PRESETS.standard.right,
        },
        activePreset: "standard",
        isCollapsed: {},
        
        // Panel visibility defaults
        showOrderBook: true,
        showOrderForm: true,
        isChartFullscreen: false,

        // Set panel sizes for a specific group
        setPanelSizes: (group: string, sizes: number[]) => {
          set(
            (state) => ({
              panelSizes: {
                ...state.panelSizes,
                [group]: sizes,
              },
            }),
            false,
            "setPanelSizes"
          );
        },

        // Set layout preset
        setPreset: (preset: LayoutPreset) => {
          const config = LAYOUT_PRESETS[preset];
          set(
            {
              activePreset: preset,
              panelSizes: {
                main: config.main,
                left: config.left,
                center: config.center,
                right: config.right,
              },
            },
            false,
            "setPreset"
          );
        },

        // Toggle panel collapse state
        toggleCollapse: (panelId: string) => {
          set(
            (state) => ({
              isCollapsed: {
                ...state.isCollapsed,
                [panelId]: !state.isCollapsed[panelId],
              },
            }),
            false,
            "toggleCollapse"
          );
        },

        // Set specific collapse state
        setCollapsed: (panelId: string, collapsed: boolean) => {
          set(
            (state) => ({
              isCollapsed: {
                ...state.isCollapsed,
                [panelId]: collapsed,
              },
            }),
            false,
            "setCollapsed"
          );
        },

        // Reset to preset
        resetToPreset: (preset?: LayoutPreset) => {
          const targetPreset = preset || get().activePreset;
          const config = LAYOUT_PRESETS[targetPreset];
          set(
            {
              activePreset: targetPreset,
              panelSizes: {
                main: config.main,
                left: config.left,
                center: config.center,
                right: config.right,
              },
              isCollapsed: {},
            },
            false,
            "resetToPreset"
          );
        },

        // Panel visibility toggles
        toggleOrderBook: () => {
          set(
            (state) => ({ showOrderBook: !state.showOrderBook }),
            false,
            "toggleOrderBook"
          );
        },

        toggleOrderForm: () => {
          set(
            (state) => ({ showOrderForm: !state.showOrderForm }),
            false,
            "toggleOrderForm"
          );
        },

        toggleChartFullscreen: () => {
          set(
            (state) => ({ isChartFullscreen: !state.isChartFullscreen }),
            false,
            "toggleChartFullscreen"
          );
        },

        setShowOrderBook: (show: boolean) => {
          set({ showOrderBook: show }, false, "setShowOrderBook");
        },

        setShowOrderForm: (show: boolean) => {
          set({ showOrderForm: show }, false, "setShowOrderForm");
        },

        setChartFullscreen: (fullscreen: boolean) => {
          set({ isChartFullscreen: fullscreen }, false, "setChartFullscreen");
        },

        // Get panel sizes for a group (with fallback)
        getPanelSizes: (group: string) => {
          const { panelSizes, activePreset } = get();
          return panelSizes[group] || LAYOUT_PRESETS[activePreset][group as keyof LayoutPresetConfig] || [50, 50];
        },

        // Get current preset config
        getPresetConfig: () => {
          return LAYOUT_PRESETS[get().activePreset];
        },
      }),
      {
        name: "trading-layout-store",
        partialize: (state) => ({
          panelSizes: state.panelSizes,
          activePreset: state.activePreset,
          isCollapsed: state.isCollapsed,
          showOrderBook: state.showOrderBook,
          showOrderForm: state.showOrderForm,
          isChartFullscreen: state.isChartFullscreen,
        }),
      }
    ),
    { name: "trading-layout" }
  )
);

// Export preset names for UI
export const LAYOUT_PRESET_OPTIONS: { value: LayoutPreset; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "pro", label: "Pro" },
];
