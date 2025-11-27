/**
 * Hook for syncing indexes data from sessionStorage
 */

import { useEffect, useRef } from "react";
import { useIndexStore } from "../store";

/**
 * Hook to sync indexes data from sessionStorage
 * Automatically reloads indexes every second
 */
export function useIndexesSync(): void {
  const loadIndexesRef = useRef(useIndexStore.getState().loadIndexes);

  // Update ref when store changes
  useEffect(() => {
    loadIndexesRef.current = useIndexStore.getState().loadIndexes;
  });

  useEffect(() => {
    // Initial load
    loadIndexesRef.current();

    // Set up polling interval (1 second)
    const interval = setInterval(() => {
      loadIndexesRef.current();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []); // Empty deps - use ref to avoid infinite loop
}
