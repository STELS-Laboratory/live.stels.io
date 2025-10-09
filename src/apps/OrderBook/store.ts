/**
 * OrderBook application store
 * Manages order book state and preferences
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * OrderBook Store State
 */
interface OrderBookStoreState {
	/** Selected market */
	selectedMarket: string;
	/** Selected exchange for modal view */
	selectedExchange: string;
	/** Show price scales */
	showScales: boolean;
	/** Show volume bars */
	showVolumeBars: boolean;
	/** Order book depth (number of levels) */
	depth: 10 | 20 | 50;
	/** Highlight large orders */
	highlightLargeOrders: boolean;
	/** Large order threshold (percentage of max volume) */
	largeOrderThreshold: number;
	/** Auto-refresh interval (ms) */
	autoRefreshInterval: number;
	/** Enable auto-refresh */
	autoRefresh: boolean;
	/** Last update timestamp */
	lastUpdate: number;
}

/**
 * OrderBook Store Actions
 */
interface OrderBookStoreActions {
	/** Set selected market */
	setSelectedMarket: (market: string) => void;
	/** Set selected exchange */
	setSelectedExchange: (exchange: string) => void;
	/** Toggle price scales */
	toggleScales: () => void;
	/** Toggle volume bars */
	toggleVolumeBars: () => void;
	/** Set order book depth */
	setDepth: (depth: 10 | 20 | 50) => void;
	/** Toggle large order highlighting */
	toggleLargeOrders: () => void;
	/** Set large order threshold */
	setLargeOrderThreshold: (threshold: number) => void;
	/** Set auto-refresh interval */
	setAutoRefreshInterval: (interval: number) => void;
	/** Toggle auto-refresh */
	toggleAutoRefresh: () => void;
	/** Update last update timestamp */
	updateLastUpdate: () => void;
	/** Reset to defaults */
	resetToDefaults: () => void;
}

/**
 * OrderBook Store Type
 */
export type OrderBookStore = OrderBookStoreState & OrderBookStoreActions;

/**
 * Default state values
 */
const DEFAULT_STATE: OrderBookStoreState = {
	selectedMarket: "",
	selectedExchange: "",
	showScales: true,
	showVolumeBars: true,
	depth: 10,
	highlightLargeOrders: true,
	largeOrderThreshold: 0.4,
	autoRefreshInterval: 5000,
	autoRefresh: false,
	lastUpdate: Date.now(),
};

/**
 * OrderBook Store
 */
export const useOrderBookStore = create<OrderBookStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				...DEFAULT_STATE,

				// Actions
				setSelectedMarket: (market: string) => {
					set({ selectedMarket: market });
				},

				setSelectedExchange: (exchange: string) => {
					set({ selectedExchange: exchange });
				},

				toggleScales: () => {
					set((state) => ({ showScales: !state.showScales }));
				},

				toggleVolumeBars: () => {
					set((state) => ({ showVolumeBars: !state.showVolumeBars }));
				},

				setDepth: (depth: 10 | 20 | 50) => {
					set({ depth });
				},

				toggleLargeOrders: () => {
					set((state) => ({
						highlightLargeOrders: !state.highlightLargeOrders,
					}));
				},

				setLargeOrderThreshold: (threshold: number) => {
					set({ largeOrderThreshold: threshold });
				},

				setAutoRefreshInterval: (interval: number) => {
					set({ autoRefreshInterval: interval });
				},

				toggleAutoRefresh: () => {
					set((state) => ({ autoRefresh: !state.autoRefresh }));
				},

				updateLastUpdate: () => {
					set({ lastUpdate: Date.now() });
				},

				resetToDefaults: () => {
					set(DEFAULT_STATE);
				},
			}),
			{
				name: "orderbook-store",
			},
		),
		{
			name: "OrderBook Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useOrderBookSettings = () =>
	useOrderBookStore((state) => ({
		showScales: state.showScales,
		showVolumeBars: state.showVolumeBars,
		depth: state.depth,
		highlightLargeOrders: state.highlightLargeOrders,
		largeOrderThreshold: state.largeOrderThreshold,
	}));

export const useOrderBookRefresh = () =>
	useOrderBookStore((state) => ({
		autoRefreshInterval: state.autoRefreshInterval,
		autoRefresh: state.autoRefresh,
		lastUpdate: state.lastUpdate,
	}));

export const useOrderBookActions = () =>
	useOrderBookStore((state) => ({
		setSelectedMarket: state.setSelectedMarket,
		setSelectedExchange: state.setSelectedExchange,
		toggleScales: state.toggleScales,
		toggleVolumeBars: state.toggleVolumeBars,
		setDepth: state.setDepth,
		toggleLargeOrders: state.toggleLargeOrders,
		setLargeOrderThreshold: state.setLargeOrderThreshold,
		setAutoRefreshInterval: state.setAutoRefreshInterval,
		toggleAutoRefresh: state.toggleAutoRefresh,
		updateLastUpdate: state.updateLastUpdate,
		resetToDefaults: state.resetToDefaults,
	}));

