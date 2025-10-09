/**
 * Scanner application store
 * Manages wallet scanner state and filters
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Scanner Store State
 */
interface ScannerStoreState {
	/** Selected wallet address for detailed view */
	selectedWalletAddress: string | null;
	/** Filter for wallet connection status */
	filterByConnection: "all" | "connected" | "disconnected";
	/** Filter for wallet activity */
	filterByActivity: "all" | "active" | "inactive";
	/** Search term for wallet filtering */
	searchTerm: string;
	/** Sort field */
	sortField: "equity" | "pnl" | "positions" | "exchange";
	/** Sort direction */
	sortDirection: "asc" | "desc";
	/** View mode */
	viewMode: "cards" | "table";
	/** Expanded wallet sections */
	expandedSections: {
		[walletAddress: string]: {
			positions: boolean;
			orders: boolean;
			balances: boolean;
			protocol: boolean;
		};
	};
}

/**
 * Scanner Store Actions
 */
interface ScannerStoreActions {
	/** Set selected wallet */
	setSelectedWallet: (address: string | null) => void;
	/** Set connection filter */
	setFilterByConnection: (
		filter: "all" | "connected" | "disconnected",
	) => void;
	/** Set activity filter */
	setFilterByActivity: (filter: "all" | "active" | "inactive") => void;
	/** Set search term */
	setSearchTerm: (term: string) => void;
	/** Set sort field */
	setSortField: (
		field: "equity" | "pnl" | "positions" | "exchange",
	) => void;
	/** Set sort direction */
	setSortDirection: (direction: "asc" | "desc") => void;
	/** Set view mode */
	setViewMode: (mode: "cards" | "table") => void;
	/** Toggle section expansion */
	toggleSection: (
		walletAddress: string,
		section: "positions" | "orders" | "balances" | "protocol",
	) => void;
	/** Clear all filters */
	clearFilters: () => void;
	/** Check if filters are active */
	hasActiveFilters: () => boolean;
}

/**
 * Scanner Store Type
 */
export type ScannerStore = ScannerStoreState & ScannerStoreActions;

/**
 * Scanner Store
 */
export const useScannerStore = create<ScannerStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				selectedWalletAddress: null,
				filterByConnection: "all",
				filterByActivity: "all",
				searchTerm: "",
				sortField: "equity",
				sortDirection: "desc",
				viewMode: "cards",
				expandedSections: {},

				// Actions
				setSelectedWallet: (address: string | null) => {
					set({ selectedWalletAddress: address });
				},

				setFilterByConnection: (
					filter: "all" | "connected" | "disconnected",
				) => {
					set({ filterByConnection: filter });
				},

				setFilterByActivity: (filter: "all" | "active" | "inactive") => {
					set({ filterByActivity: filter });
				},

				setSearchTerm: (term: string) => {
					set({ searchTerm: term });
				},

				setSortField: (
					field: "equity" | "pnl" | "positions" | "exchange",
				) => {
					set({ sortField: field });
				},

				setSortDirection: (direction: "asc" | "desc") => {
					set({ sortDirection: direction });
				},

				setViewMode: (mode: "cards" | "table") => {
					set({ viewMode: mode });
				},

				toggleSection: (
					walletAddress: string,
					section: "positions" | "orders" | "balances" | "protocol",
				) => {
					set((state) => {
						const currentSections = state.expandedSections[walletAddress] || {
							positions: false,
							orders: false,
							balances: false,
							protocol: false,
						};

						return {
							expandedSections: {
								...state.expandedSections,
								[walletAddress]: {
									...currentSections,
									[section]: !currentSections[section],
								},
							},
						};
					});
				},

				clearFilters: () => {
					set({
						filterByConnection: "all",
						filterByActivity: "all",
						searchTerm: "",
					});
				},

				hasActiveFilters: (): boolean => {
					const state = get();
					return (
						state.filterByConnection !== "all" ||
						state.filterByActivity !== "all" ||
						state.searchTerm !== ""
					);
				},
			}),
			{
				name: "scanner-store",
			},
		),
		{
			name: "Scanner Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useScannerFilters = () =>
	useScannerStore((state) => ({
		filterByConnection: state.filterByConnection,
		filterByActivity: state.filterByActivity,
		searchTerm: state.searchTerm,
	}));

export const useScannerSorting = () =>
	useScannerStore((state) => ({
		sortField: state.sortField,
		sortDirection: state.sortDirection,
	}));

export const useScannerActions = () =>
	useScannerStore((state) => ({
		setSelectedWallet: state.setSelectedWallet,
		setFilterByConnection: state.setFilterByConnection,
		setFilterByActivity: state.setFilterByActivity,
		setSearchTerm: state.setSearchTerm,
		setSortField: state.setSortField,
		setSortDirection: state.setSortDirection,
		setViewMode: state.setViewMode,
		toggleSection: state.toggleSection,
		clearFilters: state.clearFilters,
		hasActiveFilters: state.hasActiveFilters,
	}));

