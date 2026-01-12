import { useEffect } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";

/**
 * Hook for automatic authentication restoration on app load
 */
export const useAuthRestore = (): void => {
  const {
    selectedNetwork,
    isConnected,
    isAuthenticated,
    connectionSession,
    _hasHydrated,
    restoreConnection,
  } = useAuthStore();

  useEffect(() => {
    // Wait for store to be hydrated before attempting restoration
    if (!_hasHydrated) {
      return;
    }

    // Don't attempt restoration if explicitly logged out (no network)
    // This prevents restoration attempts after logout
    if (!selectedNetwork) {
      return;
    }

    // Check if we already have a valid connection
    if (
      selectedNetwork && isConnected && isAuthenticated && connectionSession
    ) {
      return;
    }

    // Case 1: We have network but missing connection/authentication
    if (
      selectedNetwork &&
      (!isConnected || !isAuthenticated || !connectionSession)
    ) {
      // Small delay to ensure all state is stable
      const timer = setTimeout(() => {
        restoreConnection().then((success) => {
          if (import.meta.env.DEV) {
            console.debug(`[AuthRestore] Connection restore ${success ? 'succeeded' : 'failed'}`);
          }
        }).catch((error) => {
          if (import.meta.env.DEV) {
            console.warn('[AuthRestore] Error during restore:', error);
          }
        });
      }, 50);

      return () => clearTimeout(timer);
    }

    // Case 2: No network in store but data exists in localStorage
    if (!selectedNetwork) {
      const authStoreData = localStorage.getItem("auth-store");
      const privateStoreData = localStorage.getItem("private-store");
      const hasValidSession = privateStoreData &&
        JSON.parse(privateStoreData)?.raw?.session;

      // If we have a valid session but incomplete store data, try to restore
      if (hasValidSession && authStoreData) {
        const timer = setTimeout(() => {
          restoreConnection().then((success) => {
            if (import.meta.env.DEV) {
              console.debug(`[AuthRestore] Session restore ${success ? 'succeeded' : 'failed'}`);
            }
          }).catch((error) => {
            if (import.meta.env.DEV) {
              console.warn('[AuthRestore] Error during session restore:', error);
            }
          });
        }, 50);

        return () => clearTimeout(timer);
      }
    }
  }, [
    selectedNetwork,
    isConnected,
    isAuthenticated,
    connectionSession,
    _hasHydrated,
    restoreConnection,
  ]);
};
