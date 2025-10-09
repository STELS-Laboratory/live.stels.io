/**
 * Welcome (App Store) application store
 * Manages app launcher state and preferences
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AppCategory } from "./constants.tsx";

/**
 * Welcome Store State
 */
interface WelcomeStoreState {
	/** Search term for filtering apps */
	searchTerm: string;
	/** Selected category filter */
	selectedCategory: AppCategory;
	/** View mode */
	viewMode: "grid" | "list";
	/** Sort by */
	sortBy: "name" | "category" | "popular";
	/** Recently launched apps */
	recentApps: string[];
	/** Favorite apps */
	favoriteApps: string[];
	/** Show only featured */
	showOnlyFeatured: boolean;
}

/**
 * Welcome Store Actions
 */
interface WelcomeStoreActions {
	/** Set search term */
	setSearchTerm: (term: string) => void;
	/** Set selected category */
	setSelectedCategory: (category: AppCategory) => void;
	/** Set view mode */
	setViewMode: (mode: "grid" | "list") => void;
	/** Set sort by */
	setSortBy: (sortBy: "name" | "category" | "popular") => void;
	/** Add app to recent */
	addToRecent: (appId: string) => void;
	/** Toggle favorite */
	toggleFavorite: (appId: string) => void;
	/** Toggle show only featured */
	toggleShowOnlyFeatured: () => void;
	/** Clear filters */
	clearFilters: () => void;
	/** Check if filters are active */
	hasActiveFilters: () => boolean;
}

/**
 * Welcome Store Type
 */
export type WelcomeStore = WelcomeStoreState & WelcomeStoreActions;

/**
 * Welcome Store
 */
export const useWelcomeStore = create<WelcomeStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				searchTerm: "",
				selectedCategory: "All",
				viewMode: "grid",
				sortBy: "popular",
				recentApps: [],
				favoriteApps: [],
				showOnlyFeatured: false,

				// Actions
				setSearchTerm: (term: string) => {
					set({ searchTerm: term });
				},

				setSelectedCategory: (category: AppCategory) => {
					set({ selectedCategory: category });
				},

				setViewMode: (mode: "grid" | "list") => {
					set({ viewMode: mode });
				},

				setSortBy: (sortBy: "name" | "category" | "popular") => {
					set({ sortBy });
				},

				addToRecent: (appId: string) => {
					set((state) => {
						// Remove if already exists, add to front
						const filtered = state.recentApps.filter((id) => id !== appId);
						// Keep only last 5
						const updated = [appId, ...filtered].slice(0, 5);
						return { recentApps: updated };
					});
				},

				toggleFavorite: (appId: string) => {
					set((state) => {
						const isFavorite = state.favoriteApps.includes(appId);
						return {
							favoriteApps: isFavorite
								? state.favoriteApps.filter((id) => id !== appId)
								: [...state.favoriteApps, appId],
						};
					});
				},

				toggleShowOnlyFeatured: () => {
					set((state) => ({
						showOnlyFeatured: !state.showOnlyFeatured,
					}));
				},

				clearFilters: () => {
					set({
						searchTerm: "",
						selectedCategory: "All",
						showOnlyFeatured: false,
					});
				},

				hasActiveFilters: (): boolean => {
					const state = get();
					return (
						state.searchTerm !== "" ||
						state.selectedCategory !== "All" ||
						state.showOnlyFeatured
					);
				},
			}),
			{
				name: "welcome-store",
			},
		),
		{
			name: "Welcome Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useWelcomeFilters = () =>
	useWelcomeStore((state) => ({
		searchTerm: state.searchTerm,
		selectedCategory: state.selectedCategory,
		showOnlyFeatured: state.showOnlyFeatured,
	}));

export const useWelcomePreferences = () =>
	useWelcomeStore((state) => ({
		viewMode: state.viewMode,
		sortBy: state.sortBy,
		recentApps: state.recentApps,
		favoriteApps: state.favoriteApps,
	}));

export const useWelcomeActions = () =>
	useWelcomeStore((state) => ({
		setSearchTerm: state.setSearchTerm,
		setSelectedCategory: state.setSelectedCategory,
		setViewMode: state.setViewMode,
		setSortBy: state.setSortBy,
		addToRecent: state.addToRecent,
		toggleFavorite: state.toggleFavorite,
		toggleShowOnlyFeatured: state.toggleShowOnlyFeatured,
		clearFilters: state.clearFilters,
		hasActiveFilters: state.hasActiveFilters,
	}));

