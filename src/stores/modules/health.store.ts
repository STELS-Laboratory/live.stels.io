/**
 * Health Store
 * Manages system health status via RPC calls
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// ============================================
// Types
// ============================================

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthComponentStatus {
  database?: HealthStatus;
  domains?: Record<string, HealthStatus>;
  taskManager?: HealthStatus;
  orchestrator?: HealthStatus;
}

export interface HealthMetrics {
  activeAgents?: number;
  activeTasks?: number;
  activeChains?: number;
}

export interface HealthResponse {
  success?: boolean;
  status?: HealthStatus;
  timestamp?: number;
  components?: HealthComponentStatus;
  metrics?: HealthMetrics;
  error?: string;
}

export interface HealthStore {
  // State
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  lastCheck: number | null;

  // Actions
  getHealth: () => Promise<HealthResponse | null>;
  clearHealth: () => void;
}

// ============================================
// Helper
// ============================================

function getApiClient(): WebfixApiClient | null {
  const connectionSession = useAuthStore.getState().connectionSession;
  if (!connectionSession) return null;

  const client = new WebfixApiClient(connectionSession.api);
  client.setSession(connectionSession.session);
  return client;
}

// ============================================
// Store
// ============================================

export const useHealthStore = create<HealthStore>()(
  devtools(
    (set) => ({
      // Initial state
      health: null,
      loading: false,
      error: null,
      lastCheck: null,

      // Get health status
      getHealth: async (): Promise<HealthResponse | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ loading: true, error: null });

        try {
          const response = await client.request<HealthResponse>(
            "getHealth",
            {}
          );

          console.log("[HealthStore] getHealth response:", response);

          const health = {
            ...response,
            timestamp: response.timestamp || Date.now(),
          };

          set({
            health,
            loading: false,
            lastCheck: Date.now(),
          });

          // Show toast based on status
          if (response.status === "healthy") {
            toast.success("System healthy", "All components are operational");
          } else if (response.status === "degraded") {
            toast.error("System degraded", "Some components may be experiencing issues");
          } else if (response.status === "unhealthy") {
            toast.error("System unhealthy", "Critical components are down");
          }

          return health;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get health status";
          console.error("[HealthStore] getHealth error:", error);
          set({ error: message, loading: false });
          toast.error("Failed to check health", message);
          return null;
        }
      },

      // Clear health state
      clearHealth: () => {
        set({ health: null, error: null, lastCheck: null });
      },
    }),
    { name: "health-store" }
  )
);

// ============================================
// Selector Hooks
// ============================================

export const useHealth = () => useHealthStore((state) => state.health);
export const useHealthLoading = () => useHealthStore((state) => state.loading);
export const useHealthError = () => useHealthStore((state) => state.error);
export const useLastHealthCheck = () => useHealthStore((state) => state.lastCheck);
