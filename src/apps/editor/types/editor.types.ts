/**
 * Editor component types
 * Type definitions for editor components and state
 */

import type { Worker } from "@/types/apps/editor/types";

/**
 * Worker configuration type
 */
export interface WorkerConfig {
  scope: "local" | "network";
  executionMode: "parallel" | "leader" | "exclusive";
  priority: "critical" | "high" | "normal" | "low";
  mode: "loop" | "single";
  version: string;
  dependencies: string[];
  accountId: string;
  assignedNode: string;
  nid: string;
}

/**
 * Editor state type
 */
export interface EditorState {
  script: string;
  note: string;
  config: WorkerConfig;
  originalScript: string;
  isEditingScript: boolean;
  isEditingNote: boolean;
  isEditingConfig: boolean;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * WorkerBadges component props
 */
export interface WorkerBadgesProps {
  scope: "local" | "network";
  executionMode: "parallel" | "leader" | "exclusive";
  priority: "critical" | "high" | "normal" | "low";
  version: string;
  /** Sandbox mode for isolated execution */
  sandbox?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * WorkerListItem component props
 */
export interface WorkerListItemProps {
  worker: Worker;
  isSelected: boolean;
  isNewlyCreated: boolean;
  onSelect: (worker: Worker) => void;
  onMigrate?: (worker: Worker) => void;
}

/**
 * WorkerRegistryPanel component props
 */
export interface WorkerRegistryPanelProps {
  workers: Worker[];
  selectedWorker: Worker | null;
  loading: boolean;
  searchTerm: string;
  filterActive: boolean | null;
  filterExecutionMode: string | null;
  filterPriority: string | null;
  filterScope: string | null;
  sortOrder: "asc" | "desc";
  newlyCreatedWorker: string | null;
  onSearchChange: (term: string) => void;
  onFilterActiveChange: (value: boolean | null) => void;
  onFilterExecutionModeChange: (value: string | null) => void;
  onFilterPriorityChange: (value: string | null) => void;
  onFilterScopeChange: (value: string | null) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  onSelectWorker: (worker: Worker) => void;
  onCreateWorker: () => void;
  onShowStats: () => void;
  onStopAll: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * EditorHeader component props
 */
export interface EditorHeaderProps {
  worker: Worker;
  isEditing: boolean;
  isEditingNote: boolean;
  isEditingConfig: boolean;
  toggling: boolean;
  saving: boolean;
  activeTab: string;
  formatCodeFn: (() => void) | null;
  undoFn: (() => void) | null;
  redoFn: (() => void) | null;
  onToggle: () => void;
  onMigrate?: () => void;
  onSave: () => void;
  onReset: () => void;
}

/**
 * ConfigForm component props
 */
export interface ConfigFormProps {
  config: WorkerConfig;
  validationError: string | null;
  onChange: (field: string, value: unknown) => void;
  onReset: () => void;
  disabled?: boolean;
  onMigrateClick?: () => void;
}

/**
 * PromptsEditor component props
 */
export interface PromptsEditorProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
}

/**
 * CodeEditorPanel component props
 */
export interface CodeEditorPanelProps {
  worker: Worker | null;
  script: string;
  note: string;
  config: WorkerConfig;
  isEditingScript: boolean;
  isEditingNote: boolean;
  isEditingConfig: boolean;
  validationError: string | null;
  saving: boolean;
  activeTab: string;
  onScriptChange: (value: string | undefined) => void;
  onNoteChange: (value: string) => void;
  onConfigChange: (field: string, value: unknown) => void;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  onReset: () => void;
  onFormatCodeReady: (fn: () => void) => void;
  onUndoRedoReady: (undo: () => void, redo: () => void) => void;
}

/**
 * Editor state hook return type
 */
export interface UseEditorStateReturn {
  state: EditorState;
  setScript: (value: string) => void;
  setNote: (value: string) => void;
  setConfig: (config: WorkerConfig) => void;
  setConfigField: (field: keyof WorkerConfig, value: unknown) => void;
  loadWorker: (worker: Worker, formattedScriptsCache?: Map<string, string>) => void;
  resetScript: () => void;
  resetNote: () => void;
  resetConfig: () => void;
  resetAll: () => void;
  updateOriginalScript: (script: string) => void;
  updateOriginalNote: (note: string) => void;
  updateOriginalConfig: (config: WorkerConfig) => void;
  updateOriginalsAfterSave: () => void;
  isEditing: boolean;
  isEditingScript: boolean;
  isEditingNote: boolean;
  isEditingConfig: boolean;
}

/**
 * Worker editor hook return type
 */
export interface UseWorkerEditorReturn {
  handleEditorChange: (value: string | undefined) => void;
  handleNoteChange: (value: string) => void;
  handleConfigChange: (field: string, value: unknown) => void;
  formattedScriptsCache: React.MutableRefObject<Map<string, string>>;
}

/**
 * Worker operations hook return type
 */
export interface UseWorkerOperationsReturn {
  handleCreateWorker: (request: import("@/types/apps/editor/types").WorkerCreateRequest) => Promise<void>;
  handleSaveAll: () => Promise<void>;
  handleToggleWorkerStatus: () => Promise<void>;
  handleMigrateWorker: (worker: Worker) => Promise<Worker | null>;
  handleStopAll: () => Promise<{ stopped: number; failed: number; total: number }>;
  saving: boolean;
  toggling: boolean;
}

/**
 * Filter state type
 */
export interface FilterState {
  searchTerm: string;
  filterActive: boolean | null;
  filterExecutionMode: string | null;
  filterPriority: string | null;
  filterScope: string | null;
  sortOrder: "asc" | "desc";
}

