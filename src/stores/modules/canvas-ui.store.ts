import {create} from "zustand";
import {devtools, persist} from "zustand/middleware";
import type {GroupingMode, WidgetStoreUIState} from "@/lib/canvas-types";

/**
 * Canvas UI store state
 */
interface CanvasUIStore extends WidgetStoreUIState {
	// Actions
	toggleWidgetStore: () => void;
	setActiveCategory: (category: string) => void;
	setSearchTerm: (term: string) => void;
	toggleExchange: (exchange: string) => void;
	toggleAsset: (exchange: string, asset: string) => void;
	setGroupingMode: (mode: GroupingMode) => void;
	resetExpandedStates: () => void;
}

/**
 * Canvas UI store for managing widget store state
 */
export const useCanvasUIStore = create<CanvasUIStore>()(
	devtools(
		persist(
			(set,) => ({
				// Initial state
				isOpen: false,
				activeCategory: "All",
				searchTerm: "",
				expandedExchanges: {},
				expandedAssets: {},
				groupingMode: "exchange",
				
				// Actions
				toggleWidgetStore: () =>
					set((state) => ({isOpen: !state.isOpen})),
				
				setActiveCategory: (category: string) =>
					set({activeCategory: category}),
				
				setSearchTerm: (term: string) =>
					set({searchTerm: term}),
				
				toggleExchange: (exchange: string) =>
					set((state) => ({
						expandedExchanges: {
							...state.expandedExchanges,
							[exchange]: !state.expandedExchanges[exchange],
						},
					})),
				
				toggleAsset: (exchange: string, asset: string) => {
					const key = `${exchange}:${asset}`;
					set((state) => ({
						expandedAssets: {
							...state.expandedAssets,
							[key]: !state.expandedAssets[key],
						},
					}));
				},
				
				setGroupingMode: (mode: GroupingMode) =>
					set({groupingMode: mode}),
				
				resetExpandedStates: () =>
					set({
						expandedExchanges: {},
						expandedAssets: {},
					}),
			}),
			{
				name: "canvas-ui-store",
				partialize: (state) => ({
					activeCategory: state.activeCategory,
					groupingMode: state.groupingMode,
				}),
			},
		),
		{
			name: "canvas_ui_store",
		},
	),
);
