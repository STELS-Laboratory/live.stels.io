/**
 * Store Selectors
 * Memoized selectors for optimized store subscriptions
 */

import type { AppState } from "@/stores/modules/app.store";
import type { AuthStore } from "@/types/auth/types";

/**
 * App Store Selectors
 */
export const selectCurrentRoute = (state: AppState): string => state.currentRoute;
export const selectAllowedRoutes = (state: AppState): string[] => state.allowedRoutes;
export const selectRouteLoading = (state: AppState): boolean => state.routeLoading;
export const selectUpgrade = (state: AppState): boolean => state.upgrade;
export const selectVersion = (state: AppState): string => state.version;

// Network status selectors
export const selectOnline = (state: AppState): boolean => state.online;
export const selectEffectiveType = (state: AppState): string | null => state.effectiveType;
export const selectDownlink = (state: AppState): number | null => state.downlink;

// Sync state selectors
export const selectHasUpdates = (state: AppState): boolean => state.hasUpdates;
export const selectIsSyncing = (state: AppState): boolean => state.isSyncing;
export const selectSyncError = (state: AppState): string | null => state.syncError;

/**
 * Auth Store Selectors
 */
export const selectIsAuthenticated = (state: AuthStore): boolean => state.isAuthenticated;
export const selectIsConnected = (state: AuthStore): boolean => state.isConnected;
export const selectIsConnecting = (state: AuthStore): boolean => state.isConnecting;
export const selectSelectedNetwork = (state: AuthStore) => state.selectedNetwork;
export const selectConnectionSession = (state: AuthStore) => state.connectionSession;
export const selectConnectionError = (state: AuthStore): string | null => state.connectionError;
export const selectHasHydrated = (state: AuthStore): boolean => state._hasHydrated;
export const selectShowNetworkSelector = (state: AuthStore): boolean => state.showNetworkSelector;
export const selectShowSecurityWarning = (state: AuthStore): boolean => state.showSecurityWarning;
export const selectShowSessionExpiredModal = (state: AuthStore): boolean => state.showSessionExpiredModal;

/**
 * Composed selectors for common use cases
 */
export const selectAuthStatus = (state: AuthStore) => ({
  isAuthenticated: state.isAuthenticated,
  isConnected: state.isConnected,
  isConnecting: state.isConnecting,
});

export const selectNetworkStatus = (state: AppState) => ({
  online: state.online,
  effectiveType: state.effectiveType,
  downlink: state.downlink,
  rtt: state.rtt,
});

export const selectSyncStatus = (state: AppState) => ({
  hasUpdates: state.hasUpdates,
  isSyncing: state.isSyncing,
  syncError: state.syncError,
  lastSyncTimestamp: state.lastSyncTimestamp,
});

/**
 * Selector hooks usage example:
 * 
 * // Instead of:
 * const { currentRoute, allowedRoutes, routeLoading } = useAppStore();
 * 
 * // Use:
 * const currentRoute = useAppStore(selectCurrentRoute);
 * const routeLoading = useAppStore(selectRouteLoading);
 * 
 * // Or for composed state:
 * const authStatus = useAuthStore(selectAuthStatus);
 * 
 * This prevents re-renders when unrelated state changes.
 */
