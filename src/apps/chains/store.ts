/**
 * Chains API Store
 * Manages cross-domain task chains via RPC calls
 * 
 * WebFIX v2.12.0: All responses use `raw` field for data payload
 * See: /docs/WEBFIX-MIGRATION-GUIDE.md
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// WebFIX v2.12.0 response wrapper type
interface WebfixResponse<T> {
  success: boolean;
  raw?: T;
  error?: {
    code: string;
    message: string;
    httpStatus?: number;
  };
}
import type {
  ChainsStore,
  ChainsFilters,
  Chain,
  ChainExecution,
  ListChainsParams,
  ListChainsResponse,
  CreateChainParams,
  CreateChainResponse,
  GetChainParams,
  GetChainResponse,
  UpdateChainParams,
  UpdateChainResponse,
  ExecuteChainParams,
  ExecuteChainResponse,
  GetChainStatusParams,
  GetChainStatusResponse,
  GetChainHistoryParams,
  GetChainHistoryResponse,
  PauseChainParams,
  PauseChainResponse,
  ResumeChainParams,
  ResumeChainResponse,
  DeleteChainParams,
  DeleteChainResponse,
} from "./types";

/**
 * Helper to get API client
 */
function getApiClient(): WebfixApiClient | null {
  const connectionSession = useAuthStore.getState().connectionSession;
  if (!connectionSession) return null;

  const client = new WebfixApiClient(connectionSession.api);
  client.setSession(connectionSession.session);
  return client;
}

/**
 * Initial filters state
 */
const initialFilters: ChainsFilters = {
  status: undefined,
  ownerId: undefined,
};

/**
 * Chains Store
 */
export const useChainsStore = create<ChainsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      chains: [],
      selectedChain: null,
      executions: [],
      currentExecution: null,
      filters: initialFilters,

      // Loading states
      chainsLoading: false,
      chainLoading: false,
      executionLoading: false,
      historyLoading: false,

      // Error states
      chainsError: null,
      chainError: null,
      executionError: null,

      // List all chains
      listChains: async (params?: ListChainsParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ chainsLoading: true, chainsError: null });

        try {
          const response = await client.request<WebfixResponse<{ chains: Chain[] }>>(
            "listChains",
            params || {}
          );

          console.log("[ChainsStore] listChains response:", response);

          // WebFIX v2.12.0: Parse response.raw.chains
          const chains = response.raw?.chains || [];
          set({ chains, chainsLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch chains";
          console.error("[ChainsStore] listChains error:", error);
          set({ chainsError: message, chainsLoading: false });
          toast.error("Failed to fetch chains", message);
        }
      },

      // Create a new chain
      createChain: async (params: CreateChainParams): Promise<Chain | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ chainLoading: true, chainError: null });

        try {
          const response = await client.request<WebfixResponse<{ chain: Chain }>>(
            "createChain",
            params
          );

          console.log("[ChainsStore] createChain response:", response);

          // WebFIX v2.12.0: Parse response.raw.chain
          const chain = response.raw?.chain;
          if (chain) {
            set((state) => ({
              chains: [chain, ...state.chains],
              selectedChain: chain,
              chainLoading: false,
            }));
            toast.success("Chain created", `${chain.name} has been created`);
            return chain;
          }

          throw new Error(response.error?.message || "Failed to create chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create chain";
          console.error("[ChainsStore] createChain error:", error);
          set({ chainError: message, chainLoading: false });
          toast.error("Failed to create chain", message);
          return null;
        }
      },

      // Get a single chain
      getChain: async (params: GetChainParams): Promise<Chain | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ chainLoading: true, chainError: null });

        try {
          const response = await client.request<WebfixResponse<{ chain: Chain }>>(
            "getChain",
            params
          );

          console.log("[ChainsStore] getChain response:", response);

          // WebFIX v2.12.0: Parse response.raw.chain
          const chain = response.raw?.chain;
          if (chain) {
            set({ selectedChain: chain, chainLoading: false });
            return chain;
          }

          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch chain";
          console.error("[ChainsStore] getChain error:", error);
          set({ chainError: message, chainLoading: false });
          toast.error("Failed to fetch chain", message);
          return null;
        }
      },

      // Update a chain
      updateChain: async (params: UpdateChainParams): Promise<Chain | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ chainLoading: true, chainError: null });

        try {
          const response = await client.request<WebfixResponse<{ chain: Chain }>>(
            "updateChain",
            params
          );

          console.log("[ChainsStore] updateChain response:", response);

          // WebFIX v2.12.0: Parse response.raw.chain
          const chain = response.raw?.chain;
          if (chain) {
            set((state) => ({
              chains: state.chains.map((c) => (c.id === chain.id ? chain : c)),
              selectedChain: state.selectedChain?.id === chain.id ? chain : state.selectedChain,
              chainLoading: false,
            }));
            toast.success("Chain updated", `${chain.name} has been updated`);
            return chain;
          }

          throw new Error(response.error?.message || "Failed to update chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update chain";
          console.error("[ChainsStore] updateChain error:", error);
          set({ chainError: message, chainLoading: false });
          toast.error("Failed to update chain", message);
          return null;
        }
      },

      // Execute a chain
      executeChain: async (params: ExecuteChainParams): Promise<string | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ executionLoading: true, executionError: null });

        try {
          const response = await client.request<WebfixResponse<{ executionId: string }>>(
            "executeChain",
            params
          );

          console.log("[ChainsStore] executeChain response:", response);

          // WebFIX v2.12.0: Parse response.raw.executionId
          const executionId = response.raw?.executionId;
          if (executionId) {
            toast.success("Chain execution started", `Execution ID: ${executionId}`);
            set({ executionLoading: false });
            return executionId;
          }

          throw new Error(response.error?.message || "Failed to execute chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to execute chain";
          console.error("[ChainsStore] executeChain error:", error);
          set({ executionError: message, executionLoading: false });
          toast.error("Failed to execute chain", message);
          return null;
        }
      },

      // Get chain status
      getChainStatus: async (params: GetChainStatusParams): Promise<ChainExecution | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ executionLoading: true, executionError: null });

        try {
          const response = await client.request<WebfixResponse<{ execution: ChainExecution }>>(
            "getChainStatus",
            params
          );

          console.log("[ChainsStore] getChainStatus response:", response);

          // WebFIX v2.12.0: Parse response.raw.execution
          const execution = response.raw?.execution;
          if (execution) {
            set({ currentExecution: execution, executionLoading: false });
            return execution;
          }

          set({ executionLoading: false });
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get chain status";
          console.error("[ChainsStore] getChainStatus error:", error);
          set({ executionError: message, executionLoading: false });
          toast.error("Failed to get chain status", message);
          return null;
        }
      },

      // Get chain history
      getChainHistory: async (params: GetChainHistoryParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ historyLoading: true, executionError: null });

        try {
          const response = await client.request<WebfixResponse<{ executions: ChainExecution[] }>>(
            "getChainHistory",
            params
          );

          console.log("[ChainsStore] getChainHistory response:", response);

          // WebFIX v2.12.0: Parse response.raw.executions
          const executions = response.raw?.executions || [];
          set({ executions, historyLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get chain history";
          console.error("[ChainsStore] getChainHistory error:", error);
          set({ executionError: message, historyLoading: false });
          toast.error("Failed to get chain history", message);
        }
      },

      // Pause a chain
      pauseChain: async (params: PauseChainParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ executionLoading: true, executionError: null });

        try {
          const response = await client.request<WebfixResponse<{ chain: Chain }>>(
            "pauseChain",
            params
          );

          console.log("[ChainsStore] pauseChain response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            // Update chain status in list
            set((state) => ({
              chains: state.chains.map((c) =>
                c.id === params.chainId ? { ...c, status: "paused" as const } : c
              ),
              selectedChain:
                state.selectedChain?.id === params.chainId
                  ? { ...state.selectedChain, status: "paused" as const }
                  : state.selectedChain,
            }));
            toast.success("Chain paused", "Chain execution has been paused");
            set({ executionLoading: false });
            return true;
          }

          throw new Error(response.error?.message || "Failed to pause chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to pause chain";
          console.error("[ChainsStore] pauseChain error:", error);
          set({ executionError: message, executionLoading: false });
          toast.error("Failed to pause chain", message);
          return false;
        }
      },

      // Resume a chain
      resumeChain: async (params: ResumeChainParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ executionLoading: true, executionError: null });

        try {
          const response = await client.request<WebfixResponse<{ chain: Chain }>>(
            "resumeChain",
            params
          );

          console.log("[ChainsStore] resumeChain response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            // Update chain status in list
            set((state) => ({
              chains: state.chains.map((c) =>
                c.id === params.chainId ? { ...c, status: "running" as const } : c
              ),
              selectedChain:
                state.selectedChain?.id === params.chainId
                  ? { ...state.selectedChain, status: "running" as const }
                  : state.selectedChain,
            }));
            toast.success("Chain resumed", "Chain execution has been resumed");
            set({ executionLoading: false });
            return true;
          }

          throw new Error(response.error?.message || "Failed to resume chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to resume chain";
          console.error("[ChainsStore] resumeChain error:", error);
          set({ executionError: message, executionLoading: false });
          toast.error("Failed to resume chain", message);
          return false;
        }
      },

      // Delete a chain
      deleteChain: async (params: DeleteChainParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ chainLoading: true, chainError: null });

        try {
          const response = await client.request<WebfixResponse<{ deleted: boolean }>>(
            "deleteChain",
            params
          );

          console.log("[ChainsStore] deleteChain response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            set((state) => ({
              chains: state.chains.filter((c) => c.id !== params.chainId),
              selectedChain:
                state.selectedChain?.id === params.chainId ? null : state.selectedChain,
              chainLoading: false,
            }));
            toast.success("Chain deleted", "Chain has been removed");
            return true;
          }

          throw new Error(response.error?.message || "Failed to delete chain");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete chain";
          console.error("[ChainsStore] deleteChain error:", error);
          set({ chainError: message, chainLoading: false });
          toast.error("Failed to delete chain", message);
          return false;
        }
      },

      // UI Actions
      setSelectedChain: (chain: Chain | null) => {
        set({ selectedChain: chain });
      },

      setCurrentExecution: (execution: ChainExecution | null) => {
        set({ currentExecution: execution });
      },

      setFilters: (filters: Partial<ChainsFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      clearChains: () => {
        set({ chains: [], chainsError: null, selectedChain: null });
      },

      clearExecutions: () => {
        set({ executions: [], currentExecution: null, executionError: null });
      },
    }),
    { name: "chains-store" }
  )
);
