import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { clearAllStorage, clearAppStorage } from "@/lib/storage-cleaner";
import { useWebSocketStore } from "@/hooks/use-web-socket-store";
import { NETWORK_CONFIGS, useNetworkStore } from "./network.store";
import { WebfixApiClient } from "@/lib/webfix-api-client";
import {
  SESSION_MAX_LIFETIME_MS,
  SESSION_EXPIRY_WARNING_MS,
} from "@/lib/api-types";
import type {
  AuthActions,
  AuthState,
  AuthStore,
  ConnectionSession,
  NetworkConfig,
} from "@/types/auth/types";

export type {
  AuthActions,
  AuthState,
  AuthStore,
  ConnectionSession,
  NetworkConfig,
};

/**
 * Generate unique node ID
 */
function generateNodeId(): string {
  return `gliese_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if session has exceeded maximum lifetime (7 days)
 */
function isSessionExpired(createdAt: number | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt > SESSION_MAX_LIFETIME_MS;
}

/**
 * Check if session is approaching expiry (older than 6 days)
 */
function isSessionNearExpiry(createdAt: number | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt > SESSION_EXPIRY_WARNING_MS;
}

/**
 * Authentication store
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedNetwork: null,
        availableNetworks: Object.values(NETWORK_CONFIGS),
        isConnected: false,
        isConnecting: false,
        connectionSession: null,
        connectionError: null,
        isAuthenticated: false,
        showNetworkSelector: false,
        showSecurityWarning: false,
        showSessionExpiredModal: false,
        _hasHydrated: false,

        // Network operations
        setAvailableNetworks: (networks: NetworkConfig[]) => {
          set({ availableNetworks: networks });
        },

        selectNetwork: (network: NetworkConfig) => {
          // Update network store
          const networkStore = useNetworkStore.getState();
          networkStore.setNetwork(network.id);

          set({
            selectedNetwork: network,
            showNetworkSelector: false,
            connectionError: null,
          });
        },

        // Connection operations
        connectWithGitHub: async (code: string): Promise<boolean> => {
          const { selectedNetwork } = get();

          if (!selectedNetwork) {
            set({ connectionError: "Network not selected" });
            return false;
          }

          set({ isConnecting: true, connectionError: null });

          try {
            const client = new WebfixApiClient(selectedNetwork.api);

            // Call githubAuth method (no session needed for this request)
            // Response format: { channel, module, widget, raw: { session, token, info }, timestamp }
            const result = await client.request<{
              channel?: string;
              module?: string;
              widget?: string;
              raw?: {
                session?: string;
                token?: string;
                info?: {
                  network?: string;
                  title?: string;
                  nid?: string;
                  api?: string;
                  connector?: { socket?: string };
                  developer?: boolean;
                  githubUsername?: string;
                };
              };
              session?: string;
              token?: string;
              info?: {
                network?: string;
                title?: string;
                nid?: string;
                api?: string;
                connector?: { socket?: string };
                developer?: boolean;
              };
              timestamp?: number;
            }>(
              "githubAuth",
              {
                payload: {
                  body: {
                    code,
                  },
                },
              },
              ["network-id"],
            );

            // Extract session data - response can be in format:
            // 1. { channel, module, widget, raw: { session, token, info }, timestamp }
            // 2. { raw: { session, token, info } }
            // 3. { session, token, info } (direct format)
            const raw = result.raw || result;

            // Session ID is the most important - it's used in stels-session header
            if (raw.session && raw.token) {
              const apiUrl = selectedNetwork.api;
              const socketUrl = selectedNetwork.socket;

              const session: ConnectionSession = {
                session: raw.session, // This is the Session ID used in stels-session header
                token: raw.token,
                network: raw.info?.network || selectedNetwork.id,
                title: raw.info?.title || "heterogen",
                nid: raw.info?.nid || generateNodeId(),
                api: apiUrl,
                socket: socketUrl,
                developer: raw.info?.developer || false,
                createdAt: Date.now(), // Track session creation for max lifetime validation
              };

              set({
                isConnected: true,
                isConnecting: false,
                connectionSession: session,
                isAuthenticated: true,
                connectionError: null,
              });

              // Store session in localStorage for WebSocket and persistence
              // Store full response structure for compatibility
              // Note: accessToken is NOT stored for security (v2.0.0)
              localStorage.setItem(
                "private-store",
                JSON.stringify({
                  channel: result.channel || `session.store.${session.session}`,
                  module: result.module || "session",
                  widget: result.widget || "session",
                  raw: {
                    session: session.session,
                    token: session.token,
                    info: {
                      network: session.network,
                      title: session.title,
                      nid: session.nid,
                      api: session.api,
                      connector: {
                        socket: session.socket,
                      },
                      developer: session.developer,
                    },
                    createdAt: session.createdAt, // Track session creation for max lifetime validation
                  },
                  timestamp: result.timestamp || Date.now(),
                }),
              );

              // Set session in client for subsequent requests
              // Session ID will be used in stels-session header
              client.setSession(session.session);

              return true;
            } else {
              throw new Error(
                "Invalid session response: missing session or token",
              );
            }
          } catch (error) {
            set({
              isConnecting: false,
              connectionError: error instanceof Error
                ? error.message
                : "GitHub authentication failed",
            });
            return false;
          }
        },

        disconnectFromNode: async () => {
          // 1. Reset connection state

          set({
            isConnected: false,
            connectionSession: null,
            isAuthenticated: false,
            connectionError: null,
            isConnecting: false,
          });

          // 2. Clear ALL storage
          try {
            await clearAllStorage();
          } catch {
            // Fallback to basic clearing
            try {
              clearAppStorage();
            } catch {
              // Fallback error handled
            }
          }
        },

        restoreConnection: async (): Promise<boolean> => {
          const {
            selectedNetwork,
            connectionSession,
            isConnected,
            isAuthenticated,
          } = get();

          // If we already have a connection session and states are consistent, we're already connected
          if (connectionSession && isConnected && isAuthenticated) {
            // Check if existing session has exceeded max lifetime (7 days)
            if (isSessionExpired(connectionSession.createdAt)) {
              console.warn("[Auth] Session expired (max 7 days). Logging out.");
              await get().resetAuth();
              return false;
            }
            // Check if session is approaching expiry
            if (isSessionNearExpiry(connectionSession.createdAt)) {
              set({ showSessionExpiredModal: true });
            }
            return true;
          }

          // If we have connectionSession but states are inconsistent, fix them
          if (connectionSession && (!isConnected || !isAuthenticated)) {
            // Check session lifetime before restoring
            if (isSessionExpired(connectionSession.createdAt)) {
              console.warn("[Auth] Session expired (max 7 days). Logging out.");
              await get().resetAuth();
              return false;
            }
            set({
              isConnected: true,
              isAuthenticated: true,
              connectionError: null,
            });
            if (isSessionNearExpiry(connectionSession.createdAt)) {
              set({ showSessionExpiredModal: true });
            }
            try {
              const { useAccountsStore } = await import(
                "@/stores/modules/accounts.store"
              );
              let address: string | undefined;
              const pr = localStorage.getItem("private-store");
              if (pr) {
                try {
                  const d = JSON.parse(pr) as { raw?: { info?: { address?: string }; address?: string } };
                  address = d?.raw?.info?.address ?? d?.raw?.address;
                } catch {
                  // ignore
                }
              }
              useAccountsStore
                .getState()
                .fetchAccountsFromServer(
                  connectionSession.session,
                  connectionSession.api,
                  address ? { address, params: ["gliesereum"] } : {},
                )
                .catch(() => {});
            } catch {
              // ignore
            }
            return true;
          }

          // Check if we have saved session data
          const savedSession = localStorage.getItem("private-store");
          if (!savedSession || !selectedNetwork) {
            return false;
          }

          try {
            const sessionData = JSON.parse(savedSession);
            if (!sessionData?.raw?.session) {
              return false;
            }

            // Check if saved session has exceeded max lifetime (7 days)
            const createdAt = sessionData.raw.createdAt;
            if (isSessionExpired(createdAt)) {
              console.warn("[Auth] Saved session expired (max 7 days). Clearing.");
              localStorage.removeItem("private-store");
              return false;
            }

            const apiUrl = sessionData.raw.info.api;
            const socketUrl = sessionData.raw.info.connector.socket;

            const session: ConnectionSession = {
              session: sessionData.raw.session,
              token: sessionData.raw.token,
              network: sessionData.raw.info.network,
              title: sessionData.raw.info.title,
              nid: sessionData.raw.info.nid,
              api: apiUrl,
              socket: socketUrl,
              developer: sessionData.raw.info.developer ?? false,
              createdAt: createdAt || Date.now(), // Fallback for old sessions
            };

            // Restore the connection state without reconnecting
            set({
              isConnected: true,
              isConnecting: false,
              connectionSession: session,
              isAuthenticated: true,
              connectionError: null,
            });

            if (isSessionNearExpiry(session.createdAt)) {
              set({ showSessionExpiredModal: true });
            }

            try {
              const { useAccountsStore } = await import(
                "@/stores/modules/accounts.store"
              );
              const address = sessionData.raw?.info?.address ?? sessionData.raw?.address;
              useAccountsStore
                .getState()
                .fetchAccountsFromServer(
                  session.session,
                  apiUrl,
                  address ? { address, params: ["gliesereum"] } : {},
                )
                .catch(() => {});
            } catch {
              // ignore
            }

            return true;
          } catch {
            set({
              connectionError: "Failed to restore connection",
              isConnecting: false,
            });
            // Clear invalid session data
            localStorage.removeItem("private-store");
            return false;
          }
        },

        // UI operations
        setShowNetworkSelector: (show: boolean) => {
          set({ showNetworkSelector: show });
        },

        setShowSecurityWarning: (show: boolean) => {
          set({ showSecurityWarning: show });
        },

        setShowSessionExpiredModal: (show: boolean) => {
          set({ showSessionExpiredModal: show });
        },

        clearConnectionError: () => {
          set({ connectionError: null });
        },

        // Utility operations
        resetAuth: async () => {
          // 1. Close WebSocket connection and clear its state
          try {
            const wsStore = useWebSocketStore.getState();
            wsStore.resetWebSocketState();
          } catch {
            // Error handled silently
          }

          // 2. Reset auth state FIRST (before clearing storage)

          set({
            selectedNetwork: null,
            isConnected: false,
            isConnecting: false,
            connectionSession: null,
            connectionError: null,
            isAuthenticated: false,
            showNetworkSelector: false,
          });

          // 3. Clear ALL storage (localStorage, sessionStorage, IndexedDB, Caches, Service Workers)
          try {
            await clearAllStorage();
          } catch {
            // Fallback to basic clearing
            try {
              clearAppStorage();
            } catch {
              // Fallback error handled
            }
          }

          // 4. Navigate to welcome page after logout
          try {
            const { navigateTo } = await import("@/lib/router");
            navigateTo("welcome");
          } catch {
            // Navigation error handled silently
          }
        },
      }),
      {
        name: "auth-store",
        partialize: (state) => ({
          selectedNetwork: state.selectedNetwork,
          availableNetworks: state.availableNetworks,
          connectionSession: state.connectionSession,
          isConnected: state.isConnected,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state._hasHydrated = true;
          }
        },
      },
    ),
    {
      name: "auth_store_03_111",
    },
  ),
);
