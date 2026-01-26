/**
 * Domains API Types
 * Based on OpenAPI specification docs/openapi/schemas/domains.yaml
 */

import type { AgentDomain } from "../agents/types";

// ============================================
// Domain Types
// ============================================

export interface DomainAction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface DomainInfo {
  name: string;
  description?: string;
  actions?: DomainAction[];
  providers?: string[];
  requiredScopes?: string[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  type?: string;
  domain?: AgentDomain;
  config?: Record<string, unknown>;
}

// ============================================
// Request Types
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ListDomainsParams {}

export interface GetDomainInfoParams {
  domain: AgentDomain;
}

export interface ExecuteDomainActionParams {
  domain: AgentDomain;
  action: string;
  accountId: string;
  params?: Record<string, unknown>;
}

export interface ListTemplatesParams {
  domain?: AgentDomain;
  type?: "agent" | "chain";
}

export interface CreateFromTemplateParams {
  templateId: string;
  workspaceId: string;
  name?: string;
  variables?: Record<string, unknown>;
}

// ============================================
// Response Types
// ============================================

export interface ListDomainsResponse {
  success?: boolean;
  domains?: DomainInfo[];
  error?: string;
}

export interface GetDomainInfoResponse {
  success?: boolean;
  domain?: DomainInfo;
  error?: string;
}

export interface ExecuteDomainActionResponse {
  success?: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ListTemplatesResponse {
  success?: boolean;
  templates?: Template[];
  error?: string;
}

export interface CreateFromTemplateResponse {
  success?: boolean;
  created?: Record<string, unknown>;
  error?: string;
}

// ============================================
// Store Types
// ============================================

export interface DomainsStore {
  // State
  domains: DomainInfo[];
  selectedDomain: DomainInfo | null;
  templates: Template[];
  selectedTemplate: Template | null;

  // Loading states
  domainsLoading: boolean;
  domainLoading: boolean;
  templatesLoading: boolean;
  actionExecuting: boolean;
  creating: boolean;

  // Error states
  domainsError: string | null;
  domainError: string | null;
  templatesError: string | null;
  actionError: string | null;

  // Actions
  listDomains: (params?: ListDomainsParams) => Promise<void>;
  getDomainInfo: (params: GetDomainInfoParams) => Promise<DomainInfo | null>;
  executeDomainAction: (params: ExecuteDomainActionParams) => Promise<Record<string, unknown> | null>;
  listTemplates: (params?: ListTemplatesParams) => Promise<void>;
  createFromTemplate: (params: CreateFromTemplateParams) => Promise<Record<string, unknown> | null>;

  // UI Actions
  setSelectedDomain: (domain: DomainInfo | null) => void;
  setSelectedTemplate: (template: Template | null) => void;
  clearDomains: () => void;
  clearTemplates: () => void;
}
