/**
 * Trading Terminal Store
 * Zustand store for managing trading terminal state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
	AccountBalance,
	ExchangeAccount,
	OrderBook,
	Ticker,
	TradingOrder,
	TradingStore,
	TradingTrade,
} from "./types";

const initialState = {
	selectedAccount: null as ExchangeAccount | null,
	selectedSymbol: "SOL/USDT" as string, // Default to SOL/USDT (not null)
	orders: [] as TradingOrder[],
	trades: [] as TradingTrade[],
	orderBook: null as OrderBook | null,
	ticker: null as Ticker | null,
	balance: null as AccountBalance | null,
	accounts: [] as ExchangeAccount[],
	loading: false,
	error: null as string | null,
	// UI State
	activeTab: "orderbook" as string,
	activeOrdersTradesTab: "orders" as string,
	autoRefreshEnabled: true as boolean,
	autoRefreshInterval: 10000 as number, // 10 seconds
	lastUpdateTime: null as number | null,
	selectedPrice: null as number | null,
	// View-only mode (when user has no accounts but can view markets)
	isViewOnly: false as boolean,
	// Selected exchange (for view-only mode when no account)
	selectedExchange: null as string | null,
};

export const useTradingStore = create<TradingStore>()(
	devtools(
		persist(
			(set) => ({
				...initialState,

				setSelectedAccount: (account: ExchangeAccount | null): void => {
					set({ selectedAccount: account });
				},

				setSelectedSymbol: (symbol: string | null): void => {
					set({ selectedSymbol: symbol });
				},

				setOrders: (orders: TradingOrder[]): void => {
					set({ orders });
				},

				setTrades: (trades: TradingTrade[]): void => {
					set({ trades });
				},

				setOrderBook: (orderBook: OrderBook | null): void => {
					set({ orderBook });
				},

				setTicker: (ticker: Ticker | null): void => {
					set({ ticker });
				},

				setBalance: (balance: AccountBalance | null): void => {
					set({ balance });
				},

				setAccounts: (accounts: ExchangeAccount[]): void => {
					set({ accounts });
				},

				setLoading: (loading: boolean): void => {
					set({ loading });
				},

				setError: (error: string | null): void => {
					set({ error });
				},

				addOrder: (order: TradingOrder): void => {
					set((state) => ({
						orders: [...state.orders, order],
					}));
				},

				updateOrder: (
					orderId: string,
					updates: Partial<TradingOrder>,
				): void => {
					set((state) => ({
						orders: state.orders.map((order) =>
							order.id === orderId ? { ...order, ...updates } : order,
						),
					}));
				},

				removeOrder: (orderId: string): void => {
					set((state) => ({
						orders: state.orders.filter((order) => order.id !== orderId),
					}));
				},

				addTrade: (trade: TradingTrade): void => {
					set((state) => ({
						trades: [trade, ...state.trades],
					}));
				},

				refreshOrders: async (): Promise<void> => {
					// Implementation will be added in hooks
				},

				refreshTrades: async (): Promise<void> => {
					// Implementation will be added in hooks
				},

				refreshOrderBook: async (): Promise<void> => {
					// Implementation will be added in hooks
				},

				refreshTicker: async (): Promise<void> => {
					// Implementation will be added in hooks
				},

				refreshBalance: async (): Promise<void> => {
					// Implementation will be added in hooks
				},

				// UI Actions
				setActiveTab: (tab: string): void => {
					set({ activeTab: tab });
				},

				setActiveOrdersTradesTab: (tab: string): void => {
					set({ activeOrdersTradesTab: tab });
				},

				setAutoRefreshEnabled: (enabled: boolean): void => {
					set({ autoRefreshEnabled: enabled });
				},

				setAutoRefreshInterval: (interval: number): void => {
					set({ autoRefreshInterval: interval });
				},

				setLastUpdateTime: (time: number | null): void => {
					set({ lastUpdateTime: time });
				},

				setSelectedPrice: (price: number | null): void => {
					set({ selectedPrice: price });
				},

				setIsViewOnly: (isViewOnly: boolean): void => {
					set({ isViewOnly });
				},

				setSelectedExchange: (exchange: string | null): void => {
					set({ selectedExchange: exchange });
				},
			}),
			{
				name: "trading-store",
				partialize: (state) => ({
					selectedAccount: state.selectedAccount,
					selectedSymbol: state.selectedSymbol,
					selectedExchange: state.selectedExchange,
					accounts: state.accounts,
					activeTab: state.activeTab,
					activeOrdersTradesTab: state.activeOrdersTradesTab,
					autoRefreshEnabled: state.autoRefreshEnabled,
					autoRefreshInterval: state.autoRefreshInterval,
				}),
			},
		),
		{
			name: "Trading Store",
		},
	),
);
