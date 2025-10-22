/**
 * Canvas application store
 * Manages Canvas UI state, Widget Store, and Panel system
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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
interface CanvasUIState extends WidgetStoreUIState {
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
interface PanelState {
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
interface CanvasStoreState {
	// Widget Store UI
	ui: CanvasUIState;
	// Panel System
	panels: PanelState;
}

/**
 * Canvas Store Actions
 */
interface CanvasStoreActions {
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

/**
 * Generate unique panel ID
 */
function generatePanelId(): string {
	return `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default panel
 */
function createDefaultPanel(name: string, description?: string): Panel {
	return {
		id: generatePanelId(),
		name,
		description,
		isActive: false,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		settings: {
			background: "default",
			grid: {
				enabled: true,
				size: 20,
				color: "var(--border)",
			},
			snapToGrid: true,
			autoLayout: false,
		},
	};
}

/**
 * Create default panel data
 */
function createDefaultPanelData(panelId: string): PanelData {
	return {
		panelId,
		nodes: [],
		edges: [],
		viewport: {
			x: 0,
			y: 0,
			zoom: 1,
		},
	};
}

/**
 * Canvas Store
 */
export const useCanvasStore = create<CanvasStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				ui: {
					isOpen: false,
					activeCategory: "all",
					searchTerm: "",
					expandedExchanges: {},
					expandedAssets: {},
					groupingMode: "exchange",
				},
				panels: {
					panels: [],
					activePanelId: null,
					panelData: {},
				},

				// Widget Store UI Actions
				toggleWidgetStore: () => {
					set((state) => ({
						ui: {
							...state.ui,
							isOpen: !state.ui.isOpen,
						},
					}));
				},

				setActiveCategory: (category: string) => {
					set((state) => ({
						ui: {
							...state.ui,
							activeCategory: category,
						},
					}));
				},

				setSearchTerm: (term: string) => {
					set((state) => ({
						ui: {
							...state.ui,
							searchTerm: term,
						},
					}));
				},

				toggleExchange: (exchange: string) => {
					set((state) => ({
						ui: {
							...state.ui,
							expandedExchanges: {
								...state.ui.expandedExchanges,
								[exchange]: !state.ui.expandedExchanges[exchange],
							},
						},
					}));
				},

				toggleAsset: (exchange: string, asset: string) => {
					const key = `${exchange}-${asset}`;
					set((state) => ({
						ui: {
							...state.ui,
							expandedAssets: {
								...state.ui.expandedAssets,
								[key]: !state.ui.expandedAssets[key],
							},
						},
					}));
				},

				setGroupingMode: (mode: GroupingMode) => {
					set((state) => ({
						ui: {
							...state.ui,
							groupingMode: mode,
						},
					}));
				},

				resetExpandedStates: () => {
					set((state) => ({
						ui: {
							...state.ui,
							expandedExchanges: {},
							expandedAssets: {},
						},
					}));
				},

				// Panel Actions
				createPanel: (name: string, description?: string): string => {
					const newPanel = createDefaultPanel(name, description);
					const newPanelData = createDefaultPanelData(newPanel.id);

					set((state) => {
						// Set new panel as active
						const updatedPanels = state.panels.panels.map((p) => ({
							...p,
							isActive: false,
						}));

						return {
							panels: {
								panels: [...updatedPanels, { ...newPanel, isActive: true }],
								activePanelId: newPanel.id,
								panelData: {
									...state.panels.panelData,
									[newPanel.id]: newPanelData,
								},
							},
						};
					});

					return newPanel.id;
				},

				deletePanel: (panelId: string) => {
					set((state) => {
						const remainingPanels = state.panels.panels.filter(
							(p) => p.id !== panelId,
						);
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { [panelId]: _deletedPanel, ...remainingPanelData } =
							state.panels.panelData;

						// If deleting active panel, activate another one
						let newActivePanelId = state.panels.activePanelId;
						if (state.panels.activePanelId === panelId) {
							newActivePanelId =
								remainingPanels.length > 0 ? remainingPanels[0].id : null;
						}

						return {
							panels: {
								panels: remainingPanels.map((p) => ({
									...p,
									isActive: p.id === newActivePanelId,
								})),
								activePanelId: newActivePanelId,
								panelData: remainingPanelData,
							},
						};
					});
				},

				updatePanel: (panelId: string, updates: Partial<Panel>) => {
					set((state) => ({
						panels: {
							...state.panels,
							panels: state.panels.panels.map((p) =>
								p.id === panelId
									? { ...p, ...updates, updatedAt: Date.now() }
									: p
							),
						},
					}));
				},

				duplicatePanel: (panelId: string): string => {
					const panel = get().getPanelById(panelId);
					const panelData = get().getPanelData(panelId);

					if (!panel || !panelData) {
						return "";
					}

					const newPanel = {
						...panel,
						id: generatePanelId(),
						name: `${panel.name} (Copy)`,
						isActive: false,
						createdAt: Date.now(),
						updatedAt: Date.now(),
					};

					const newPanelData = {
						...panelData,
						panelId: newPanel.id,
					};

					set((state) => ({
						panels: {
							...state.panels,
							panels: [...state.panels.panels, newPanel],
							panelData: {
								...state.panels.panelData,
								[newPanel.id]: newPanelData,
							},
						},
					}));

					return newPanel.id;
				},

				setActivePanel: (panelId: string) => {
					set((state) => ({
						panels: {
							...state.panels,
							panels: state.panels.panels.map((p) => ({
								...p,
								isActive: p.id === panelId,
							})),
							activePanelId: panelId,
						},
					}));
				},

				getActivePanel: (): Panel | null => {
					const state = get();
					return (
						state.panels.panels.find((p) => p.id === state.panels.activePanelId) ||
						null
					);
				},

				updatePanelData: (panelId: string, data: Partial<PanelData>) => {
					set((state) => {
						const existingData = state.panels.panelData[panelId] ||
							createDefaultPanelData(panelId);

						return {
							panels: {
								...state.panels,
								panelData: {
									...state.panels.panelData,
									[panelId]: {
										...existingData,
										...data,
									},
								},
							},
						};
					});

					// Update panel's updatedAt timestamp
					get().updatePanel(panelId, {});
				},

				getPanelData: (panelId: string): PanelData | null => {
					return get().panels.panelData[panelId] || null;
				},

				getPanelById: (panelId: string): Panel | null => {
					return get().panels.panels.find((p) => p.id === panelId) || null;
				},

				getAllPanels: (): Panel[] => {
					return get().panels.panels;
				},

				clearAllPanels: () => {
					set({
						panels: {
							panels: [],
							activePanelId: null,
							panelData: {},
						},
					});
				},

				movePanelUp: (panelId: string) => {
					set((state) => {
						const panels = [...state.panels.panels];
						const index = panels.findIndex((p) => p.id === panelId);

						if (index > 0) {
							[panels[index - 1], panels[index]] = [
								panels[index],
								panels[index - 1],
							];
						}

						return {
							panels: {
								...state.panels,
								panels,
							},
						};
					});
				},

				movePanelDown: (panelId: string) => {
					set((state) => {
						const panels = [...state.panels.panels];
						const index = panels.findIndex((p) => p.id === panelId);

						if (index < panels.length - 1) {
							[panels[index], panels[index + 1]] = [
								panels[index + 1],
								panels[index],
							];
						}

						return {
							panels: {
								...state.panels,
								panels,
							},
						};
					});
				},

				// Export/Import Actions
				exportPanel: (panelId: string): string => {
					const state = get();
					const panel = state.getPanelById(panelId);
					const panelData = state.getPanelData(panelId);

					if (!panel || !panelData) {
						throw new Error("Panel not found");
					}

					const exportData = {
						version: "1.0",
						panel,
						panelData,
						exportedAt: Date.now(),
					};

					return JSON.stringify(exportData, null, 2);
				},

				exportAllPanels: (): string => {
					const state = get();
					const panels = state.panels.panels;
					const panelData = state.panels.panelData;

					const exportData = {
						version: "1.0",
						panels,
						panelData,
						exportedAt: Date.now(),
					};

					return JSON.stringify(exportData, null, 2);
				},

				importPanel: (jsonData: string): string | null => {
					try {
						const importData = JSON.parse(jsonData);

						if (!importData.panel || !importData.panelData) {
							throw new Error("Invalid panel data format");
						}

						const newPanel = {
							...importData.panel,
							id: generatePanelId(),
							name: `${importData.panel.name} (Imported)`,
							isActive: false,
							createdAt: Date.now(),
							updatedAt: Date.now(),
						};

						const newPanelData = {
							...importData.panelData,
							panelId: newPanel.id,
						};

						set((state) => ({
							panels: {
								...state.panels,
								panels: [...state.panels.panels, newPanel],
								panelData: {
									...state.panels.panelData,
									[newPanel.id]: newPanelData,
								},
							},
						}));

						return newPanel.id;
					} catch (error) {
						console.error("Failed to import panel:", error);
						return null;
					}
				},

				importAllPanels: (jsonData: string): boolean => {
					try {
						const importData = JSON.parse(jsonData);

						if (!importData.panels || !importData.panelData) {
							throw new Error("Invalid panels data format");
						}

						set({
							panels: {
								panels: importData.panels,
								activePanelId:
									importData.panels.length > 0 ? importData.panels[0].id : null,
								panelData: importData.panelData,
							},
						});

						return true;
					} catch (error) {
						console.error("Failed to import panels:", error);
						return false;
					}
				},
			}),
			{
				name: "canvas-store",
				partialize: (state) => ({
					panels: state.panels,
				}),
			},
		),
		{
			name: "Canvas Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */

// Widget Store UI hooks
export const useWidgetStoreUI = () => useCanvasStore((state) => state.ui);
export const useWidgetStoreActions = () =>
	useCanvasStore((state) => ({
		toggleWidgetStore: state.toggleWidgetStore,
		setActiveCategory: state.setActiveCategory,
		setSearchTerm: state.setSearchTerm,
		toggleExchange: state.toggleExchange,
		toggleAsset: state.toggleAsset,
		setGroupingMode: state.setGroupingMode,
		resetExpandedStates: state.resetExpandedStates,
	}));

// Panel hooks
export const usePanels = () => useCanvasStore((state) => state.panels);
export const usePanelActions = () =>
	useCanvasStore((state) => ({
		createPanel: state.createPanel,
		deletePanel: state.deletePanel,
		updatePanel: state.updatePanel,
		duplicatePanel: state.duplicatePanel,
		setActivePanel: state.setActivePanel,
		getActivePanel: state.getActivePanel,
		updatePanelData: state.updatePanelData,
		getPanelData: state.getPanelData,
		getPanelById: state.getPanelById,
		getAllPanels: state.getAllPanels,
		clearAllPanels: state.clearAllPanels,
		movePanelUp: state.movePanelUp,
		movePanelDown: state.movePanelDown,
		exportPanel: state.exportPanel,
		exportAllPanels: state.exportAllPanels,
		importPanel: state.importPanel,
		importAllPanels: state.importAllPanels,
	}));

