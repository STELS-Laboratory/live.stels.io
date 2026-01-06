/**
 * Hook for loading default schemas from public/schemas/
 * Automatically loads on first app launch
 *
 * NOTE: This hook is disabled as schemas app has been removed
 */

interface LoadState {
  isLoading: boolean;
  isLoaded: boolean;
  loaded: number;
  skipped: number;
  failed: number;
}

/**
 * Load default schemas from public/schemas/ on first mount
 * Only loads once per session
 *
 * NOTE: Returns empty state as schemas app has been removed
 */
export function useDefaultSchemas(): LoadState {
  return {
    isLoading: false,
    isLoaded: false,
    loaded: 0,
    skipped: 0,
    failed: 0,
  };
}
