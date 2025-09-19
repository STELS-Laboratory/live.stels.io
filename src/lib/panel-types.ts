import type { Node, Edge } from "reactflow";
import type { FlowNodeData } from "./canvas-types";

/**
 * Panel configuration interface
 */
export interface Panel {
  /** Unique panel identifier */
  id: string;
  /** Panel display name */
  name: string;
  /** Panel description */
  description?: string;
  /** Whether this panel is currently active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: number;
  /** Last modification timestamp */
  updatedAt: number;
  /** Panel-specific settings */
  settings: PanelSettings;
}

/**
 * Panel-specific settings
 */
export interface PanelSettings {
  /** Background color/pattern */
  background?: string;
  /** Grid settings */
  grid?: {
    enabled: boolean;
    size: number;
    color: string;
  };
  /** Snap to grid */
  snapToGrid?: boolean;
  /** Auto-layout */
  autoLayout?: boolean;
}

/**
 * Panel data structure containing nodes and edges
 */
export interface PanelData {
  /** Panel ID */
  panelId: string;
  /** Nodes in this panel */
  nodes: Node<FlowNodeData>[];
  /** Edges in this panel */
  edges: Edge[];
  /** Viewport state */
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Panel management state
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
 * Panel management actions
 */
export interface PanelActions {
  // Panel CRUD
  createPanel: (name: string, description?: string) => string;
  deletePanel: (panelId: string) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  duplicatePanel: (panelId: string) => string;
  
  // Panel switching
  setActivePanel: (panelId: string) => void;
  getActivePanel: () => Panel | null;
  
  // Panel data management
  updatePanelData: (panelId: string, data: Partial<PanelData>) => void;
  getPanelData: (panelId: string) => PanelData | null;
  
  // Utility
  getPanelById: (panelId: string) => Panel | null;
  getAllPanels: () => Panel[];
  clearAllPanels: () => void;
}

/**
 * Combined panel store type
 */
export type PanelStore = PanelState & PanelActions;

/**
 * Default panel settings
 */
export const DEFAULT_PANEL_SETTINGS: PanelSettings = {
  background: "#1a1a1a",
  grid: {
    enabled: true,
    size: 20,
    color: "#333333",
  },
  snapToGrid: true,
  autoLayout: false,
};

/**
 * Default panel data
 */
export const DEFAULT_PANEL_DATA: Omit<PanelData, "panelId"> = {
  nodes: [],
  edges: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};
