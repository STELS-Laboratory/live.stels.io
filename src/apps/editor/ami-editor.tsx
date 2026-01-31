/**
 * AMI Editor - Refactored
 * Main component orchestrating the editor interface
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Split from "react-split";
import { Code, Cpu, X } from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/graphite";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "./store.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useMobile } from "@/hooks/use-mobile";
import { navigateTo } from "@/lib/router";
import { toast } from "@/stores";
import { logError, getSafeKeys } from "./utils/logger.ts";
import { EDITOR_CONSTANTS } from "./ami-editor/constants";
import { useKeyboardShortcuts } from "./ami-editor/hooks/use-keyboard-shortcuts";
import { useWorkerFilters } from "./ami-editor/hooks/use-worker-filters";
import { CreateWorkerDialog } from "./ami-editor/create-worker-dialog";
import { StopAllDialog } from "./ami-editor/stop-all-dialog";
import { MigrateWorkerDialog } from "./ami-editor/migrate-worker-dialog";
import { ConfirmToggleDialog } from "./ami-editor/confirm-toggle-dialog";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer-access-request";
import { WorkerStatsPanel } from "./ami-editor/worker-stats-panel";
import { WorkerRegistryPanel } from "./components/worker-registry-panel";
import { CodeEditorPanel } from "./components/code-editor-panel";
import { useEditorState } from "./hooks/use-editor-state";
import { useWorkerEditor } from "./hooks/use-worker-editor";
import { useWorkerOperations } from "./hooks/use-worker-operations";
import type { Worker, WorkerCreateRequest } from "@/types/apps/editor/types";

export function AMIEditor() {
  const mobile = useMobile();
  const { connectionSession } = useAuthStore();
  const listWorkers = useEditorStore((state) => state.listWorkers);
  const getLeaderInfo = useEditorStore((state) => state.getLeaderInfo);
  const getWorkerStats = useEditorStore((state) => state.getWorkerStats);

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

  // Editor state
  const [activeTab, setActiveTab] = useState("code");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadWorkersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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


  // Handle worker selection
  const handleSelectWorker = useCallback(
    (worker: Worker) => {
      setSelectedWorker(worker);
      editorState.loadWorker(worker, workerEditor.formattedScriptsCache.current);
      setValidationError(null);
    },
    [editorState, workerEditor.formattedScriptsCache, setSelectedWorker],
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
    
    // After save, update original script to current script (since it was saved)
    editorState.updateOriginalScript(editorState.state.script);
  }, [workerOperations, selectedWorker, editorState]);

  // Handle reset
  const handleReset = useCallback(() => {
    editorState.resetAll();
  }, [editorState]);

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

  // Main view
  return connectionSession ? (
    <div className="h-full">
      <Split
        className="flex h-full bg-background p-0 m-0"
        direction="horizontal"
        sizes={EDITOR_CONSTANTS.SPLIT_SIZES}
        minSize={EDITOR_CONSTANTS.SPLIT_MIN_SIZES}
        gutterSize={2}
      >
        {/* Left Panel - Workers Registry */}
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

        {/* Right Panel - Code Editor */}
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
      </Split>

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

