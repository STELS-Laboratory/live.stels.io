/**
 * Hook to restore open apps on mount
 * Loads persisted open apps from localStorage and validates them
 *
 * NOTE: This hook is disabled as schemas app has been removed
 */

/**
 * Restore open apps from localStorage on mount
 * Validates that schemas still exist before restoring
 *
 * NOTE: Returns empty state as schemas app has been removed
 */
export function useRestoreOpenApps(): {
  isRestoring: boolean;
  restoredCount: number;
} {
  return {
    isRestoring: false,
    restoredCount: 0,
  };
}
