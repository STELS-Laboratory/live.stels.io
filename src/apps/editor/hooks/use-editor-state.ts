/**
 * Hook for managing editor state
 * Handles script, note, config state and editing flags
 * Resolves synchronization issues with refs
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { Worker } from "@/types/apps/editor/types";
import type {
  UseEditorStateReturn,
  WorkerConfig,
} from "../types/editor.types.ts";
import { autoCorrectConfig } from "../services/worker-validator";

/**
 * Safe JSON.stringify that handles circular references
 */
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (error instanceof Error && error.message.includes("circular")) {
      return "{}"; // Return empty object string for circular refs
    }
    throw error;
  }
}

const DEFAULT_CONFIG: WorkerConfig = {
  scope: "local",
  executionMode: "leader",
  priority: "normal",
  mode: "loop",
  version: "1.19.2",
  dependencies: [],
  accountId: "",
  assignedNode: "",
  nid: "",
};

/**
 * Hook for managing editor state
 */
export function useEditorState(): UseEditorStateReturn {
  const [script, setScriptState] = useState<string>("");
  const [note, setNoteState] = useState<string>("");
  const [config, setConfigState] = useState<WorkerConfig>(DEFAULT_CONFIG);
  const [originalScript, setOriginalScript] = useState<string>("");

  // Use refs to track current values for synchronous access
  const scriptRef = useRef<string>("");
  const noteRef = useRef<string>("");
  const configRef = useRef<WorkerConfig>(DEFAULT_CONFIG);

  // Update refs when state changes
  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Computed editing flags
  const isEditingScript = script !== originalScript;
  const isEditingNote = useRef<boolean>(false);
  const isEditingConfig = useRef<boolean>(false);

  // Track original note and config for comparison
  const originalNoteRef = useRef<string>("");
  const originalConfigRef = useRef<WorkerConfig>(DEFAULT_CONFIG);

  // Update editing flags when values change
  useEffect(() => {
    isEditingNote.current = note !== originalNoteRef.current;
  }, [note]);

  useEffect(() => {
    isEditingConfig.current =
      safeStringify(config) !== safeStringify(originalConfigRef.current);
  }, [config]);

  const setScript = useCallback((value: string) => {
    setScriptState(value);
    scriptRef.current = value;
  }, []);

  const setNote = useCallback((value: string) => {
    setNoteState(value);
    noteRef.current = value;
  }, []);

  const setConfig = useCallback((newConfig: WorkerConfig) => {
    const corrected = autoCorrectConfig(newConfig);
    setConfigState(corrected);
    configRef.current = corrected;
  }, []);

  const setConfigField = useCallback(
    (field: keyof WorkerConfig, value: unknown) => {
      setConfigState((prev) => {
        const updated = { ...prev, [field]: value };
        const corrected = autoCorrectConfig(updated);
        configRef.current = corrected;
        return corrected;
      });
    },
    [],
  );

  const loadWorker = useCallback(
    (worker: Worker, formattedScriptsCache?: Map<string, string>) => {
      // Safety check
      if (!worker || !worker.value || !worker.value.raw) {
        return;
      }

      // Check if we have a formatted version in cache
      const cachedFormatted = formattedScriptsCache?.get(worker.value.raw.sid);
      const scriptToLoad = cachedFormatted || worker.value.raw.script;
      
      setScript(scriptToLoad);
      // Store original script for comparison (use the actual script from worker, not cached)
      setOriginalScript(worker.value.raw.script);

      const noteValue = worker.value.raw.note || "";
      setNote(noteValue);
      originalNoteRef.current = noteValue;

      const scope = worker.value.raw.scope ?? "local";
      let executionMode = worker.value.raw.executionMode ?? "leader";

      // Auto-correct: local scope must use leader mode
      if (
        scope === "local" &&
        (executionMode === "parallel" || executionMode === "exclusive")
      ) {
        executionMode = "leader";
      }

      const workerConfig: WorkerConfig = {
        scope,
        executionMode,
        priority: worker.value.raw.priority ?? "normal",
        mode: worker.value.raw.mode ?? "loop",
        version: worker.value.raw.version ?? "1.19.2",
        dependencies: worker.value.raw.dependencies ?? [],
        accountId: worker.value.raw.accountId ?? "",
        assignedNode: worker.value.raw.assignedNode ?? "",
        nid: worker.value.raw.nid ?? "",
      };

      const corrected = autoCorrectConfig(workerConfig);
      setConfig(corrected);
      originalConfigRef.current = corrected;
    },
    [setScript, setNote, setConfig],
  );

  const resetScript = useCallback(() => {
    setScript(originalScript);
    scriptRef.current = originalScript;
  }, [originalScript, setScript]);

  const resetNote = useCallback(() => {
    setNote(originalNoteRef.current);
    noteRef.current = originalNoteRef.current;
  }, [setNote]);

  const resetConfig = useCallback(() => {
    setConfig(originalConfigRef.current);
    configRef.current = originalConfigRef.current;
  }, [setConfig]);

  const resetAll = useCallback(() => {
    resetScript();
    resetNote();
    resetConfig();
  }, [resetScript, resetNote, resetConfig]);

  // Update original script after save (to mark as not editing)
  const updateOriginalScript = useCallback((script: string) => {
    setOriginalScript(script);
  }, []);

  return {
    state: {
      script,
      note,
      config,
      originalScript,
      isEditingScript,
      isEditingNote: isEditingNote.current,
      isEditingConfig: isEditingConfig.current,
    },
    setScript,
    setNote,
    setConfig,
    setConfigField,
    loadWorker,
    resetScript,
    resetNote,
    resetConfig,
    resetAll,
    updateOriginalScript,
    isEditing: isEditingScript || isEditingNote.current || isEditingConfig.current,
    isEditingScript,
    isEditingNote: isEditingNote.current,
    isEditingConfig: isEditingConfig.current,
  };
}

