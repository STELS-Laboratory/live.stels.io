/**
 * Markets application store
 * Manages market filters and state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Markets Store State
 */
interface MarketsStoreState {
	/** Search term for filtering markets */
	searchTerm: string;
	/** Selected exchanges filter */
	selectedExchanges: string[];
	/** Selected symbols filter */
	selectedSymbols: string[];
	/** Sort direction */
	sortDirection: "asc" | "desc";
	/** Sort field */
	sortField: "price" | "volume" | "change" | "market";
	/** View mode */
	viewMode: "table" | "grid";
}

/**
 * Markets Store Actions
 */
interface MarketsStoreActions {
	/** Set search term */
	setSearchTerm: (term: string) => void;
	/** Toggle exchange selection */
	toggleExchange: (exchange: string) => void;
	/** Toggle symbol selection */
	toggleSymbol: (symbol: string) => void;
	/** Clear all filters */
	clearFilters: () => void;
	/** Set sort direction */
	setSortDirection: (direction: "asc" | "desc") => void;
	/** Set sort field */
	setSortField: (field: "price" | "volume" | "change" | "market") => void;
	/** Set view mode */
	setViewMode: (mode: "table" | "grid") => void;
	/** Check if filters are active */
	hasActiveFilters: () => boolean;
}

/**
 * Markets Store Type
 */
export type MarketsStore = MarketsStoreState & MarketsStoreActions;

/**
 * Markets Store
 */
export const useMarketsStore = create<MarketsStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				searchTerm: "",
				selectedExchanges: [],
				selectedSymbols: [],
				sortDirection: "desc",
				sortField: "volume",
				viewMode: "table",

				// Actions
				setSearchTerm: (term: string) => {
					set({ searchTerm: term });
				},

				toggleExchange: (exchange: string) => {
					set((state) => {
						const isSelected = state.selectedExchanges.includes(exchange);
						return {
							selectedExchanges: isSelected
								? state.selectedExchanges.filter((e) => e !== exchange)
								: [...state.selectedExchanges, exchange],
						};
					});
				},

				toggleSymbol: (symbol: string) => {
					set((state) => {
						const isSelected = state.selectedSymbols.includes(symbol);
						return {
							selectedSymbols: isSelected
								? state.selectedSymbols.filter((s) => s !== symbol)
								: [...state.selectedSymbols, symbol],
						};
					});
				},

				clearFilters: () => {
					set({
						searchTerm: "",
						selectedExchanges: [],
						selectedSymbols: [],
					});
				},

				setSortDirection: (direction: "asc" | "desc") => {
					set({ sortDirection: direction });
				},

				setSortField: (field: "price" | "volume" | "change" | "market") => {
					set({ sortField: field });
				},

				setViewMode: (mode: "table" | "grid") => {
					set({ viewMode: mode });
				},

				hasActiveFilters: (): boolean => {
					const state = get();
					return (
						state.searchTerm !== "" ||
						state.selectedExchanges.length > 0 ||
						state.selectedSymbols.length > 0
					);
				},
			}),
			{
				name: "markets-store",
			},
		),
		{
			name: "Markets Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useMarketsFilters = () =>
	useMarketsStore((state) => ({
		searchTerm: state.searchTerm,
		selectedExchanges: state.selectedExchanges,
		selectedSymbols: state.selectedSymbols,
	}));

export const useMarketsSorting = () =>
	useMarketsStore((state) => ({
		sortDirection: state.sortDirection,
		sortField: state.sortField,
	}));

export const useMarketsActions = () =>
	useMarketsStore((state) => ({
		setSearchTerm: state.setSearchTerm,
		toggleExchange: state.toggleExchange,
		toggleSymbol: state.toggleSymbol,
		clearFilters: state.clearFilters,
		setSortDirection: state.setSortDirection,
		setSortField: state.setSortField,
		setViewMode: state.setViewMode,
		hasActiveFilters: state.hasActiveFilters,
	}));

