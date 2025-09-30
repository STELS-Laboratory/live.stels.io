import {create} from "zustand";
import {devtools, persist} from "zustand/middleware";
import type {Panel, PanelData, PanelStore} from "@/lib/panel-types";
import {DEFAULT_PANEL_DATA, DEFAULT_PANEL_SETTINGS} from "@/lib/panel-types";

/**
 * Generate unique panel ID
 */
function generatePanelId(): string {
	return `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Panel management store
 */
export const usePanelStore = create<PanelStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				panels: [],
				activePanelId: null,
				panelData: {},
				
				// Panel CRUD operations
				createPanel: (name: string, description?: string): string => {
					const newPanel: Panel = {
						id: generatePanelId(),
						name,
						description,
						isActive: false,
						createdAt: Date.now(),
						updatedAt: Date.now(),
						settings: {...DEFAULT_PANEL_SETTINGS},
					};
					
					const newPanelData: PanelData = {
						panelId: newPanel.id,
						...DEFAULT_PANEL_DATA,
					};
					
					set((state) => {
						// Deactivate all other panels
						const updatedPanels = state.panels.map(panel => ({
							...panel,
							isActive: false,
						}));
						
						// Add new panel as active
						const panels = [...updatedPanels, {...newPanel, isActive: true}];
						const activePanelId = newPanel.id;
						
						return {
							panels,
							activePanelId,
							panelData: {
								...state.panelData,
								[newPanel.id]: newPanelData,
							},
						};
					});
					
					console.log(`Created new panel: ${name} (${newPanel.id})`);
					return newPanel.id;
				},
				
				deletePanel: (panelId: string): void => {
					set((state) => {
						const remainingPanels = state.panels.filter(panel => panel.id !== panelId);
						const {[panelId]: deletedData, ...remainingData} = state.panelData;
						
						// If we deleted the active panel, activate the first remaining panel
						let newActivePanelId = state.activePanelId;
						if (state.activePanelId === panelId && remainingPanels.length > 0) {
							newActivePanelId = remainingPanels[0].id;
							remainingPanels[0].isActive = true;
						} else if (remainingPanels.length === 0) {
							newActivePanelId = null;
						}
						
						return {
							panels: remainingPanels,
							activePanelId: newActivePanelId,
							panelData: remainingData,
						};
					});
					
					console.log(`Deleted panel: ${panelId}`);
				},
				
				updatePanel: (panelId: string, updates: Partial<Panel>): void => {
					set((state) => ({
						panels: state.panels.map(panel =>
							panel.id === panelId
								? {...panel, ...updates, updatedAt: Date.now()}
								: panel
						),
					}));
				},
				
				duplicatePanel: (panelId: string): string => {
					const state = get();
					const originalPanel = state.panels.find(p => p.id === panelId);
					const originalData = state.panelData[panelId];
					
					if (!originalPanel || !originalData) {
						throw new Error(`Panel ${panelId} not found`);
					}
					
					const newPanelId = generatePanelId();
					const newPanel: Panel = {
						...originalPanel,
						id: newPanelId,
						name: `${originalPanel.name} (Copy)`,
						isActive: false,
						createdAt: Date.now(),
						updatedAt: Date.now(),
					};
					
					const newPanelData: PanelData = {
						...originalData,
						panelId: newPanelId,
						// Deep copy nodes and edges to avoid references
						nodes: JSON.parse(JSON.stringify(originalData.nodes)),
						edges: JSON.parse(JSON.stringify(originalData.edges)),
					};
					
					set((state) => {
						// Deactivate all panels
						const updatedPanels = state.panels.map(panel => ({
							...panel,
							isActive: false,
						}));
						
						// Add duplicated panel as active
						const panels = [...updatedPanels, {...newPanel, isActive: true}];
						
						return {
							panels,
							activePanelId: newPanelId,
							panelData: {
								...state.panelData,
								[newPanelId]: newPanelData,
							},
						};
					});
					
					console.log(`Duplicated panel: ${originalPanel.name} -> ${newPanel.name}`);
					return newPanelId;
				},
				
				// Panel switching
				setActivePanel: (panelId: string): void => {
					set((state) => ({
						panels: state.panels.map(panel => ({
							...panel,
							isActive: panel.id === panelId,
						})),
						activePanelId: panelId,
					}));
				},
				
				getActivePanel: (): Panel | null => {
					const state = get();
					return state.panels.find(panel => panel.id === state.activePanelId) || null;
				},
				
				// Panel data management
				updatePanelData: (panelId: string, data: Partial<PanelData>): void => {
					set((state) => ({
						panelData: {
							...state.panelData,
							[panelId]: {
								...state.panelData[panelId],
								...data,
							},
						},
					}));
				},
				
				getPanelData: (panelId: string): PanelData | null => {
					const state = get();
					return state.panelData[panelId] || null;
				},
				
				// Utility functions
				getPanelById: (panelId: string): Panel | null => {
					const state = get();
					return state.panels.find(panel => panel.id === panelId) || null;
				},
				
				getAllPanels: (): Panel[] => {
					const state = get();
					return state.panels;
				},
				
				clearAllPanels: (): void => {
					set({
						panels: [],
						activePanelId: null,
						panelData: {},
					});
					console.log("Cleared all panels");
				},
			}),
			{
				name: "panel-store",
				partialize: (state) => ({
					panels: state.panels,
					activePanelId: state.activePanelId,
					panelData: state.panelData,
				}),
			},
		),
		{
			name: "panel_store_01",
		},
	),
);
