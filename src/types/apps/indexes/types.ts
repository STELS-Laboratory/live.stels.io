/**
 * Indexes application store type definitions
 */

import type {
	IndexCode,
	IndexData,
	IndexCandleData,
	Timeframe,
	IndexMetadata,
} from "@/apps/indexes/types";

/**
 * Index Store State
 */
export interface IndexStoreState {
	/** All available indexes */
	indexes: Record<string, IndexData>;
	/** Candle data for indexes */
	candles: Record<string, IndexCandleData>;
	/** Currently selected index code */
	selectedIndex: IndexCode | null;
	/** Selected timeframe for charts */
	selectedTimeframe: Timeframe;
	/** UI state */
	ui: {
		/** Show detail panel */
		showDetailPanel: boolean;
		/** Show comparison mode */
		showComparison: boolean;
		/** Selected indexes for comparison */
		comparisonIndexes: IndexCode[];
		/** View mode: grid or list */
		viewMode: "grid" | "list";
		/** Search filter */
		searchFilter: string;
		/** Category filter */
		categoryFilter: string | null;
	};
	/** Loading state */
	loading: boolean;
	/** Error message */
	error: string | null;
	/** Last update timestamp */
	lastUpdate: number | null;
	/** Cached indexes keys string for stable comparison */
	_indexesKeysCache: string;
}

/**
 * Index Store Actions
 */
export interface IndexStoreActions {
	/** Load indexes from sessionStorage */
	loadIndexes: () => void;
	/** Set selected index */
	setSelectedIndex: (index: IndexCode | null) => void;
	/** Set selected timeframe */
	setSelectedTimeframe: (timeframe: Timeframe) => void;
	/** Toggle detail panel */
	toggleDetailPanel: () => void;
	/** Toggle comparison mode */
	toggleComparison: () => void;
	/** Add index to comparison */
	addToComparison: (index: IndexCode) => void;
	/** Remove index from comparison */
	removeFromComparison: (index: IndexCode) => void;
	/** Clear comparison */
	clearComparison: () => void;
	/** Set view mode */
	setViewMode: (mode: "grid" | "list") => void;
	/** Set search filter */
	setSearchFilter: (filter: string) => void;
	/** Set category filter */
	setCategoryFilter: (category: string | null) => void;
	/** Get index data by code */
	getIndexData: (code: IndexCode) => IndexData | null;
	/** Get candle data for index and timeframe */
	getCandleData: (code: IndexCode, timeframe: Timeframe) => IndexCandleData | null;
	/** Get all indexes metadata */
	getIndexesMetadata: () => IndexMetadata[];
	/** Clear error */
	clearError: () => void;
}

/**
 * Index Store Type
 */
export type IndexStore = IndexStoreState & IndexStoreActions;

