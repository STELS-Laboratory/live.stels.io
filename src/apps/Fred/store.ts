/**
 * Fred (Economic Indicators) application store
 * Manages indicator filters and view state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Fred Store State
 */
interface FredStoreState {
	/** Selected country filter */
	selectedCountry: string;
	/** Selected category filter */
	selectedCategory: string;
	/** Search term for filtering indicators */
	searchTerm: string;
	/** Active tab */
	activeTab: "overview" | "indicators" | "comparison";
	/** Sort direction */
	sortDirection: "asc" | "desc";
	/** Sort field */
	sortField: "value" | "name" | "date" | "country";
	/** Selected indicator for comparison */
	comparisonIndicator: string;
	/** Favorite indicators */
	favoriteIndicators: string[];
}

/**
 * Fred Store Actions
 */
interface FredStoreActions {
	/** Set selected country */
	setSelectedCountry: (country: string) => void;
	/** Set selected category */
	setSelectedCategory: (category: string) => void;
	/** Set search term */
	setSearchTerm: (term: string) => void;
	/** Set active tab */
	setActiveTab: (tab: "overview" | "indicators" | "comparison") => void;
	/** Set sort direction */
	setSortDirection: (direction: "asc" | "desc") => void;
	/** Set sort field */
	setSortField: (
		field: "value" | "name" | "date" | "country",
	) => void;
	/** Set comparison indicator */
	setComparisonIndicator: (indicator: string) => void;
	/** Toggle favorite indicator */
	toggleFavorite: (indicatorKey: string) => void;
	/** Clear all filters */
	clearFilters: () => void;
	/** Check if filters are active */
	hasActiveFilters: () => boolean;
}

/**
 * Fred Store Type
 */
export type FredStore = FredStoreState & FredStoreActions;

/**
 * Fred Store
 */
export const useFredStore = create<FredStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				selectedCountry: "all",
				selectedCategory: "all",
				searchTerm: "",
				activeTab: "overview",
				sortDirection: "desc",
				sortField: "value",
				comparisonIndicator: "",
				favoriteIndicators: [],

				// Actions
				setSelectedCountry: (country: string) => {
					set({ selectedCountry: country });
				},

				setSelectedCategory: (category: string) => {
					set({ selectedCategory: category });
				},

				setSearchTerm: (term: string) => {
					set({ searchTerm: term });
				},

				setActiveTab: (tab: "overview" | "indicators" | "comparison") => {
					set({ activeTab: tab });
				},

				setSortDirection: (direction: "asc" | "desc") => {
					set({ sortDirection: direction });
				},

				setSortField: (
					field: "value" | "name" | "date" | "country",
				) => {
					set({ sortField: field });
				},

				setComparisonIndicator: (indicator: string) => {
					set({ comparisonIndicator: indicator });
				},

				toggleFavorite: (indicatorKey: string) => {
					set((state) => {
						const isFavorite = state.favoriteIndicators.includes(indicatorKey);
						return {
							favoriteIndicators: isFavorite
								? state.favoriteIndicators.filter((k) => k !== indicatorKey)
								: [...state.favoriteIndicators, indicatorKey],
						};
					});
				},

				clearFilters: () => {
					set({
						selectedCountry: "all",
						selectedCategory: "all",
						searchTerm: "",
					});
				},

				hasActiveFilters: (): boolean => {
					const state = get();
					return (
						state.selectedCountry !== "all" ||
						state.selectedCategory !== "all" ||
						state.searchTerm !== ""
					);
				},
			}),
			{
				name: "fred-store",
			},
		),
		{
			name: "Fred Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useFredFilters = () =>
	useFredStore((state) => ({
		selectedCountry: state.selectedCountry,
		selectedCategory: state.selectedCategory,
		searchTerm: state.searchTerm,
	}));

export const useFredSorting = () =>
	useFredStore((state) => ({
		sortDirection: state.sortDirection,
		sortField: state.sortField,
	}));

export const useFredActions = () =>
	useFredStore((state) => ({
		setSelectedCountry: state.setSelectedCountry,
		setSelectedCategory: state.setSelectedCategory,
		setSearchTerm: state.setSearchTerm,
		setActiveTab: state.setActiveTab,
		setSortDirection: state.setSortDirection,
		setSortField: state.setSortField,
		setComparisonIndicator: state.setComparisonIndicator,
		toggleFavorite: state.toggleFavorite,
		clearFilters: state.clearFilters,
		hasActiveFilters: state.hasActiveFilters,
	}));

