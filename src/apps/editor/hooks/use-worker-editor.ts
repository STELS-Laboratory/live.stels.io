/**
 * Hook for worker editing logic
 * Handles editor changes, note changes, config changes
 * Manages formatted scripts cache
 */

import { useRef, useCallback } from "react";
import type { Worker } from "@/types/apps/editor/types";
import type { UseWorkerEditorReturn, UseEditorStateReturn } from "../types/editor.types.ts";
import { setCacheValue } from "../utils/cache.ts";

/**
 * Hook for worker editing logic
 */
export function useWorkerEditor(
  selectedWorker: Worker | null,
  editorState: UseEditorStateReturn,
): UseWorkerEditorReturn {
  const formattedScriptsCache = useRef<Map<string, string>>(new Map());

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        editorState.setScript(value);

        // Save formatted version to cache for current worker
        if (selectedWorker) {
          setCacheValue(
            formattedScriptsCache.current,
            selectedWorker.value.raw.sid,
            value,
          );
        }
      }
    },
    [selectedWorker, editorState],
  );

  const handleNoteChange = useCallback(
    (value: string) => {
      const fullValue = value || "";
      editorState.setNote(fullValue);
    },
    [editorState],
  );

  const handleConfigChange = useCallback(
    (field: string, value: unknown) => {
      if (selectedWorker) {
        // Scope cannot be changed after creation
        if (field === "scope") {
          return;
        }
      }

      editorState.setConfigField(field as keyof typeof editorState.state.config, value);
    },
    [selectedWorker, editorState],
  );

  return {
    handleEditorChange,
    handleNoteChange,
    handleConfigChange,
    formattedScriptsCache,
  };
}

