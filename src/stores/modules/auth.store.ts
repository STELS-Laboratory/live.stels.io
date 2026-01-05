import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { clearAllStorage, clearAppStorage } from "@/lib/storage-cleaner";
import { useWebSocketStore } from "@/hooks/use_web_socket_store";
import { NETWORK_CONFIGS, useNetworkStore } from "./network.store";
import { WebfixApiClient } from "@/lib/webfix-api-client";
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
  return `gliese_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

              console.log("apiUrl", apiUrl);
              console.log("selectedNetwork.socket", selectedNetwork.socket);

              const session: ConnectionSession = {
                session: raw.session, // This is the Session ID used in stels-session header
                token: raw.token,
                network: raw.info?.network || selectedNetwork.id,
                title: raw.info?.title || "heterogen",
                nid: raw.info?.nid || generateNodeId(),
                api: apiUrl,
                socket: socketUrl,
                developer: raw.info?.developer || false,
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
            return true;
          }

          // If we have connectionSession but states are inconsistent, fix them
          if (connectionSession && (!isConnected || !isAuthenticated)) {
            set({
              isConnected: true,
              isAuthenticated: true,
              connectionError: null,
            });
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
              developer: sessionData.raw.info.developer,
            };

            // Restore the connection state without reconnecting
            set({
              isConnected: true,
              isConnecting: false,
              connectionSession: session,
              isAuthenticated: true,
              connectionError: null,
            });

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
