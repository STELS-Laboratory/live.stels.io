/**
 * Domains API Store
 * Manages domain adapters and templates via RPC calls
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
  DomainsStore,
  DomainInfo,
  Template,
  ListDomainsParams,
  GetDomainInfoParams,
  ExecuteDomainActionParams,
  ListTemplatesParams,
  CreateFromTemplateParams,
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
 * Domains Store
 */
export const useDomainsStore = create<DomainsStore>()(
  devtools(
    (set) => ({
      // Initial state
      domains: [],
      selectedDomain: null,
      templates: [],
      selectedTemplate: null,

      // Loading states
      domainsLoading: false,
      domainLoading: false,
      templatesLoading: false,
      actionExecuting: false,
      creating: false,

      // Error states
      domainsError: null,
      domainError: null,
      templatesError: null,
      actionError: null,

      // List all domains
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      listDomains: async (params?: ListDomainsParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ domainsLoading: true, domainsError: null });

        try {
          const response = await client.request<WebfixResponse<{ domains: DomainInfo[] }>>(
            "listDomains",
            {}
          );

          console.log("[DomainsStore] listDomains response:", response);

          // WebFIX v2.12.0: Parse response.raw.domains
          const domains = response.raw?.domains || [];

          set({ domains, domainsLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch domains";
          console.error("[DomainsStore] listDomains error:", error);
          set({ domainsError: message, domainsLoading: false });
          toast.error("Failed to fetch domains", message);
        }
      },

      // Get domain info
      getDomainInfo: async (params: GetDomainInfoParams): Promise<DomainInfo | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ domainLoading: true, domainError: null });

        try {
          const response = await client.request<WebfixResponse<{ domain: DomainInfo }>>(
            "getDomainInfo",
            params
          );

          console.log("[DomainsStore] getDomainInfo response:", response);

          // WebFIX v2.12.0: Parse response.raw.domain
          const domain = response.raw?.domain;
          if (domain) {
            set({ selectedDomain: domain, domainLoading: false });
            return domain;
          }

          set({ domainLoading: false });
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get domain info";
          console.error("[DomainsStore] getDomainInfo error:", error);
          set({ domainError: message, domainLoading: false });
          toast.error("Failed to get domain info", message);
          return null;
        }
      },

      // Execute domain action
      executeDomainAction: async (params: ExecuteDomainActionParams): Promise<Record<string, unknown> | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ actionExecuting: true, actionError: null });

        try {
          const response = await client.request<WebfixResponse<{ result: Record<string, unknown> }>>(
            "executeDomainAction",
            params
          );

          console.log("[DomainsStore] executeDomainAction response:", response);

          // WebFIX v2.12.0: Parse response.raw.result
          if (response.success && response.raw?.result) {
            toast.success(
              "Action executed",
              `${params.action} on ${params.domain}`
            );
            set({ actionExecuting: false });
            return response.raw.result;
          }

          throw new Error(response.error?.message || "Failed to execute action");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to execute action";
          console.error("[DomainsStore] executeDomainAction error:", error);
          set({ actionError: message, actionExecuting: false });
          toast.error("Failed to execute action", message);
          return null;
        }
      },

      // List templates
      listTemplates: async (params?: ListTemplatesParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ templatesLoading: true, templatesError: null });

        try {
          const response = await client.request<WebfixResponse<{ templates: Template[] }>>(
            "listTemplates",
            params || {}
          );

          console.log("[DomainsStore] listTemplates response:", response);

          // WebFIX v2.12.0: Parse response.raw.templates
          const templates = response.raw?.templates || [];

          set({ templates, templatesLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch templates";
          console.error("[DomainsStore] listTemplates error:", error);
          set({ templatesError: message, templatesLoading: false });
          toast.error("Failed to fetch templates", message);
        }
      },

      // Create from template
      createFromTemplate: async (params: CreateFromTemplateParams): Promise<Record<string, unknown> | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ creating: true });

        try {
          const response = await client.request<WebfixResponse<{ created: Record<string, unknown> }>>(
            "createFromTemplate",
            params
          );

          console.log("[DomainsStore] createFromTemplate response:", response);

          // WebFIX v2.12.0: Parse response.raw.created
          if (response.success && response.raw?.created) {
            toast.success(
              "Created from template",
              params.name || `From template ${params.templateId}`
            );
            set({ creating: false });
            return response.raw.created;
          }

          throw new Error(response.error?.message || "Failed to create from template");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create from template";
          console.error("[DomainsStore] createFromTemplate error:", error);
          set({ creating: false });
          toast.error("Failed to create from template", message);
          return null;
        }
      },

      // UI Actions
      setSelectedDomain: (domain: DomainInfo | null) => {
        set({ selectedDomain: domain });
      },

      setSelectedTemplate: (template: Template | null) => {
        set({ selectedTemplate: template });
      },

      clearDomains: () => {
        set({ domains: [], domainsError: null, selectedDomain: null });
      },

      clearTemplates: () => {
        set({ templates: [], templatesError: null, selectedTemplate: null });
      },
    }),
    { name: "domains-store" }
  )
);
