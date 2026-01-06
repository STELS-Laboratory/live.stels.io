/**
 * Hook for worker operations
 * Handles save, toggle, migrate, create operations
 */

import { useState, useCallback } from "react";
import { useEditorStore } from "../store.ts";
import { toast } from "@/stores";
import { logError } from "../utils/logger.ts";
import { setCacheValue } from "../utils/cache.ts";
import { validateAndCleanConfig } from "../services/worker_validator.ts";
import type { Worker, WorkerCreateRequest } from "@/types/apps/editor/types";
import type {
  UseWorkerOperationsReturn,
  EditorState,
} from "../types/editor.types.ts";

interface UseWorkerOperationsOptions {
  selectedWorker: Worker | null;
  editorState: EditorState;
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  setSelectedWorker: (worker: Worker | null, skipLoadWorker?: boolean) => void;
  setValidationError: (error: string | null) => void;
  formattedScriptsCache: React.MutableRefObject<Map<string, string>>;
  onWorkerLoaded?: (worker: Worker) => void;
  onNewWorkerCreated?: (workerId: string) => void;
}

/**
 * Hook for worker operations
 */
export function useWorkerOperations({
  selectedWorker,
  editorState,
  setWorkers,
  setSelectedWorker,
  setValidationError,
  formattedScriptsCache,
  onWorkerLoaded,
  onNewWorkerCreated,
}: UseWorkerOperationsOptions): UseWorkerOperationsReturn {
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const createWorker = useEditorStore((state) => state.createWorker);
  const updateWorker = useEditorStore((state) => state.updateWorker);
  const migrateWorkerWithNewSid = useEditorStore(
    (state) => state.migrateWorkerWithNewSid,
  );
  const stopAllWorkers = useEditorStore((state) => state.stopAllWorkers);

  const handleCreateWorker = useCallback(
    async (request: WorkerCreateRequest): Promise<void> => {
      const created = await createWorker(request);
      if (created) {
        const newWorker: Worker = created;
        setWorkers((prev) => [newWorker, ...prev]);

        if (onWorkerLoaded) {
          onWorkerLoaded(newWorker);
        }

        if (onNewWorkerCreated) {
          onNewWorkerCreated(newWorker.value.raw.sid);
        }

        toast.success(
          "Worker created successfully",
          `ID: ${newWorker.value.raw.sid}`,
        );
      }
    },
    [createWorker, setWorkers, onWorkerLoaded, onNewWorkerCreated],
  );

  const handleSaveAll = useCallback(async (): Promise<void> => {
    if (
      !selectedWorker ||
      (!editorState.isEditingScript &&
        !editorState.isEditingNote &&
        !editorState.isEditingConfig)
    ) {
      return;
    }

    // Clear previous validation errors
    setValidationError(null);

    // Validate and clean config
    const { config: cleanedConfig, validation } = validateAndCleanConfig(
      editorState.config,
    );

    if (!validation.valid) {
      setValidationError(validation.error || "Invalid configuration");
      return;
    }

    setSaving(true);

    try {
      // API requires FULL raw object with ALL fields (not partial update)
      const updatedRaw = {
        sid: selectedWorker.value.raw.sid,
        nid: cleanedConfig.nid,
        active: selectedWorker.value.raw.active,
        mode: cleanedConfig.mode,
        scope: cleanedConfig.scope,
        executionMode: cleanedConfig.executionMode,
        priority: cleanedConfig.priority,
        accountId: cleanedConfig.accountId || undefined,
        assignedNode: cleanedConfig.assignedNode || undefined,
        note: editorState.note,
        script: editorState.script,
        dependencies: cleanedConfig.dependencies,
        version: cleanedConfig.version,
        timestamp: Date.now(),
      };

      const workerBody: Worker = {
        ...selectedWorker,
        value: {
          ...selectedWorker.value,
          raw: updatedRaw,
        },
      };

      const result = await updateWorker(workerBody);

      if (result) {
        // Update result with the saved script and note (use values from editor)
        const updatedResult: Worker = {
          ...result,
          value: {
            ...result.value,
            raw: {
              ...result.value.raw,
              script: editorState.script,
              note: editorState.note,
            },
          },
        };

        setWorkers((prev) =>
          prev.map((w) =>
            w.value.raw.sid === selectedWorker.value.raw.sid
              ? updatedResult
              : w,
          ),
        );
        setSelectedWorker(updatedResult);

        // Update cache with saved script
        setCacheValue(
          formattedScriptsCache.current,
          updatedResult.value.raw.sid,
          editorState.script,
        );

        // Update original script in editor state after save
        // This is done by the parent component after save

        toast.success("Worker saved successfully");
      } else {
        toast.error("Failed to save worker", "No response from server");
      }
    } catch (error) {
      logError("Failed to save worker:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(
        "Failed to save worker",
        `${errorMessage}. Please check your connection and try again.`,
      );
    } finally {
      setSaving(false);
    }
  }, [
    selectedWorker,
    editorState,
    setWorkers,
    setSelectedWorker,
    setValidationError,
    formattedScriptsCache,
    updateWorker,
  ]);

  const handleToggleWorkerStatus = useCallback(async (): Promise<void> => {
    if (!selectedWorker || !selectedWorker.value || !selectedWorker.value.raw) {
      return;
    }

    // Optimistic update - update UI immediately
    const previousState = selectedWorker.value.raw.active;
    const optimisticWorker: Worker = {
      ...selectedWorker,
      value: {
        ...selectedWorker.value,
        raw: {
          ...selectedWorker.value.raw,
          active: !previousState,
        },
      },
    };

    // Update UI immediately - skip loadWorker since we're only changing active status
    // Don't reload the entire worker state, just update the selectedWorker reference
    setSelectedWorker(optimisticWorker, true);
    setWorkers((prev) =>
      prev.map((w) =>
        w.value.raw.sid === selectedWorker.value.raw.sid
          ? optimisticWorker
          : w,
      ),
    );

    setToggling(true);
    try {
      // API requires FULL raw object with ALL fields
      const updatedRaw = {
        sid: selectedWorker.value.raw.sid,
        nid: selectedWorker.value.raw.nid,
        active: !previousState,
        mode: selectedWorker.value.raw.mode || "loop",
        scope: selectedWorker.value.raw.scope || "local",
        executionMode: selectedWorker.value.raw.executionMode || "parallel",
        priority: selectedWorker.value.raw.priority || "normal",
        accountId: selectedWorker.value.raw.accountId || undefined,
        assignedNode: selectedWorker.value.raw.assignedNode || undefined,
        note: selectedWorker.value.raw.note,
        script: selectedWorker.value.raw.script,
        dependencies: selectedWorker.value.raw.dependencies,
        version: selectedWorker.value.raw.version,
        timestamp: Date.now(),
      };

      const workerBody: Worker = {
        ...selectedWorker,
        value: {
          ...selectedWorker.value,
          raw: updatedRaw,
        },
      };

      const result = await updateWorker(workerBody);

      if (result) {
        setWorkers((prev) =>
          prev.map((w) =>
            w.value.raw.sid === selectedWorker.value.raw.sid ? result : w,
          ),
        );
        // Skip loadWorker since we're only updating active status, not the full worker
        setSelectedWorker(result, true);
      } else {
        // If result is null, keep the optimistic update
        // Don't clear selectedWorker - keep the optimistic state
        // The optimistic update already reflects the new state
        // Update workers list with optimistic worker if result is null
        setWorkers((prev) =>
          prev.map((w) =>
            w.value.raw.sid === selectedWorker.value.raw.sid
              ? optimisticWorker
              : w,
          ),
        );
        // Keep the optimistic worker as selected - skip loadWorker
        setSelectedWorker(optimisticWorker, true);
      }
    } catch (error) {
      // Revert optimistic update on error
      // Only revert if selectedWorker is still valid
      if (selectedWorker && selectedWorker.value && selectedWorker.value.raw) {
        // Skip loadWorker when reverting - we're just reverting the active status
        setSelectedWorker(selectedWorker, true);
        setWorkers((prev) =>
          prev.map((w) =>
            w.value.raw.sid === selectedWorker.value.raw.sid
              ? selectedWorker
              : w,
          ),
        );
      }

      logError("Failed to toggle worker status:", error);
      toast.error(
        "Failed to toggle worker status",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    } finally {
      setToggling(false);
    }
  }, [selectedWorker, setWorkers, setSelectedWorker, updateWorker]);

  const handleMigrateWorker = useCallback(
    async (worker: Worker): Promise<Worker | null> => {
      try {
        const migratedWorker = await migrateWorkerWithNewSid(worker);
        if (migratedWorker) {
          // Add to workers list
          setWorkers((prev) => [migratedWorker, ...prev]);

          if (onWorkerLoaded) {
            onWorkerLoaded(migratedWorker);
          }

          if (onNewWorkerCreated) {
            onNewWorkerCreated(migratedWorker.value.raw.sid);
          }

          toast.success(
            "Worker migrated successfully",
            `New ID: ${migratedWorker.value.raw.sid}`,
          );
        }
        return migratedWorker;
      } catch (error) {
        logError("Failed to migrate worker:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(
          "Failed to migrate worker",
          `${errorMessage}. Ensure the worker is stopped and network is available.`,
        );

        throw error;
      }
    },
    [
      migrateWorkerWithNewSid,
      setWorkers,
      onWorkerLoaded,
      onNewWorkerCreated,
    ],
  );

  const handleStopAll = useCallback(
    async (): Promise<{ stopped: number; failed: number; total: number }> => {
      try {
        const result = await stopAllWorkers();
        return result;
      } catch (error) {
        logError("Failed to stop all workers:", error);
        toast.error(
          "Failed to stop all workers",
          error instanceof Error ? error.message : "Unknown error occurred",
        );

        throw error;
      }
    },
    [stopAllWorkers],
  );

  return {
    handleCreateWorker,
    handleSaveAll,
    handleToggleWorkerStatus,
    handleMigrateWorker,
    handleStopAll,
    saving,
    toggling,
  };
}

