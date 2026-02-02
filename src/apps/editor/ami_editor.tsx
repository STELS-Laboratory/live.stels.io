/**
 * AMI Editor - Refactored
 * Main component orchestrating the editor interface
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Split from "react-split";
import { Code, Cpu, X, AlertCircle, RefreshCw } from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/graphite";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./store.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useNetworkStore } from "@/stores/modules/network.store";
import { useMobile } from "@/hooks/use-mobile";
import { navigateTo } from "@/lib/router";
import { toast } from "@/stores";
import { logError, getSafeKeys } from "./utils/logger.ts";
import { EDITOR_CONSTANTS } from "./ami-editor/constants.ts";
import { useKeyboardShortcuts } from "./ami-editor/hooks/use-keyboard-shortcuts.ts";
import { useWorkerFilters } from "./ami-editor/hooks/use-worker-filters.ts";
import { CreateWorkerDialog } from "./ami-editor/create-worker-dialog";
import { CreateToolDialog } from "./ami-editor/CreateToolDialog";
import { DeleteToolDialog } from "./ami-editor/DeleteToolDialog";
import { CallToolDialog } from "./ami-editor/CallToolDialog";
import { StopAllDialog } from "./ami-editor/stop-all-dialog";
import { MigrateWorkerDialog } from "./ami-editor/migrate-worker-dialog";
import { ConfirmToggleDialog } from "./ami-editor/confirm-toggle-dialog";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer-access-request";
import { WorkerStatsPanel } from "./ami-editor/worker-stats-panel";
import { WorkerRegistryPanel } from "./components/worker-registry-panel";
import { ToolRegistryPanel } from "./components/ToolRegistryPanel";
import { ToolEditorPanel } from "./components/ToolEditorPanel";
import { CodeEditorPanel } from "./components/code-editor-panel";
import { EditorActivityBar } from "./components/EditorActivityBar";
import { EditorStatusBar } from "./components/EditorStatusBar";
import { useEditorState } from "./hooks/use-editor-state.ts";
import { useWorkerEditor } from "./hooks/use-worker-editor.ts";
import { useWorkerOperations } from "./hooks/use-worker-operations.ts";
import type { Worker, WorkerCreateRequest } from "@/types/apps/editor/types";
import type { ToolRaw } from "./types/tools.types";
import {
  validateToolName,
  validateToolTimeout,
  validateJsonObject,
} from "./services/tool-validator";

export type EditorMode = "workers" | "tools";

export function AMIEditor() {
  const mobile = useMobile();
  const { connectionSession } = useAuthStore();
  const currentNetworkId = useNetworkStore((s) => s.currentNetworkId);
  const listWorkers = useEditorStore((state) => state.listWorkers);
  const listTools = useEditorStore((state) => state.listTools);
  const getTool = useEditorStore((state) => state.getTool);
  const setTool = useEditorStore((state) => state.setTool);
  const deleteTool = useEditorStore((state) => state.deleteTool);
  const callTool = useEditorStore((state) => state.callTool);
  const getLeaderInfo = useEditorStore((state) => state.getLeaderInfo);
  const getWorkerStats = useEditorStore((state) => state.getWorkerStats);
  const tools = useEditorStore((state) => state.tools);
  const toolsLoading = useEditorStore((state) => state.toolsLoading);
  const toolsError = useEditorStore((state) => state.toolsError);
  const workersError = useEditorStore((state) => state.workersError);
  const clearError = useEditorStore((state) => state.clearError);
  const clearToolsError = useEditorStore((state) => state.clearToolsError);

  // Editor mode: Workers | MCP Tools
  const [editorMode, setEditorMode] = useState<EditorMode>("workers");

  // Workers list state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkerState, setSelectedWorkerStateRaw] = useState<Worker | null>(null);
  
  // Wrapper to intercept all setSelectedWorkerState calls
  const setSelectedWorkerState = useCallback((worker: Worker | null) => {
    // Safety check: don't set empty object
    if (worker !== null && worker !== undefined && getSafeKeys(worker).length === 0) {
      return;
    }
    
    setSelectedWorkerStateRaw(worker);
  }, []);
  
  // Alias for consistency
  const selectedWorker = selectedWorkerState;
  
  const setSelectedWorker = useCallback((worker: Worker | null) => {
    setSelectedWorkerState(worker);
  }, [setSelectedWorkerState]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterExecutionMode, setFilterExecutionMode] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<string | null>("local");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showStopAllDialog, setShowStopAllDialog] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [workerToMigrate, setWorkerToMigrate] = useState<Worker | null>(null);
  const [showToggleConfirmDialog, setShowToggleConfirmDialog] = useState(false);
  const [showDeveloperAccessDialog, setShowDeveloperAccessDialog] = useState(false);
  const [newlyCreatedWorker, setNewlyCreatedWorker] = useState<string | null>(null);
  const [showCreateToolDialog, setShowCreateToolDialog] = useState(false);
  const [showDeleteToolDialog, setShowDeleteToolDialog] = useState(false);
  const [showCallToolDialog, setShowCallToolDialog] = useState(false);
  const [newlyCreatedToolId, setNewlyCreatedToolId] = useState<string | null>(null);

  // Tools state
  const [selectedTool, setSelectedTool] = useState<ToolRaw | null>(null);
  const [toolForm, setToolForm] = useState({
    name: "",
    description: "",
    script: "",
    inputSchemaJson: "{}",
    outputSchemaJson: "{}",
    category: "utility",
    scope: "local",
    timeout: 30000,
    active: true,
  });
  const [toolsSaving, setToolsSaving] = useState(false);
  const [toolDetailsLoading, setToolDetailsLoading] = useState(false);
  const [toolValidationError, setToolValidationError] = useState<string | null>(null);
  const [toolSearchTerm, setToolSearchTerm] = useState("");
  const [toolFilterCategory, setToolFilterCategory] = useState<string | null>(null);
  const [toolFilterScope, setToolFilterScope] = useState<string | null>(null);
  const [toolFilterActive, setToolFilterActive] = useState<boolean | null>(null);
  const [toolSortOrder, setToolSortOrder] = useState<"asc" | "desc">("asc");
  const toolSearchInputRef = useRef<HTMLInputElement>(null);

  const toolFormDirty = useCallback((): boolean => {
    if (!selectedTool) return false;
    const inputSchemaStr =
      selectedTool.inputSchema && typeof selectedTool.inputSchema === "object"
        ? JSON.stringify(selectedTool.inputSchema)
        : "{}";
    const outputSchemaStr =
      selectedTool.outputSchema && typeof selectedTool.outputSchema === "object"
        ? JSON.stringify(selectedTool.outputSchema)
        : "{}";
    return (
      toolForm.name !== (selectedTool.name ?? "") ||
      toolForm.description !== (selectedTool.description ?? "") ||
      toolForm.script !== (selectedTool.script ?? "") ||
      toolForm.inputSchemaJson.replace(/\s/g, "") !== inputSchemaStr.replace(/\s/g, "") ||
      toolForm.outputSchemaJson.replace(/\s/g, "") !== outputSchemaStr.replace(/\s/g, "") ||
      toolForm.category !== (selectedTool.category ?? "utility") ||
      toolForm.scope !== (selectedTool.scope ?? "local") ||
      toolForm.timeout !== (typeof selectedTool.timeout === "number" ? selectedTool.timeout : 30000) ||
      toolForm.active !== (selectedTool.active !== false)
    );
  }, [selectedTool, toolForm]);

  // Editor state
  const [activeTab, setActiveTab] = useState("code");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadWorkersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** SID of the tool for which we've loaded full data and set toolForm (avoids false "unsaved" when selectedTool is still the list item) */
  const lastLoadedToolSidRef = useRef<string | null>(null);

  // Editor state hook
  const editorState = useEditorState();

  // Worker editor hook
  const workerEditor = useWorkerEditor(selectedWorker, editorState);

  // Compute filtered workers
  const filteredWorkers = useWorkerFilters({
    workers,
    searchTerm,
    filterActive,
    filterExecutionMode,
    filterPriority,
    filterScope,
    sortOrder,
  });

  // Worker operations hook
  const workerOperations = useWorkerOperations({
    selectedWorker,
    editorState: editorState.state,
    setWorkers,
    setSelectedWorker: (worker, skipLoadWorker = false) => {
      // Safety check: don't set worker if it has invalid structure (unless it's null)
      if (worker !== null && worker !== undefined) {
        // Check if worker is an empty object {}
        if (getSafeKeys(worker).length === 0) {
          return;
        }
        if (!worker.value || !worker.value.raw) {
          return;
        }
      }

      setSelectedWorker(worker);
      if (worker && !skipLoadWorker) {
        editorState.loadWorker(worker, workerEditor.formattedScriptsCache.current);
      }
    },
    setValidationError,
    formattedScriptsCache: workerEditor.formattedScriptsCache,
    onWorkerLoaded: (worker) => {
      setSelectedWorker(worker);
      editorState.loadWorker(worker, workerEditor.formattedScriptsCache.current);
    },
    onNewWorkerCreated: (workerId) => {
      setNewlyCreatedWorker(workerId);
    },
  });

  // Check developer access on mount
  useEffect(() => {
    if (connectionSession) {
      const isDeveloper = connectionSession.developer || false;
      if (!isDeveloper) {
        setShowDeveloperAccessDialog(true);
        setLoading(false);
      }
    }
  }, [connectionSession]);

  // Load workers with debounce and abort controller
  const loadWorkers = useCallback(async () => {
    if (!connectionSession?.developer) {
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    try {
      await listWorkers();

      if (abortController.signal.aborted) {
        return;
      }

      const w = useEditorStore.getState().workers;
      setWorkers(w);
      setLoading(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      logError("Failed to load workers:", error);
      toast.error(
        "Failed to load workers",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      setLoading(false);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [connectionSession?.developer, listWorkers]);

  // Debounced load workers
  const debouncedLoadWorkers = useCallback(() => {
    if (loadWorkersTimeoutRef.current) {
      clearTimeout(loadWorkersTimeoutRef.current);
    }

    loadWorkersTimeoutRef.current = setTimeout(() => {
      loadWorkers();
    }, EDITOR_CONSTANTS.DEBOUNCE_DELAY_MS);
  }, [loadWorkers]);

  useEffect(() => {
    debouncedLoadWorkers();

    return () => {
      if (loadWorkersTimeoutRef.current) {
        clearTimeout(loadWorkersTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [debouncedLoadWorkers]);

  useEffect(() => {
    if (newlyCreatedWorker) {
      const timer = setTimeout(() => {
        setNewlyCreatedWorker(null);
      }, EDITOR_CONSTANTS.NEW_WORKER_HIGHLIGHT_MS);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedWorker]);

  // Load tools when in tools mode or when network changes
  const loadTools = useCallback(async () => {
    if (!connectionSession?.developer || editorMode !== "tools") return;
    await listTools();
  }, [connectionSession?.developer, editorMode, listTools]);

  useEffect(() => {
    if (editorMode === "tools") {
      loadTools();
    }
  }, [editorMode, loadTools, currentNetworkId]);

  // When selectedTool changes, fetch full tool (with script) and populate form
  useEffect(() => {
    if (!selectedTool) {
      lastLoadedToolSidRef.current = null;
      setToolForm({
        name: "",
        description: "",
        script: "",
        inputSchemaJson: "{}",
        outputSchemaJson: "{}",
        category: "utility",
        scope: "local",
        timeout: 30000,
        active: true,
      });
      setToolValidationError(null);
      setToolDetailsLoading(false);
      return;
    }
    const toolId = selectedTool.sid?.trim();
    if (!toolId) {
      logError("Selected tool has no valid sid:", selectedTool);
      setToolValidationError("Tool has no valid ID - please reload tools");
      setToolDetailsLoading(false);
      return;
    }
    let cancelled = false;
    setToolDetailsLoading(true);
    (async () => {
      try {
        const full = await getTool(toolId, true);
        if (cancelled || !full) return;
        lastLoadedToolSidRef.current = full.sid ?? null;
        setSelectedTool(full);
        setToolForm({
          name: full.name ?? "",
          description: full.description ?? "",
          script: full.script ?? "",
          inputSchemaJson:
            full.inputSchema && typeof full.inputSchema === "object"
              ? JSON.stringify(full.inputSchema, null, 2)
              : "{}",
          outputSchemaJson:
            full.outputSchema && typeof full.outputSchema === "object"
              ? JSON.stringify(full.outputSchema, null, 2)
              : "{}",
          category: full.category ?? "utility",
          scope: full.scope ?? "local",
          timeout: typeof full.timeout === "number" ? full.timeout : 30000,
          active: full.active !== false,
        });
        setToolValidationError(null);
      } finally {
        if (!cancelled) setToolDetailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTool?.sid, getTool]);

  useEffect(() => {
    if (newlyCreatedToolId) {
      const timer = setTimeout(() => setNewlyCreatedToolId(null), EDITOR_CONSTANTS.NEW_WORKER_HIGHLIGHT_MS);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedToolId]);


  // Handle worker selection
  const handleSelectWorker = useCallback(
    (worker: Worker) => {
      const currentSid = selectedWorker?.value?.raw?.sid;
      const nextSid = worker?.value?.raw?.sid;
      const hasUnsavedWorkerChanges =
        editorState.isEditingScript ||
        editorState.isEditingNote ||
        editorState.isEditingConfig;
      if (
        currentSid != null &&
        nextSid != null &&
        currentSid !== nextSid &&
        hasUnsavedWorkerChanges
      ) {
        if (
          !window.confirm(
            "You have unsaved changes to this worker. Discard and switch?",
          )
        ) {
          return;
        }
      }
      setSelectedWorker(worker);
      editorState.loadWorker(worker, workerEditor.formattedScriptsCache.current);
      setValidationError(null);
    },
    [
      selectedWorker?.value?.raw?.sid,
      editorState,
      workerEditor.formattedScriptsCache,
      setSelectedWorker,
    ],
  );

  // Handle create worker
  const handleCreateWorker = useCallback(
    async (request: WorkerCreateRequest): Promise<void> => {
      // The workerOperations hook will call onWorkerLoaded callback
      // which will select and load the worker
      await workerOperations.handleCreateWorker(request);
    },
    [workerOperations],
  );

  // Handle toggle worker status click
  const handleToggleWorkerStatusClick = useCallback(
    (worker?: Worker) => {
      const targetWorker = worker || selectedWorker;
      if (!targetWorker) return;
      setSelectedWorker(targetWorker);
      setShowToggleConfirmDialog(true);
    },
    [selectedWorker, setSelectedWorker],
  );

  // Handle toggle worker status
  const handleToggleWorkerStatus = useCallback(async () => {
    if (!selectedWorker) {
      return;
    }
    
    await workerOperations.handleToggleWorkerStatus();
  }, [workerOperations, selectedWorker]);

  // Handle migrate worker
  const handleMigrateWorker = useCallback(
    async (worker: Worker): Promise<Worker | null> => {
      const result = await workerOperations.handleMigrateWorker(worker);
      if (result) {
        handleSelectWorker(result);
      }
      return result;
    },
    [workerOperations, handleSelectWorker],
  );

  // Handle stop all
  const handleStopAll = useCallback(async () => {
    const result = await workerOperations.handleStopAll();
    await loadWorkers();
    return result;
  }, [workerOperations, loadWorkers]);

  // Handle open migrate dialog
  const handleOpenMigrateDialog = useCallback((worker: Worker) => {
    setWorkerToMigrate(worker);
    setShowMigrateDialog(true);
  }, []);

  // Handle close developer access dialog
  const handleCloseDeveloperAccessDialog = useCallback(
    (open: boolean) => {
      setShowDeveloperAccessDialog(open);
      if (!open && !connectionSession?.developer) {
        navigateTo("welcome");
      }
    },
    [connectionSession?.developer],
  );

  // Handle save all
  const handleSaveAll = useCallback(async () => {
    if (!selectedWorker) return;

    await workerOperations.handleSaveAll();

    // After save, update all originals to mark as not editing
    editorState.updateOriginalsAfterSave();
  }, [workerOperations, selectedWorker, editorState]);

  // Handle reset
  const handleReset = useCallback(() => {
    editorState.resetAll();
  }, [editorState]);

  // Tool handlers
  const handleSelectTool = useCallback(
    (tool: ToolRaw) => {
      const currentSid = selectedTool?.sid;
      const isLeavingCurrentTool = currentSid != null && currentSid !== tool.sid;
      const fullDataLoadedForCurrent = lastLoadedToolSidRef.current === currentSid;
      const hasRealUnsavedChanges = fullDataLoadedForCurrent && toolFormDirty();

      if (isLeavingCurrentTool && hasRealUnsavedChanges) {
        if (
          !window.confirm(
            "You have unsaved changes to this tool. Discard and switch?",
          )
        ) {
          return;
        }
      }
      setSelectedTool(tool);
      setToolValidationError(null);
    },
    [selectedTool, toolFormDirty],
  );

  const handleSaveTool = useCallback(async () => {
    if (!selectedTool) return;
    const nameCheck = validateToolName(toolForm.name);
    if (!nameCheck.valid) {
      setToolValidationError(nameCheck.error ?? "Invalid name");
      return;
    }
    const timeoutCheck = validateToolTimeout(toolForm.timeout);
    if (!timeoutCheck.valid) {
      setToolValidationError(timeoutCheck.error ?? "Invalid timeout");
      return;
    }
    const inputSchemaCheck = validateJsonObject(toolForm.inputSchemaJson || "{}");
    if (!inputSchemaCheck.valid) {
      setToolValidationError(inputSchemaCheck.error ?? "Invalid input schema JSON");
      return;
    }
    let inputSchema: Record<string, unknown>;
    try {
      inputSchema = JSON.parse(toolForm.inputSchemaJson || "{}");
    } catch {
      setToolValidationError("Invalid input schema JSON");
      return;
    }
    let outputSchema: Record<string, unknown> | undefined;
    if (toolForm.outputSchemaJson.trim()) {
      const outputCheck = validateJsonObject(toolForm.outputSchemaJson);
      if (!outputCheck.valid) {
        setToolValidationError(outputCheck.error ?? "Invalid output schema JSON");
        return;
      }
      try {
        outputSchema = JSON.parse(toolForm.outputSchemaJson);
      } catch {
        setToolValidationError("Invalid output schema JSON");
        return;
      }
    }
    setToolValidationError(null);
    setToolsSaving(true);
    try {
      const saved = await setTool({
        sid: selectedTool.sid,
        name: toolForm.name,
        description: toolForm.description,
        script: toolForm.script,
        inputSchema,
        outputSchema,
        category: toolForm.category as ToolRaw["category"],
        scope: toolForm.scope as "local" | "network",
        timeout: toolForm.timeout,
        active: toolForm.active,
      });
      if (saved) {
        setSelectedTool(saved);
        toast.success("Tool saved");
      }
    } finally {
      setToolsSaving(false);
    }
  }, [selectedTool, toolForm, setTool]);

  const handleResetTool = useCallback(() => {
    if (!selectedTool) return;
    setToolForm({
      name: selectedTool.name ?? "",
      description: selectedTool.description ?? "",
      script: selectedTool.script ?? "",
      inputSchemaJson:
        selectedTool.inputSchema && typeof selectedTool.inputSchema === "object"
          ? JSON.stringify(selectedTool.inputSchema, null, 2)
          : "{}",
      outputSchemaJson:
        selectedTool.outputSchema && typeof selectedTool.outputSchema === "object"
          ? JSON.stringify(selectedTool.outputSchema, null, 2)
          : "{}",
      category: selectedTool.category ?? "utility",
      scope: selectedTool.scope ?? "local",
      timeout: typeof selectedTool.timeout === "number" ? selectedTool.timeout : 30000,
      active: selectedTool.active !== false,
    });
    setToolValidationError(null);
  }, [selectedTool]);

  const handleDeleteToolClick = useCallback(() => {
    if (selectedTool) setShowDeleteToolDialog(true);
  }, [selectedTool]);

  const handleCreateTool = useCallback(
    async (request: import("./types/tools.types").SetToolRequest) => {
      const saved = await setTool(request);
      if (saved) {
        setSelectedTool(saved);
        setNewlyCreatedToolId(saved.sid);
      }
      return saved;
    },
    [setTool],
  );

  const handleConfirmDeleteTool = useCallback(
    async (toolId: string, force: boolean) => {
      const ok = await deleteTool(toolId, force);
      if (ok) {
        setSelectedTool(null);
      }
      return ok;
    },
    [deleteTool],
  );

  const handleCallTool = useCallback(
    async (toolId: string, input: Record<string, unknown>) => {
      return callTool({ toolId, input });
    },
    [callTool],
  );

  // Refs for keyboard shortcuts
  const handleSaveAllRef = useRef<() => void>(() => {});
  const handleToggleWorkerStatusClickRef = useRef<(worker?: Worker) => void>(() => {});
  const handleSelectWorkerRef = useRef<(worker: Worker) => void>(() => {});

  useEffect(() => {
    handleSaveAllRef.current = handleSaveAll;
  }, [handleSaveAll]);

  useEffect(() => {
    handleToggleWorkerStatusClickRef.current = handleToggleWorkerStatusClick;
  }, [handleToggleWorkerStatusClick]);

  useEffect(() => {
    handleSelectWorkerRef.current = handleSelectWorker;
  }, [handleSelectWorker]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedWorker,
    isEditing: editorState.isEditingScript,
    isEditingNote: editorState.isEditingNote,
    isEditingConfig: editorState.isEditingConfig,
    filteredWorkers,
    showCreateDialog,
    showMigrateDialog,
    showStopAllDialog,
    showToggleConfirmDialog,
    showStatsPanel,
    activeTab,
    searchInputRef,
    onSave: () => handleSaveAllRef.current(),
    onCreateWorker: () => setShowCreateDialog(true),
    onToggleWorker: (worker: Worker) => handleToggleWorkerStatusClickRef.current(worker),
    onSelectWorker: (worker: Worker) => handleSelectWorkerRef.current(worker),
    onSetActiveTab: (tab: string) => setActiveTab(tab),
    onCloseCreateDialog: () => setShowCreateDialog(false),
    onCloseMigrateDialog: () => setShowMigrateDialog(false),
    onCloseStopAllDialog: () => setShowStopAllDialog(false),
    onCloseToggleConfirmDialog: () => setShowToggleConfirmDialog(false),
    onCloseStatsPanel: () => setShowStatsPanel(false),
  });

  // Mobile view
  if (mobile) {
    return (
      <div className="h-full bg-gradient-to-br from-background via-muted/10 to-background p-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-4 mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-amber-500/10 rounded animate-pulse" />
            <div className="relative w-16 h-16 bg-card rounded flex items-center justify-center border border-amber-500/20 shadow-lg">
              <Code className="w-8 h-8 text-amber-700 dark:text-amber-400 transition-transform duration-300" />
            </div>
          </div>
          <h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2 animate-in fade-in duration-700">
            PROTOCOL EDITOR
          </h2>
          <p
            className="text-muted-foreground font-mono text-sm mb-6 animate-in fade-in duration-700"
            style={{ animationDelay: "100ms" }}
          >
            Desktop interface required
          </p>
          <div
            className="p-4 bg-card/50 border border-border rounded text-left shadow-sm animate-in fade-in duration-700"
            style={{ animationDelay: "200ms" }}
          >
            <p className="text-xs text-muted-foreground mb-3 font-semibold">
              The Protocol Editor requires a desktop display for optimal workflow:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Monaco Editor with syntax highlighting</span>
              </li>
              <li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Split-panel layout for code and worker list</span>
              </li>
              <li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Real-time execution logs and statistics</span>
              </li>
            </ul>
          </div>
          <p
            className="text-xs text-muted-foreground mt-4 animate-in fade-in duration-700"
            style={{ animationDelay: "300ms" }}
          >
            Please open STELS on a desktop browser to access the Protocol Editor
          </p>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-border border-t-amber-400 rounded-full animate-spin mx-auto">
            </div>
            <Cpu className="w-6 h-6 text-amber-700 dark:text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-amber-700 dark:text-amber-400 font-mono text-sm font-bold">
            LOADING PROTOCOL REGISTRY
          </div>
        </div>
      </div>
    );
  }

  // Main view - VS Code-style layout: Activity Bar | Sidebar + Editor | Status Bar
  return connectionSession ? (
    <div className="editor-layout h-full flex flex-col bg-[var(--editor-main)]">
      <div className="flex flex-1 min-h-0">
        <EditorActivityBar
          activeId={editorMode}
          onSelect={(id) => setEditorMode(id)}
        />

        <div className="editor-body flex flex-1 flex-col min-w-0 min-h-0">
          {/* Global error banner */}
          {(editorMode === "workers" && workersError) || (editorMode === "tools" && toolsError) ? (
            <div
              className="flex-shrink-0 px-3 py-2 flex items-center justify-between gap-3 bg-red-500/10 border-b border-red-500/30 text-red-700 dark:text-red-400"
              role="alert"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                <span className="text-sm truncate">
                  {editorMode === "workers" ? workersError : toolsError}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    if (editorMode === "workers") clearError();
                    else clearToolsError();
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    if (editorMode === "workers") loadWorkers();
                    else listTools();
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          ) : null}

          <Split
            className="flex flex-1 min-h-0 bg-[var(--editor-main)] [&_.gutter]:!bg-[var(--editor-tab-border)] [&_.gutter:hover]:!bg-[var(--editor-accent)]"
            direction="horizontal"
            sizes={EDITOR_CONSTANTS.SPLIT_SIZES}
            minSize={EDITOR_CONSTANTS.SPLIT_MIN_SIZES}
            gutterSize={4}
          >
        {editorMode === "workers" ? (
          <>
            <div className="editor-sidebar-wrap flex flex-col min-w-0 min-h-0 w-full bg-[var(--editor-sidebar)] border-r border-[var(--editor-sidebar-border)]">
              <WorkerRegistryPanel
              workers={workers}
              selectedWorker={selectedWorker}
              loading={loading}
              searchTerm={searchTerm}
              filterActive={filterActive}
              filterExecutionMode={filterExecutionMode}
              filterPriority={filterPriority}
              filterScope={filterScope}
              sortOrder={sortOrder}
              newlyCreatedWorker={newlyCreatedWorker}
              onSearchChange={setSearchTerm}
              onFilterActiveChange={setFilterActive}
              onFilterExecutionModeChange={setFilterExecutionMode}
              onFilterPriorityChange={setFilterPriority}
              onFilterScopeChange={setFilterScope}
              onSortOrderChange={setSortOrder}
              onSelectWorker={handleSelectWorker}
              onCreateWorker={() => setShowCreateDialog(true)}
              onShowStats={() => setShowStatsPanel(true)}
              onStopAll={() => setShowStopAllDialog(true)}
              searchInputRef={searchInputRef}
              onMigrate={handleOpenMigrateDialog}
            />
            </div>
            <div className="editor-main-wrap flex flex-col min-w-0 min-h-0 flex-1 bg-[var(--editor-main)]">
            <CodeEditorPanel
              worker={selectedWorker}
              script={editorState.state.script}
              note={editorState.state.note}
              config={editorState.state.config}
              isEditingScript={editorState.isEditingScript}
              isEditingNote={editorState.isEditingNote}
              isEditingConfig={editorState.isEditingConfig}
              validationError={validationError}
              saving={workerOperations.saving}
              activeTab={activeTab}
              onScriptChange={workerEditor.handleEditorChange}
              onNoteChange={workerEditor.handleNoteChange}
              onConfigChange={workerEditor.handleConfigChange}
              onTabChange={setActiveTab}
              onSave={handleSaveAll}
              onReset={handleReset}
              onFormatCodeReady={() => {}}
              onUndoRedoReady={() => {}}
              onToggle={handleToggleWorkerStatusClick}
              onMigrate={() => {
                if (selectedWorker) {
                  handleOpenMigrateDialog(selectedWorker);
                }
              }}
              getLeaderInfo={getLeaderInfo}
            />
            </div>
          </>
        ) : (
          <>
            <div className="editor-sidebar-wrap flex flex-col min-w-0 min-h-0 w-full bg-[var(--editor-sidebar)] border-r border-[var(--editor-sidebar-border)]">
            <ToolRegistryPanel
              tools={tools}
              selectedTool={selectedTool}
              loading={toolsLoading}
              error={toolsError}
              searchTerm={toolSearchTerm}
              filterCategory={toolFilterCategory}
              filterScope={toolFilterScope}
              filterActive={toolFilterActive}
              sortOrder={toolSortOrder}
              newlyCreatedToolId={newlyCreatedToolId}
              onSearchChange={setToolSearchTerm}
              onFilterCategoryChange={setToolFilterCategory}
              onFilterScopeChange={setToolFilterScope}
              onFilterActiveChange={setToolFilterActive}
              onSortOrderChange={setToolSortOrder}
              onSelectTool={handleSelectTool}
              onCreateTool={() => setShowCreateToolDialog(true)}
              onRetry={listTools}
              searchInputRef={toolSearchInputRef}
              canCreate={connectionSession?.developer === true}
            />
            </div>
            <div className="editor-main-wrap flex flex-col min-w-0 min-h-0 flex-1 bg-[var(--editor-main)]">
            <ToolEditorPanel
              tool={selectedTool}
              name={toolForm.name}
              description={toolForm.description}
              script={toolForm.script}
              inputSchemaJson={toolForm.inputSchemaJson}
              outputSchemaJson={toolForm.outputSchemaJson}
              category={toolForm.category}
              scope={toolForm.scope}
              timeout={toolForm.timeout}
              active={toolForm.active}
              validationError={toolValidationError}
              saving={toolsSaving}
              loading={toolDetailsLoading}
              hasUnsavedChanges={lastLoadedToolSidRef.current === selectedTool?.sid && toolFormDirty()}
              onNameChange={(v) => setToolForm((f) => ({ ...f, name: v }))}
              onDescriptionChange={(v) => setToolForm((f) => ({ ...f, description: v }))}
              onScriptChange={(v) => setToolForm((f) => ({ ...f, script: v ?? "" }))}
              onInputSchemaChange={(v) => setToolForm((f) => ({ ...f, inputSchemaJson: v }))}
              onOutputSchemaChange={(v) => setToolForm((f) => ({ ...f, outputSchemaJson: v }))}
              onCategoryChange={(v) => setToolForm((f) => ({ ...f, category: v }))}
              onScopeChange={(v) => setToolForm((f) => ({ ...f, scope: v }))}
              onTimeoutChange={(v) => setToolForm((f) => ({ ...f, timeout: v }))}
              onActiveChange={(v) => setToolForm((f) => ({ ...f, active: v }))}
              onSave={handleSaveTool}
              onReset={handleResetTool}
              onDelete={connectionSession?.developer === true ? handleDeleteToolClick : undefined}
              onCallTool={() => setShowCallToolDialog(true)}
              canEdit={connectionSession?.developer === true}
            />
            </div>
          </>
        )}
          </Split>
        </div>
      </div>

      <EditorStatusBar
        mode={editorMode}
        primaryLabel={editorMode === "workers" ? "Protocol Registry" : "MCP Tools"}
        secondaryLabel={
          editorMode === "workers"
            ? selectedWorker?.value?.raw?.sid ?? undefined
            : selectedTool?.name ?? undefined
        }
        encoding="UTF-8"
      />

      {/* Dialogs */}
      <CreateWorkerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateWorker}
      />

      <StopAllDialog
        open={showStopAllDialog}
        onOpenChange={setShowStopAllDialog}
        onConfirm={handleStopAll}
        activeWorkersCount={workers.filter((w) => w.value.raw.active).length}
      />

      <MigrateWorkerDialog
        open={showMigrateDialog}
        onOpenChange={setShowMigrateDialog}
        worker={workerToMigrate}
        onMigrate={handleMigrateWorker}
      />

      <ConfirmToggleDialog
        open={showToggleConfirmDialog}
        onOpenChange={setShowToggleConfirmDialog}
        worker={selectedWorker}
        onConfirm={handleToggleWorkerStatus}
        isToggling={workerOperations.toggling}
      />

      <CreateToolDialog
        open={showCreateToolDialog}
        onOpenChange={setShowCreateToolDialog}
        onSubmit={handleCreateTool}
      />

      <DeleteToolDialog
        open={showDeleteToolDialog}
        onOpenChange={setShowDeleteToolDialog}
        tool={selectedTool}
        onConfirm={handleConfirmDeleteTool}
      />

      <CallToolDialog
        open={showCallToolDialog}
        onOpenChange={setShowCallToolDialog}
        tool={selectedTool}
        onExecute={handleCallTool}
      />

      {showStatsPanel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsPanel(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <WorkerStatsPanel onRefresh={getWorkerStats} />
          </div>
        </div>
      )}

      <DeveloperAccessRequestDialog
        open={showDeveloperAccessDialog}
        onOpenChange={handleCloseDeveloperAccessDialog}
      />
    </div>
  ) : (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 flex items-center justify-center mb-8 mx-auto relative">
          <div className="w-16 h-16 rounded flex items-center justify-center">
            <Graphite size={6} />
          </div>
        </div>

        <h2 className="text-amber-700 dark:text-amber-400 font-mono text-2xl font-bold mb-3">
          AUTHENTICATION REQUIRED
        </h2>

        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Authenticate with GitHub to access the Protocol Editor and build
          autonomous web agents
        </p>

        <div className="space-y-4">
          <div className="bg-card/10 border border-border rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              </div>
              <span className="text-card-foreground font-mono text-sm font-bold">
                PROTOCOL REGISTRY
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Create and manage distributed protocols for autonomous agents
            </p>
          </div>

          <div className="bg-card/10 border border-border rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Code className="w-4 h-4 text-green-700 dark:text-green-700 dark:text-green-600" />
              </div>
              <span className="text-card-foreground font-mono text-sm font-bold">
                CODE EDITOR
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Write and deploy workers across the heterogeneous network
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigateTo("welcome")}
          className="mt-8 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black font-mono text-sm font-bold px-8 py-3 rounded shadow-lg shadow-amber-400/20 transition-all duration-200 hover:shadow-amber-400/30"
        >
          <Code className="w-4 h-4 mr-2" />
          AUTHENTICATE
        </Button>

        <div className="mt-6 px-4 py-2 bg-muted/50 rounded inline-block">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            GitHub authentication required
          </div>
        </div>
      </div>
    </div>
  );
}

