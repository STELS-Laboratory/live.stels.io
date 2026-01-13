/**
 * Keyboard shortcuts hook for AMI Editor
 * Handles all keyboard shortcuts for better usability
 */

import { useEffect, useRef } from "react";
import type { Worker } from "../../store.ts";

interface UseKeyboardShortcutsOptions {
  selectedWorker: Worker | null;
  isEditing: boolean;
  isEditingNote: boolean;
  isEditingConfig: boolean;
  filteredWorkers: Worker[];
  showCreateDialog: boolean;
  showMigrateDialog: boolean;
  showStopAllDialog: boolean;
  showToggleConfirmDialog: boolean;
  showStatsPanel: boolean;
  activeTab: string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSave: () => void;
  onCreateWorker: () => void;
  onToggleWorker: (worker: Worker) => void;
  onSelectWorker: (worker: Worker) => void;
  onSetActiveTab: (tab: string) => void;
  onCloseCreateDialog: () => void;
  onCloseMigrateDialog: () => void;
  onCloseStopAllDialog: () => void;
  onCloseToggleConfirmDialog: () => void;
  onCloseStatsPanel: () => void;
}

/**
 * Hook for managing keyboard shortcuts in AMI Editor
 */
export function useKeyboardShortcuts({
  selectedWorker,
  isEditing,
  isEditingNote,
  isEditingConfig,
  filteredWorkers,
  showCreateDialog,
  showMigrateDialog,
  showStopAllDialog,
  showToggleConfirmDialog,
  showStatsPanel,
  activeTab,
  searchInputRef,
  onSave,
  onCreateWorker,
  onToggleWorker,
  onSelectWorker,
  onSetActiveTab,
  onCloseCreateDialog,
  onCloseMigrateDialog,
  onCloseStopAllDialog,
  onCloseToggleConfirmDialog,
  onCloseStatsPanel,
}: UseKeyboardShortcutsOptions): void {
  // Use refs to avoid recreating the handler on every dependency change
  const handlersRef = useRef({
    onSave,
    onCreateWorker,
    onToggleWorker,
    onSelectWorker,
    onSetActiveTab,
    onCloseCreateDialog,
    onCloseMigrateDialog,
    onCloseStopAllDialog,
    onCloseToggleConfirmDialog,
    onCloseStatsPanel,
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      onSave,
      onCreateWorker,
      onToggleWorker,
      onSelectWorker,
      onSetActiveTab,
      onCloseCreateDialog,
      onCloseMigrateDialog,
      onCloseStopAllDialog,
      onCloseToggleConfirmDialog,
      onCloseStatsPanel,
    };
  }, [
    onSave,
    onCreateWorker,
    onToggleWorker,
    onSelectWorker,
    onSetActiveTab,
    onCloseCreateDialog,
    onCloseMigrateDialog,
    onCloseStopAllDialog,
    onCloseToggleConfirmDialog,
    onCloseStatsPanel,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore shortcuts when typing in inputs/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        // Allow Cmd+S even in editor
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
            handlersRef.current.onSave();
          }
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey) {
        // Cmd/Ctrl + S: Save changes
        if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
            handlersRef.current.onSave();
          }
          return;
        }

        // Cmd/Ctrl + N: Create new worker
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          handlersRef.current.onCreateWorker();
          return;
        }

        // Cmd/Ctrl + F: Focus search
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          searchInputRef.current?.focus();
          return;
        }

        // Cmd/Ctrl + K: Quick actions (toggle worker)
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          if (selectedWorker) {
            handlersRef.current.onToggleWorker(selectedWorker);
          }
          return;
        }

        // Cmd/Ctrl + 1-4: Switch tabs
        if (e.key >= "1" && e.key <= "4") {
          e.preventDefault();
          const tabMap: Record<string, string> = {
            "1": "code",
            "2": "config",
            "3": "prompts",
            "4": "logs",
          };
          const tab = tabMap[e.key];
          if (tab && selectedWorker) {
            handlersRef.current.onSetActiveTab(tab);
          }
          return;
        }
      }

      // Escape: Close dialogs
      if (e.key === "Escape") {
        if (showCreateDialog) {
          handlersRef.current.onCloseCreateDialog();
          return;
        }
        if (showMigrateDialog) {
          handlersRef.current.onCloseMigrateDialog();
          return;
        }
        if (showStopAllDialog) {
          handlersRef.current.onCloseStopAllDialog();
          return;
        }
        if (showToggleConfirmDialog) {
          handlersRef.current.onCloseToggleConfirmDialog();
          return;
        }
        if (showStatsPanel) {
          handlersRef.current.onCloseStatsPanel();
          return;
        }
      }

      // Arrow keys: Navigate worker list
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (filteredWorkers.length === 0) return;
        e.preventDefault();
        const currentIndex = selectedWorker
          ? filteredWorkers.findIndex(
            (w) => w.value.raw.sid === selectedWorker.value.raw.sid,
          )
          : -1;
        const nextIndex = e.key === "ArrowDown"
          ? (currentIndex + 1) % filteredWorkers.length
          : currentIndex <= 0
          ? filteredWorkers.length - 1
          : currentIndex - 1;
        handlersRef.current.onSelectWorker(filteredWorkers[nextIndex]);
        return;
      }

      // Home/End: Navigate to first/last worker
      if (e.key === "Home" || e.key === "End") {
        if (filteredWorkers.length === 0) return;
        e.preventDefault();
        const targetWorker = e.key === "Home"
          ? filteredWorkers[0]
          : filteredWorkers[filteredWorkers.length - 1];
        handlersRef.current.onSelectWorker(targetWorker);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedWorker,
    isEditing,
    isEditingNote,
    isEditingConfig,
    filteredWorkers,
    showCreateDialog,
    showMigrateDialog,
    showStopAllDialog,
    showToggleConfirmDialog,
    showStatsPanel,
    activeTab,
    searchInputRef,
  ]);
}

