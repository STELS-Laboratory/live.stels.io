import React, { useEffect } from "react";
import { useAppStore } from "@/stores";

/**
 * Component to automatically clear sync errors after a timeout
 * Prevents persistent error notifications for temporary WebSocket issues
 */
export const SyncErrorClear: React.FC = (): null => {
  const { syncError, setSyncError } = useAppStore();

  useEffect(() => {
    if (syncError) {
      // Auto-clear sync errors after 10 seconds
      const timeout = setTimeout(() => {
        setSyncError(null);
      }, 10000);

      return (): void => {
        clearTimeout(timeout);
      };
    }
  }, [syncError, setSyncError]);

  // This component doesn't render anything, it's just for side effects
  return null;
};
