/**
 * Strategy Templates application store
 * Manages strategy templates and user strategies via RPC calls
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";
import type {
  StrategyStore,
  StrategyTemplate,
  StrategyTemplateSummary,
  Strategy,
  StrategyFilters,
  ListTemplatesRequest,
  ListTemplatesResponse,
  GetTemplateResponse,
  CreateStrategyRequest,
  CreateStrategyResponse,
  ListStrategiesRequest,
  ListStrategiesResponse,
  UpdateStrategyRequest,
  StrategyResponse,
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
const initialFilters: StrategyFilters = {
  domain: undefined,
  difficulty: undefined,
  riskLevel: undefined,
  tags: undefined,
  status: undefined,
  search: undefined,
};

/**
 * Strategy store implementation
 */
export const useStrategyStore = create<StrategyStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      templates: [],
      selectedTemplate: null,
      strategies: [],
      selectedStrategy: null,
      filters: initialFilters,

      // Loading states
      templatesLoading: false,
      templateLoading: false,
      strategiesLoading: false,
      strategyCreating: false,

      // Error states
      templatesError: null,
      templateError: null,
      strategiesError: null,

      // ========================================================================
      // Template Actions
      // ========================================================================

      listTemplates: async (params?: ListTemplatesRequest) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ templatesLoading: true, templatesError: null });

        try {
          const response = await client.request<ListTemplatesResponse>(
            "listStrategyTemplates",
            {
              domain: params?.domain,
              difficulty: params?.difficulty,
              riskLevel: params?.riskLevel,
              tags: params?.tags,
              summaryOnly: !(params?.includeFull ?? false),
            }
          );

          console.log("[StrategyStore] listTemplates response:", response);

          // Handle both {success, templates} and direct {templates} formats
          const templates = response.templates ?? [];
          console.log("[StrategyStore] Templates loaded:", templates.length);
          set({ templates });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load templates";
          console.error("[StrategyStore] listTemplates error:", error);
          set({ templatesError: message });
          toast.error(message);
        } finally {
          set({ templatesLoading: false });
        }
      },

      getTemplate: async (templateId: string) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ templateLoading: true, templateError: null });

        try {
          const response = await client.request<GetTemplateResponse>(
            "getStrategyTemplate",
            { templateId }
          );

          console.log("[StrategyStore] getTemplate response:", response);

          const template = response.template;
          if (template) {
            console.log("[StrategyStore] Template loaded:", template.name);
            console.log("[StrategyStore] ConfigSchema:", JSON.stringify(template.configSchema, null, 2));
            console.log("[StrategyStore] Groups count:", template.configSchema?.groups?.length ?? 0);
            template.configSchema?.groups?.forEach((g, i) => {
              console.log(`[StrategyStore] Group ${i}: ${g.label}, fields: ${g.fields?.length ?? 0}`);
            });
            set({ selectedTemplate: template });
            return template;
          } else {
            throw new Error("Template not found");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load template";
          console.error("[StrategyStore] getTemplate error:", error);
          set({ templateError: message });
          toast.error(message);
          return null;
        } finally {
          set({ templateLoading: false });
        }
      },

      clearSelectedTemplate: () => {
        set({ selectedTemplate: null, templateError: null });
      },

      // ========================================================================
      // Strategy Actions
      // ========================================================================

      createStrategy: async (params: CreateStrategyRequest) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ strategyCreating: true });

        try {
          const response = await client.request<CreateStrategyResponse>(
            "createStrategy",
            params
          );

          console.log("[StrategyStore] createStrategy response:", response);

          // Handle validation errors
          if (response.validationErrors && response.validationErrors.length > 0) {
            console.log("[StrategyStore] Validation errors:", response.validationErrors);
            return response;
          }

          if (response.success && response.strategy) {
            console.log("[StrategyStore] Strategy created:", response.strategy.id);

            // Add to strategies list if not a dry run
            if (!params.dryRun) {
              set((state) => ({
                strategies: [response.strategy!, ...state.strategies],
              }));
              toast.success(`Strategy "${response.strategy.name}" created`);
            }

            return response;
          } else if (params.dryRun) {
            // Dry run returns validation result without strategy
            return response;
          } else {
            throw new Error("Failed to create strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create strategy";
          console.error("[StrategyStore] createStrategy error:", error);
          toast.error(message);
          return null;
        } finally {
          set({ strategyCreating: false });
        }
      },

      listStrategies: async (params?: ListStrategiesRequest) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ strategiesLoading: true, strategiesError: null });

        try {
          const response = await client.request<ListStrategiesResponse>(
            "listStrategies",
            {
              templateId: params?.templateId,
              status: params?.status,
              limit: params?.limit ?? 50,
              offset: params?.offset ?? 0,
            }
          );

          console.log("[StrategyStore] listStrategies response:", response);

          // Handle both {success, strategies} and direct {strategies} formats
          const strategies = response.strategies ?? [];
          console.log("[StrategyStore] Strategies loaded:", strategies.length);
          set({ strategies });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load strategies";
          console.error("[StrategyStore] listStrategies error:", error);
          set({ strategiesError: message });
          toast.error(message);
        } finally {
          set({ strategiesLoading: false });
        }
      },

      updateStrategy: async (params: UpdateStrategyRequest) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        try {
          const response = await client.request<StrategyResponse>(
            "updateStrategy",
            params
          );

          if (response.success && response.strategy) {
            console.log("[StrategyStore] Strategy updated:", response.strategy.id);

            // Update in list
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === response.strategy.id ? response.strategy : s
              ),
              selectedStrategy:
                state.selectedStrategy?.id === response.strategy.id
                  ? response.strategy
                  : state.selectedStrategy,
            }));

            toast.success("Strategy updated");
            return response.strategy;
          } else {
            throw new Error("Failed to update strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update strategy";
          console.error("[StrategyStore] updateStrategy error:", error);
          toast.error(message);
          return null;
        }
      },

      deleteStrategy: async (strategyId: string) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        try {
          const response = await client.request<{ success: boolean; deleted: boolean }>(
            "deleteStrategy",
            { strategyId }
          );

          if (response.success && response.deleted) {
            console.log("[StrategyStore] Strategy deleted:", strategyId);

            // Remove from list
            set((state) => ({
              strategies: state.strategies.filter((s) => s.id !== strategyId),
              selectedStrategy:
                state.selectedStrategy?.id === strategyId ? null : state.selectedStrategy,
            }));

            toast.success("Strategy deleted");
            return true;
          } else {
            throw new Error("Failed to delete strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete strategy";
          console.error("[StrategyStore] deleteStrategy error:", error);
          toast.error(message);
          return false;
        }
      },

      startStrategy: async (strategyId: string) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        try {
          const response = await client.request<StrategyResponse>(
            "startStrategy",
            { strategyId }
          );

          if (response.success && response.strategy) {
            console.log("[StrategyStore] Strategy started:", strategyId);

            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === strategyId ? { ...s, status: "running" as const } : s
              ),
              selectedStrategy:
                state.selectedStrategy?.id === strategyId
                  ? { ...state.selectedStrategy, status: "running" as const }
                  : state.selectedStrategy,
            }));

            toast.success("Strategy started");
            return true;
          } else {
            throw new Error("Failed to start strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to start strategy";
          console.error("[StrategyStore] startStrategy error:", error);
          toast.error(message);
          return false;
        }
      },

      pauseStrategy: async (strategyId: string) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        try {
          const response = await client.request<StrategyResponse>(
            "pauseStrategy",
            { strategyId }
          );

          if (response.success && response.strategy) {
            console.log("[StrategyStore] Strategy paused:", strategyId);

            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === strategyId ? { ...s, status: "paused" as const } : s
              ),
              selectedStrategy:
                state.selectedStrategy?.id === strategyId
                  ? { ...state.selectedStrategy, status: "paused" as const }
                  : state.selectedStrategy,
            }));

            toast.success("Strategy paused");
            return true;
          } else {
            throw new Error("Failed to pause strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to pause strategy";
          console.error("[StrategyStore] pauseStrategy error:", error);
          toast.error(message);
          return false;
        }
      },

      stopStrategy: async (strategyId: string) => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        try {
          const response = await client.request<StrategyResponse>(
            "stopStrategy",
            { strategyId }
          );

          if (response.success && response.strategy) {
            console.log("[StrategyStore] Strategy stopped:", strategyId);

            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === strategyId ? { ...s, status: "stopped" as const } : s
              ),
              selectedStrategy:
                state.selectedStrategy?.id === strategyId
                  ? { ...state.selectedStrategy, status: "stopped" as const }
                  : state.selectedStrategy,
            }));

            toast.success("Strategy stopped");
            return true;
          } else {
            throw new Error("Failed to stop strategy");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to stop strategy";
          console.error("[StrategyStore] stopStrategy error:", error);
          toast.error(message);
          return false;
        }
      },

      // ========================================================================
      // Filter Actions
      // ========================================================================

      setFilters: (filters: Partial<StrategyFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      setSelectedStrategy: (strategy: Strategy | null) => {
        set({ selectedStrategy: strategy });
      },
    }),
    { name: "strategy-store" }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useTemplates = () => useStrategyStore((state) => state.templates);
export const useSelectedTemplate = () => useStrategyStore((state) => state.selectedTemplate);
export const useStrategies = () => useStrategyStore((state) => state.strategies);
export const useSelectedStrategy = () => useStrategyStore((state) => state.selectedStrategy);
export const useStrategyFilters = () => useStrategyStore((state) => state.filters);

export const useTemplatesLoading = () => useStrategyStore((state) => state.templatesLoading);
export const useTemplateLoading = () => useStrategyStore((state) => state.templateLoading);
export const useStrategiesLoading = () => useStrategyStore((state) => state.strategiesLoading);
export const useStrategyCreating = () => useStrategyStore((state) => state.strategyCreating);
