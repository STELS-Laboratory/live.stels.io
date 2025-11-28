/**
 * Canvas application type definitions
 */

import type {
	GroupingMode,
	WidgetStoreUIState,
} from "@/lib/canvas-types.ts";
import type {
	Panel,
	PanelData,
} from "@/lib/panel-types.ts";

/**
 * Widget Store UI State
 */
export interface CanvasUIState extends WidgetStoreUIState {
	isOpen: boolean;
	activeCategory: string;
	searchTerm: string;
	expandedExchanges: Record<string, boolean>;
	expandedAssets: Record<string, boolean>;
	groupingMode: GroupingMode;
}

/**
 * Panel State
 */
export interface PanelState {
	/** All panels */
	panels: Panel[];
	/** Currently active panel ID */
	activePanelId: string | null;
	/** Panel data for each panel */
	panelData: Record<string, PanelData>;
}

/**
 * Combined Canvas Store State
 */
export interface CanvasStoreState {
	// Widget Store UI
	ui: CanvasUIState;
	// Panel System
	panels: PanelState;
}

/**
 * Canvas Store Actions
 */
export interface CanvasStoreActions {
	// Widget Store UI Actions
	toggleWidgetStore: () => void;
	setActiveCategory: (category: string) => void;
	setSearchTerm: (term: string) => void;
	toggleExchange: (exchange: string) => void;
	toggleAsset: (exchange: string, asset: string) => void;
	setGroupingMode: (mode: GroupingMode) => void;
	resetExpandedStates: () => void;

	// Panel Actions
	createPanel: (name: string, description?: string) => string;
	deletePanel: (panelId: string) => void;
	updatePanel: (panelId: string, updates: Partial<Panel>) => void;
	duplicatePanel: (panelId: string) => string;
	setActivePanel: (panelId: string) => void;
	getActivePanel: () => Panel | null;
	updatePanelData: (panelId: string, data: Partial<PanelData>) => void;
	getPanelData: (panelId: string) => PanelData | null;
	getPanelById: (panelId: string) => Panel | null;
	getAllPanels: () => Panel[];
	clearAllPanels: () => void;
	movePanelUp: (panelId: string) => void;
	movePanelDown: (panelId: string) => void;
	
	// Export/Import Actions
	exportPanel: (panelId: string) => string;
	exportAllPanels: () => string;
	importPanel: (jsonData: string) => string | null;
	importAllPanels: (jsonData: string) => boolean;
}

/**
 * Canvas Store Type
 */
export type CanvasStore = CanvasStoreState & CanvasStoreActions;

