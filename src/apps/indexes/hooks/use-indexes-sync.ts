/**
 * Hook for syncing indexes data from sessionStorage
 */

import { useEffect, useRef } from "react";
import { useIndexStore } from "../store";

/**
 * Hook to sync indexes data from sessionStorage
 * Automatically reloads indexes with debouncing to prevent excessive updates
 */
export function useIndexesSync(): void {
  const loadIndexesRef = useRef(useIndexStore.getState().loadIndexes);
  const lastLoadRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when store changes
  useEffect(() => {
    loadIndexesRef.current = useIndexStore.getState().loadIndexes;
  });

  useEffect(() => {
    // Initial load
    loadIndexesRef.current();
    lastLoadRef.current = Date.now();

    // Set up polling interval (increased to 3 seconds to reduce load)
    // Use debouncing to prevent excessive calls
    const POLLING_INTERVAL = 3000; // 3 seconds instead of 1
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // Only load if at least 3 seconds have passed since last load
      if (now - lastLoadRef.current >= POLLING_INTERVAL) {
        loadIndexesRef.current();
        lastLoadRef.current = now;
      }
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty deps - use ref to avoid infinite loop
}
