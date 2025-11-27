/**
 * Hook for loading default schemas from public/schemas/
 * Automatically loads on first app launch
 */

import { useEffect, useState } from "react";
import { loadDefaultSchemas } from "@/apps/schemas/default-schemas-loader.ts";

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
 */
export function useDefaultSchemas(): LoadState {
  const [state, setState] = useState<LoadState>({
    isLoading: true,
    isLoaded: false,
    loaded: 0,
    skipped: 0,
    failed: 0,
  });

  useEffect(() => {

    let mounted = true;

    const load = async (): Promise<void> => {
      try {

        const result = await loadDefaultSchemas();

        if (mounted) {
          setState({
            isLoading: false,
            isLoaded: true,
            loaded: result.loaded,
            skipped: result.skipped,
            failed: result.failed,
          });
        }
      } catch {

        if (mounted) {
          setState({
            isLoading: false,
            isLoaded: false,
            loaded: 0,
            skipped: 0,
            failed: 1,
          });
        }
      }
    };

    load();

    return () => {

      mounted = false;
    };
  }, []); // Run only once on mount

  return state;
}
