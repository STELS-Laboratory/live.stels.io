/**
 * MCP Tool worker type definitions
 * Aligned with docs/openapi/schemas/tools.yaml
 */

export type ToolCategory =
  | "trading"
  | "analysis"
  | "notification"
  | "data"
  | "utility"
  | "custom";

export type ToolScope = "local" | "network";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  category?: ToolCategory;
  outputSchema?: Record<string, unknown>;
  timeout?: number;
  requiredScopes?: string[];
}

export interface ToolBindingLimits {
  maxCallsPerMinute?: number;
  maxCallsPerHour?: number;
  maxCallsPerDay?: number;
}

export interface ToolBinding {
  toolId: string;
  toolName: string;
  grantedScopes: string[];
  limits?: ToolBindingLimits;
  addedAt: number;
}

export interface ToolExecutionResult {
  success: boolean;
  duration: number;
  toolId: string;
  result?: unknown;
  error?: string;
  toolName?: string;
}

/** API: create or update tool. Omit sid to create. */
export interface SetToolRequest {
  sid?: string;
  name: string;
  description: string;
  script: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  category?: ToolCategory;
  timeout?: number;
  requiredScopes?: string[];
  scope?: ToolScope;
  active?: boolean;
}

/** API: list tools filter */
export interface ListToolsRequest {
  scope?: "local" | "network" | "all";
  category?: ToolCategory;
  active?: boolean;
  includeScript?: boolean;
  refresh?: boolean;
}

/** API: get tool by id */
export interface GetToolRequest {
  toolId: string;
  includeScript?: boolean;
}

/** API: delete tool */
export interface DeleteToolRequest {
  toolId: string;
  force?: boolean;
}

/** API: execute tool */
export interface CallToolRequest {
  toolId: string;
  input?: Record<string, unknown>;
  agentId?: string;
  metadata?: Record<string, unknown> | null;
}

export interface BindToolToAgentRequest {
  agentId: string;
  toolId: string;
  grantedScopes?: string[];
  limits?: ToolBindingLimits;
}

export interface ApplyToolPresetRequest {
  agentId: string;
  preset: string;
  defaultScopes?: string[];
  defaultLimits?: ToolBindingLimits;
  replaceExisting?: boolean;
}

/** Tool record as returned from listTools / getTool / setTool (raw shape) */
export interface ToolRaw {
  sid: string;
  name: string;
  description: string;
  script?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  category?: ToolCategory;
  scope?: ToolScope;
  timeout?: number;
  requiredScopes?: string[];
  active?: boolean;
  created?: boolean;
  [key: string]: unknown;
}

/** Tool list response: raw.tools array or direct array */
export type ToolListPayload = ToolRaw[] | { raw?: { tools?: ToolRaw[] }; timestamp?: number };
