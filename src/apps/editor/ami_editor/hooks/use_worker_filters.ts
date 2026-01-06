/**
 * Hook for filtering and sorting workers
 * Optimized with early returns and cached computations
 */

import { useMemo } from "react";
import type { Worker } from "../../store.ts";

export type FilterActive = "all" | "active" | "inactive";
export type SortOrder = "asc" | "desc";

interface UseWorkerFiltersOptions {
  workers: Worker[];
  searchTerm: string;
  filterActive: boolean | null; // null = all, true = active, false = inactive
  filterExecutionMode: string | null;
  filterPriority: string | null;
  filterScope: string | null;
  sortOrder: "asc" | "desc";
}

/**
 * Hook for filtering and sorting workers with optimizations
 */
export function useWorkerFilters({
  workers,
  searchTerm,
  filterActive,
  filterExecutionMode,
  filterPriority,
  filterScope,
  sortOrder,
}: UseWorkerFiltersOptions): Worker[] {
  return useMemo(() => {
    // Pre-compute lowercase search term once
    const searchLower = searchTerm.toLowerCase();

    return workers
      .filter((protocol) => {
        // Safety check - ensure protocol has required structure
        if (!protocol?.value?.raw) {
          return false;
        }

        const raw = protocol.value.raw;

        // Search filter - early return if no search term
        if (searchTerm) {
          const matchesSearch =
            raw.note?.toLowerCase().includes(searchLower) ||
            raw.sid?.toLowerCase().includes(searchLower) ||
            raw.nid?.toLowerCase().includes(searchLower) ||
            raw.version?.toLowerCase().includes(searchLower);

          if (!matchesSearch) {
            return false;
          }
        }

        // Active status filter - early return
        if (filterActive !== null && raw.active !== filterActive) {
          return false;
        }

        // Execution mode filter - early return
        if (filterExecutionMode) {
          const workerExecMode = raw.executionMode || "parallel";
          if (workerExecMode !== filterExecutionMode) {
            return false;
          }
        }

        // Priority filter - early return
        if (filterPriority) {
          const workerPriority = raw.priority || "normal";
          if (workerPriority !== filterPriority) {
            return false;
          }
        }

        // Scope filter - early return
        if (filterScope) {
          const workerScope = raw.scope || "local";
          if (workerScope !== filterScope) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Additional safety checks for sorting
        if (!a?.value?.raw || !b?.value?.raw) {
          return 0; // Keep order if invalid
        }

        const rawA = a.value.raw;
        const rawB = b.value.raw;

        if (sortOrder === "desc") {
          // 1. Sort by scope (local first)
          const scopeA = rawA.scope || "local";
          const scopeB = rawB.scope || "local";
          if (scopeA !== scopeB) {
            return scopeA === "local" ? -1 : 1;
          }

          // 2. Sort by active status (active first)
          const activeA = rawA.active ? 1 : 0;
          const activeB = rawB.active ? 1 : 0;
          if (activeA !== activeB) {
            return activeB - activeA;
          }

          // 3. Sort by timestamp (newest first)
          return (rawB.timestamp || 0) - (rawA.timestamp || 0);
        }

        // Ascending: oldest first
        return (rawA.timestamp || 0) - (rawB.timestamp || 0);
      });
  }, [
    workers,
    searchTerm,
    filterActive,
    filterExecutionMode,
    filterPriority,
    filterScope,
    sortOrder,
  ]);
}

