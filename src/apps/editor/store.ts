/**
 * Editor application store
 * Manages AMI Workers/Protocols state and MCP Tools state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useNetworkStore } from "@/stores/modules/network.store";
import { toast } from "@/stores";
import { retryOnNetworkError } from "./utils/retry.ts";
import { WebfixApiClient } from "@/lib/webfix-api-client";
import { logError } from "./utils/logger.ts";
import type {
  EditorStore,
  LeaderInfo,
  Worker,
  WorkerCreateRequest,
  WorkerStats,
  CheckLeaderHealthResponse,
} from "@/types/apps/editor/types";
import type {
  ToolRaw,
  ToolListPayload,
  SetToolRequest,
  ListToolsRequest,
  CallToolRequest,
  ToolExecutionResult,
} from "./types/tools.types";

export type {
  EditorStore,
  LeaderInfo,
  Worker,
  WorkerCreateRequest,
  WorkerStats,
  CheckLeaderHealthResponse,
};

/** Tools slice state */
export interface ToolsStoreState {
  tools: ToolRaw[];
  toolsLoading: boolean;
  toolsError: string | null;
}

/** Tools slice actions */
export interface ToolsStoreActions {
  listTools: (params?: ListToolsRequest) => Promise<void>;
  getTool: (toolId: string, includeScript?: boolean) => Promise<ToolRaw | null>;
  setTool: (request: SetToolRequest) => Promise<ToolRaw | null>;
  deleteTool: (toolId: string, force?: boolean) => Promise<boolean>;
  callTool: (request: CallToolRequest) => Promise<ToolExecutionResult | null>;
  clearToolsError: () => void;
}

export type ToolsStore = ToolsStoreState & ToolsStoreActions;

/**
 * Helper function to convert API response to Worker format
 */
function convertToWorker(data: {
  value?: {
    channel: string;
    raw: { sid?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  key?: string[];
  channel?: string;
  sid?: string;
  raw?: { sid?: string; [key: string]: unknown };
}): Worker {
  if (data.value) {
    return {
      key: ["ami", "worker", data.value.raw?.sid || ""],
      value: data.value as Worker["value"],
    };
  }
  if (data.key && "value" in data && data.value) {
    return data as Worker;
  }
  return {
    key: ["ami", "worker", data.sid || data.raw?.sid || ""],
    value: {
      channel: data.channel || `ami.worker.${data.sid || data.raw?.sid || ""}`,
      raw: (data.raw || data) as Worker["value"]["raw"],
    },
  };
}

/**
 * Editor Store (Workers + MCP Tools)
 */
export const useEditorStore = create<EditorStore & ToolsStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      workers: [],
      workersLoading: false,
      workersError: null,
      worker: {
        isLoading: false,
        isEditor: false,
      },

      // Tools state
      tools: [],
      toolsLoading: false,
      toolsError: null,

      // Actions
      listWorkers: async (): Promise<void> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          set({
            workersError: "No active connection",
            workersLoading: false,
          });
          return;
        }

        set({ workersLoading: true, workersError: null });

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const data = await retryOnNetworkError(() =>
            client.request<
              Worker[] | { raw?: { workers?: Worker[] }; timestamp?: number }
            >("listWorkers", {}, [networkId])
          );

          // WebFIX v2.12: payload in data.raw.workers; legacy: array directly
          const workers: Worker[] = Array.isArray(data)
            ? data
            : (data && typeof data === "object" && "raw" in data
                ? (data as { raw?: { workers?: Worker[] } }).raw?.workers ?? []
                : []);

          set({
            workers,
            workersLoading: false,
            workersError: null,
          });
        } catch (error) {
          logError("Failed to list workers:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch workers";
          set({
            workersError: errorMessage,
            workersLoading: false,
          });
          toast.error("Failed to load workers", errorMessage);
        }
      },

      createWorker: async (
        request: WorkerCreateRequest,
      ): Promise<Worker | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return null;
        }

        set({
          worker: {
            isLoading: true,
            isEditor: false,
          },
        });

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const data = await retryOnNetworkError(() =>
            client.request<{
              value?: {
                channel: string;
                raw: { sid?: string; [key: string]: unknown };
                [key: string]: unknown;
              };
              key?: string[];
              channel?: string;
              sid?: string;
              raw?: { sid?: string; [key: string]: unknown };
            } | { raw?: unknown; timestamp?: number }>("setWorker", request, [networkId])
          );

          // WebFIX v2.12: payload may be in data.raw (OpenAPI setWorker response)
          const payload = data && typeof data === "object" && "raw" in data ? (data as { raw?: unknown }).raw : data;
          const workerData = convertToWorker(payload ?? data);

          // Add to workers list
          set((state) => ({
            workers: [workerData, ...state.workers],
            worker: {
              isLoading: false,
              isEditor: true,
            },
          }));

          return workerData;
        } catch (error) {
          logError("Failed to create worker:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
          toast.error("Failed to create worker", errorMessage);
          set({
            worker: {
              isLoading: false,
              isEditor: false,
            },
          });
          return null;
        }
      },

      setWorker: async (): Promise<Worker | null> => {
        // Legacy method - use createWorker instead
        return await get().createWorker({
          scriptContent: "",
          dependencies: ["gliesereum"],
          version: "1.19.2",
          scope: "local",
          executionMode: "leader",
          priority: "normal",
          note: "New worker",
        });
      },

      updateWorker: async (workerData: Worker): Promise<Worker | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return null;
        }

        set({
          worker: {
            isLoading: true,
            isEditor: true,
          },
        });

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          // OpenAPI UpdateWorkerParams.raw allows only: script, scope, executionMode, priority, active
          const r = workerData.value.raw;
          const body = {
            channel: workerData.value.channel,
            raw: r,
          };

          const data = await retryOnNetworkError(() =>
            client.request<{
              value?: {
                channel: string;
                raw: { sid?: string; [key: string]: unknown };
                [key: string]: unknown;
              };
              key?: string[];
              channel?: string;
              sid?: string;
              raw?: { sid?: string; [key: string]: unknown };
            } | { raw?: unknown; timestamp?: number }>("updateWorker", body, [networkId])
          );

          // WebFIX v2.12: payload may be in data.raw (OpenAPI updateWorker response)
          const payload = data && typeof data === "object" && "raw" in data ? (data as { raw?: unknown }).raw : data;
          const result = convertToWorker(payload ?? data);

          // Update workers list
          set((state) => ({
            workers: state.workers.map((w) =>
              w.value.raw.sid === workerData.value.raw.sid ? result : w
            ),
            worker: {
              isLoading: false,
              isEditor: true,
            },
          }));

          return result;
        } catch (error) {
          logError("Failed to update worker:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
          toast.error("Failed to update worker", errorMessage);
          set({
            worker: {
              isLoading: false,
              isEditor: true,
            },
          });
          return null;
        }
      },

      migrateWorkerWithNewSid: async (
        worker: Worker,
      ): Promise<Worker | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return null;
        }

        set({
          worker: {
            isLoading: true,
            isEditor: false,
          },
        });

        try {
          // Create new worker with network scope and all the same settings
          const createRequest: WorkerCreateRequest = {
            scriptContent: worker.value.raw.script,
            dependencies: worker.value.raw.dependencies,
            version: worker.value.raw.version,
            scope: "network", // Always migrate to network
            executionMode: worker.value.raw.executionMode || "parallel",
            priority: worker.value.raw.priority || "normal",
            mode: worker.value.raw.mode || "loop",
            accountId: worker.value.raw.accountId,
            assignedNode: worker.value.raw.assignedNode,
            note: `[Migrated] ${worker.value.raw.note}`,
            sandbox: worker.value.raw.sandbox, // Preserve sandbox setting
          };

          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const data = await retryOnNetworkError(() =>
            client.request<{
              value?: {
                channel: string;
                raw: { sid?: string; [key: string]: unknown };
                [key: string]: unknown;
              };
              key?: string[];
              channel?: string;
              sid?: string;
              raw?: { sid?: string; [key: string]: unknown };
            } | { raw?: unknown; timestamp?: number }>("setWorker", createRequest, [networkId])
          );

          // WebFIX v2.12: payload may be in data.raw (OpenAPI setWorker response)
          const payload = data && typeof data === "object" && "raw" in data ? (data as { raw?: unknown }).raw : data;
          const result = convertToWorker(payload ?? data);

          // Add to workers list
          set((state) => ({
            workers: [result, ...state.workers],
            worker: {
              isLoading: false,
              isEditor: true,
            },
          }));

          return result;
        } catch (error) {
          logError("Failed to migrate worker:", error);
          toast.error(
            "Failed to migrate worker",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          set({
            worker: {
              isLoading: false,
              isEditor: false,
            },
          });
          return null;
        }
      },

      getLeaderInfo: async (workerId: string): Promise<LeaderInfo | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return null;
        }

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const result = await retryOnNetworkError(() =>
            client.request<
              LeaderInfo | { raw?: LeaderInfo; timestamp?: number }
            >("getLeaderInfo", { workerId }, [networkId])
          );

          // WebFIX v2.12: payload in result.raw (OpenAPI GetLeaderInfoResponse)
          const payload =
            result && typeof result === "object" && "raw" in result
              ? (result as { raw?: LeaderInfo }).raw
              : (result as LeaderInfo);
          return payload ?? null;
        } catch (error) {
          logError("Failed to get leader info:", error);
          toast.error(
            "Failed to load leader info",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return null;
        }
      },

      checkLeaderHealth: async (workerId: string): Promise<CheckLeaderHealthResponse | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return null;
        }

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const result = await retryOnNetworkError(() =>
            client.request<
              CheckLeaderHealthResponse | { raw?: CheckLeaderHealthResponse; timestamp?: number }
            >("checkLeaderHealth", { workerId }, [networkId])
          );

          // WebFIX v2.12: payload in result.raw (OpenAPI CheckLeaderHealthResponse)
          const payload =
            result && typeof result === "object" && "raw" in result
              ? (result as { raw?: CheckLeaderHealthResponse }).raw
              : (result as CheckLeaderHealthResponse);

          if (payload?.success && payload.healthy !== undefined) {
            const status = payload.healthy ? "healthy" : "unhealthy";
            toast.success(
              "Leader health check",
              `Worker ${workerId} leader is ${status}`
            );
          }

          return payload ?? null;
        } catch (error) {
          logError("Failed to check leader health:", error);
          toast.error(
            "Failed to check leader health",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return null;
        }
      },

      getWorkerStats: async (): Promise<WorkerStats[]> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return [];
        }

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const data = await retryOnNetworkError(() =>
            client.request<
              { workers?: WorkerStats[] } | { raw?: { workers?: WorkerStats[] }; timestamp?: number }
            >("getWorkerStats", {}, [networkId])
          );

          // WebFIX v2.12: payload in data.raw (OpenAPI WorkerStats.workers); legacy: top-level workers
          const workersArray =
            data && typeof data === "object" && "raw" in data
              ? (data as { raw?: { workers?: WorkerStats[] } }).raw?.workers
              : (data as { workers?: WorkerStats[] })?.workers;

          if (workersArray && Array.isArray(workersArray)) {
            return workersArray.map((worker: {
              sid: string;
              started?: number;
              executions?: number;
              errors?: number;
              errorRate?: string | number;
              networkErrors?: number;
              criticalErrors?: number;
              lastError?: string;
              lastErrorType?: "network" | "critical";
              lastRun?: number;
              consecutiveErrors?: number;
              isRunning?: boolean;
              scriptHash?: string;
            }) => {
              // Parse errorRate from "0.00%" format to number
              let errorRate = 0;
              if (typeof worker.errorRate === "string") {
                errorRate = parseFloat(worker.errorRate.replace("%", "")) || 0;
              } else if (typeof worker.errorRate === "number") {
                errorRate = worker.errorRate;
              }

              return {
                sid: worker.sid,
                started: worker.started || 0,
                executions: worker.executions || 0,
                errors: worker.errors || 0,
                errorRate: errorRate,
                networkErrors: worker.networkErrors || 0,
                criticalErrors: worker.criticalErrors || 0,
                lastError: worker.lastError,
                lastErrorType: worker.lastErrorType,
                lastRun: worker.lastRun,
                consecutiveErrors: worker.consecutiveErrors || 0,
                isRunning: worker.isRunning || false,
                scriptHash: worker.scriptHash,
                // Backward compatibility
                lastExecution: worker.lastRun || undefined,
              };
            });
          }

          return [];
        } catch (error) {
          logError("Failed to get worker stats:", error);
          toast.error(
            "Failed to load worker statistics",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return [];
        }
      },

      stopAllWorkers: async (): Promise<
        { stopped: number; failed: number; total: number }
      > => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          return { stopped: 0, failed: 0, total: 0 };
        }

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const result = await retryOnNetworkError(() =>
            client.request<
              | { stopped?: number; failed?: number; total?: number }
              | { raw?: { success?: boolean; stoppedCount?: number }; timestamp?: number }
            >("stopAllWorkers", {}, [networkId])
          );

          // WebFIX v2.12: payload in result.raw (OpenAPI StopAllWorkersResponse: success, stoppedCount)
          const raw =
            result && typeof result === "object" && "raw" in result
              ? (result as { raw?: { success?: boolean; stoppedCount?: number } }).raw
              : (result as { stopped?: number; failed?: number; total?: number });
          const stoppedCount =
            raw && "stoppedCount" in raw
              ? (raw as { stoppedCount?: number }).stoppedCount ?? 0
              : (raw as { stopped?: number })?.stopped ?? 0;

          // Refresh workers list
          await get().listWorkers();

          return {
            stopped: stoppedCount,
            failed: (raw as { failed?: number })?.failed ?? 0,
            total: (raw as { total?: number })?.total ?? stoppedCount,
          };
        } catch (error) {
          logError("Failed to stop all workers:", error);
          toast.error(
            "Failed to stop all workers",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return { stopped: 0, failed: 0, total: 0 };
        }
      },

      clearError: () => {
        set({ workersError: null });
      },

      // Tools actions
      listTools: async (params?: ListToolsRequest): Promise<void> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) {
          set({
            toolsError: "No active connection",
            toolsLoading: false,
          });
          return;
        }

        set({ toolsLoading: true, toolsError: null });

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const body = params ?? {};
          const data = await retryOnNetworkError(() =>
            client.request<ToolListPayload>("listTools", body, [networkId])
          );

          const rawTools: ToolRaw[] = Array.isArray(data)
            ? data
            : (data && typeof data === "object" && "raw" in data
                ? (data as { raw?: { tools?: ToolRaw[] } }).raw?.tools ?? []
                : []);

          // Filter out invalid tools (missing sid or name)
          const tools = rawTools.filter(
            (t) => t && typeof t.sid === "string" && t.sid.trim() && typeof t.name === "string" && t.name.trim()
          );

          set({
            tools,
            toolsLoading: false,
            toolsError: null,
          });
        } catch (error) {
          logError("Failed to list tools:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch tools";
          set({
            toolsError: errorMessage,
            toolsLoading: false,
          });
          toast.error("Failed to load tools", errorMessage);
        }
      },

      getTool: async (
        toolId: string,
        includeScript = false,
      ): Promise<ToolRaw | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) return null;
        if (!toolId || typeof toolId !== "string" || !toolId.trim()) {
          logError("getTool: toolId is required");
          return null;
        }

        const body: { toolId: string; includeScript: boolean } = {
          toolId: toolId.trim(),
          includeScript: Boolean(includeScript),
        };

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const result = await retryOnNetworkError(() =>
            client.request<
              ToolRaw | { raw?: ToolRaw | { tool?: ToolRaw }; timestamp?: number } | { tool?: ToolRaw }
            >("getTool", body, [networkId])
          );

          // Handle multiple response formats:
          // 1. { raw: { tool: ToolRaw } } - WebFIX v2.12 wrapped
          // 2. { raw: ToolRaw } - WebFIX v2.12 direct
          // 3. { tool: ToolRaw } - wrapped without raw
          // 4. ToolRaw - direct tool object
          let payload: ToolRaw | null = null;
          
          if (result && typeof result === "object") {
            if ("raw" in result && result.raw && typeof result.raw === "object") {
              const raw = result.raw as { tool?: ToolRaw } | ToolRaw;
              if ("tool" in raw && raw.tool) {
                payload = raw.tool;
              } else if ("sid" in raw) {
                payload = raw as ToolRaw;
              }
            } else if ("tool" in result && (result as { tool?: ToolRaw }).tool) {
              payload = (result as { tool: ToolRaw }).tool;
            } else if ("sid" in result) {
              payload = result as ToolRaw;
            }
          }
          
          return payload;
        } catch (error) {
          logError("Failed to get tool:", error);
          toast.error(
            "Failed to load tool",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return null;
        }
      },

      setTool: async (request: SetToolRequest): Promise<ToolRaw | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) return null;

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const data = await retryOnNetworkError(() =>
            client.request<
              | ToolRaw
              | { raw?: ToolRaw | { tool?: ToolRaw; sid?: string; created?: boolean }; timestamp?: number }
            >("setTool", request, [networkId])
          );

          let tool: ToolRaw | null = null;
          if (data && typeof data === "object") {
            if ("raw" in data) {
              const raw = (data as { raw?: ToolRaw | { tool?: ToolRaw } }).raw;
              if (raw && typeof raw === "object") {
                tool =
                  "tool" in raw && raw.tool && typeof raw.tool === "object"
                    ? (raw.tool as ToolRaw)
                    : (raw as ToolRaw);
              }
            } else {
              tool = data as ToolRaw;
            }
          }

          if (tool) {
            set((state) => ({
              tools: state.tools.some((t) => t.sid === tool.sid)
                ? state.tools.map((t) => (t.sid === tool.sid ? tool : t))
                : [tool, ...state.tools],
            }));
          }
          return tool;
        } catch (error) {
          logError("Failed to save tool:", error);
          toast.error(
            "Failed to save tool",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return null;
        }
      },

      deleteTool: async (toolId: string, force = false): Promise<boolean> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) return false;

        // Validate toolId before making request
        if (!toolId || typeof toolId !== "string" || !toolId.trim()) {
          logError("deleteTool: toolId is required");
          toast.error("Failed to delete tool", "Tool ID is required");
          return false;
        }

        const trimmedToolId = toolId.trim();

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          await retryOnNetworkError(() =>
            client.request<unknown>("deleteTool", { toolId: trimmedToolId, force }, [
              networkId,
            ])
          );

          set((state) => ({
            tools: state.tools.filter((t) => t.sid !== trimmedToolId),
          }));
          return true;
        } catch (error) {
          logError("Failed to delete tool:", error);
          toast.error(
            "Failed to delete tool",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return false;
        }
      },

      callTool: async (
        request: CallToolRequest,
      ): Promise<ToolExecutionResult | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        const networkId = useNetworkStore.getState().currentNetworkId;

        if (!connectionSession) return null;

        try {
          const client = new WebfixApiClient(connectionSession.api);
          client.setSession(connectionSession.session);

          const result = await retryOnNetworkError(() =>
            client.request<
              ToolExecutionResult | {
                raw?: ToolExecutionResult;
                timestamp?: number;
              }
            >("callTool", request, [networkId])
          );

          const payload =
            result && typeof result === "object" && "raw" in result
              ? (result as { raw?: ToolExecutionResult }).raw
              : (result as ToolExecutionResult);
          return payload ?? null;
        } catch (error) {
          logError("Failed to call tool:", error);
          toast.error(
            "Failed to execute tool",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          return null;
        }
      },

      clearToolsError: () => {
        set({ toolsError: null });
      },
    }),
    {
      name: "Editor Store",
    },
  ),
);

/**
 * Hooks for specific parts of the store
 */
export const useWorkers = () => useEditorStore((state) => state.workers);
export const useWorkersLoading = () =>
  useEditorStore((state) => state.workersLoading);
export const useWorkersError = () =>
  useEditorStore((state) => state.workersError);
export const useWorkerActions = () =>
  useEditorStore((state) => ({
    listWorkers: state.listWorkers,
    setWorker: state.setWorker,
    updateWorker: state.updateWorker,
    clearError: state.clearError,
  }));
