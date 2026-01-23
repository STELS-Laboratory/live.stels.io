/**
 * TypeScript type definitions for Strategy Templates module
 * Based on STELS Platform Strategy API (OpenAPI specification)
 */

// ============================================================================
// Enums and Basic Types
// ============================================================================

export type StrategyDifficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type StrategyRiskLevel = "low" | "medium" | "high" | "extreme";
export type StrategyStatus = "draft" | "configuring" | "ready" | "starting" | "running" | "paused" | "stopped" | "error" | "completed";

export type ConfigFieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "account"
  | "symbol"
  | "array";

// ============================================================================
// UI Constants
// ============================================================================

export const DIFFICULTY_CONFIG: Record<
  StrategyDifficulty,
  { label: string; color: string; stars: number }
> = {
  beginner: { label: "Beginner", color: "bg-green-500", stars: 1 },
  intermediate: { label: "Intermediate", color: "bg-yellow-500", stars: 2 },
  advanced: { label: "Advanced", color: "bg-orange-500", stars: 3 },
  expert: { label: "Expert", color: "bg-red-500", stars: 4 },
};

export const RISK_LEVEL_CONFIG: Record<
  StrategyRiskLevel,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "text-green-500", bgColor: "bg-green-500" },
  medium: { label: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  high: { label: "High", color: "text-orange-500", bgColor: "bg-orange-500" },
  extreme: { label: "Extreme", color: "text-red-500", bgColor: "bg-red-500" },
};

export const STATUS_CONFIG: Record<
  StrategyStatus,
  { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", color: "bg-gray-400", variant: "secondary" },
  configuring: { label: "Configuring", color: "bg-blue-400", variant: "outline" },
  ready: { label: "Ready", color: "bg-blue-500", variant: "secondary" },
  starting: { label: "Starting", color: "bg-green-400", variant: "outline" },
  running: { label: "Running", color: "bg-green-500", variant: "default" },
  paused: { label: "Paused", color: "bg-yellow-500", variant: "outline" },
  stopped: { label: "Stopped", color: "bg-gray-500", variant: "secondary" },
  error: { label: "Error", color: "bg-red-500", variant: "destructive" },
  completed: { label: "Completed", color: "bg-purple-500", variant: "secondary" },
};

// ============================================================================
// Config Schema Types (aligned with OpenAPI)
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  pattern?: string;
  message?: string;
}

export interface FieldDependency {
  field: string;
  value: unknown;
}

export interface StrategyConfigField {
  id: string;
  label: string;
  type: ConfigFieldType;
  description?: string;
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[];
  validation?: FieldValidation;
  dependsOn?: FieldDependency;
  advanced?: boolean;
}

export interface StrategyConfigGroup {
  id: string;
  label: string;
  description?: string;
  collapsed?: boolean;
  fields: StrategyConfigField[];
}

export interface ConfigSchema {
  version: string;
  groups: StrategyConfigGroup[];
}

// ============================================================================
// Documentation Types (aligned with OpenAPI)
// ============================================================================

export interface ConfigExample {
  title: string;
  description: string;
  config: Record<string, unknown>;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface StrategyDocumentation {
  overview?: string;
  howItWorks?: string;
  riskWarning?: string;
  bestPractices?: string[];
  examples?: ConfigExample[];
  faq?: FAQ[];
}

// ============================================================================
// Requirements Types (aligned with OpenAPI)
// ============================================================================

export interface StrategyRequirements {
  minAccounts?: number;
  accountTypes?: string[];
  requiredPermissions?: string[];
  minimumBalance?: number;
  supportedExchanges?: string[];
}

// ============================================================================
// Task and Agent Templates (aligned with OpenAPI)
// ============================================================================

export interface StrategyTaskTemplate {
  id: string;
  name: string;
  description?: string;
  action: Record<string, unknown>;
  trigger: Record<string, unknown>;
  conditions?: Record<string, unknown>[];
  limits?: Record<string, unknown>;
  approval?: Record<string, unknown>;
  enabledIf?: string;
}

export interface StrategyAgentTemplate {
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  tools?: string[];
}

// ============================================================================
// Template Types (aligned with OpenAPI)
// ============================================================================

export interface StrategyTemplateSummary {
  id: string;
  name: string;
  description?: string;
  version?: string;
  domain: string;
  icon?: string;
  color?: string;
  difficulty: StrategyDifficulty;
  riskLevel: StrategyRiskLevel;
  tags: string[];
  taskCount?: number;
}

export interface StrategyTemplate extends StrategyTemplateSummary {
  version: string;
  estimatedSetupTime?: string;
  requirements?: StrategyRequirements;
  configSchema: ConfigSchema;
  defaultConfig?: Record<string, unknown>;
  tasks: StrategyTaskTemplate[];
  agent?: StrategyAgentTemplate;
  documentation?: StrategyDocumentation;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================================================
// Strategy Instance Types (aligned with OpenAPI)
// ============================================================================

export interface StrategyStats {
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  totalProfit?: number;
  totalLoss?: number;
  winRate?: number;
  averageExecutionTime?: number;
  lastExecutionAt?: number;
}

export interface Strategy {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  status: StrategyStatus;
  config: Record<string, unknown>;
  taskIds: string[];
  agentId?: string;
  ownerId: string;
  stats?: StrategyStats;
  startedAt?: number;
  stoppedAt?: number;
  createdAt: number;
  updatedAt?: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// API Request Types (aligned with OpenAPI)
// ============================================================================

export interface ListTemplatesRequest {
  domain?: string;
  difficulty?: StrategyDifficulty;
  riskLevel?: StrategyRiskLevel;
  tags?: string[];
  summaryOnly?: boolean;
}

export interface GetTemplateRequest {
  templateId: string;
}

export interface CreateStrategyRequest {
  templateId: string;
  name: string;
  description?: string;
  /** Agent that will execute this strategy - REQUIRED */
  agentId: string;
  /** Owner ID - REQUIRED */
  ownerId: string;
  config: Record<string, unknown>;
  autoStart?: boolean;
  dryRun?: boolean;
}

export interface UpdateStrategyRequest {
  strategyId: string;
  name?: string;
  config?: Record<string, unknown>;
}

export interface ListStrategiesRequest {
  ownerId?: string;
  status?: StrategyStatus;
  templateId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API Response Types (aligned with OpenAPI)
// ============================================================================

export interface ListTemplatesResponse {
  success: boolean;
  templates: StrategyTemplateSummary[] | StrategyTemplate[];
  total: number;
}

export interface GetTemplateResponse {
  success: boolean;
  template: StrategyTemplate;
}

export interface CreateStrategyResponse {
  success: boolean;
  strategy?: Strategy;
  taskIds?: string[];
  validationErrors?: string[];
}

export interface ListStrategiesResponse {
  success: boolean;
  strategies: Strategy[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface StrategyResponse {
  success: boolean;
  strategy: Strategy;
}

export interface StartStrategyResponse {
  success: boolean;
  strategy: Strategy;
  activatedTasks?: number;
}

export interface StopStrategyResponse {
  success: boolean;
  strategy: Strategy;
  pausedTasks?: number;
}

export interface DeleteStrategyResponse {
  success: boolean;
  deleted: boolean;
  strategyId: string;
  deletedTasks?: number;
}

// ============================================================================
// Store Types
// ============================================================================

export interface StrategyFilters {
  domain?: string;
  difficulty?: StrategyDifficulty;
  riskLevel?: StrategyRiskLevel;
  tags?: string[];
  status?: StrategyStatus;
  search?: string;
}

export interface StrategyStore {
  // State
  templates: StrategyTemplateSummary[];
  selectedTemplate: StrategyTemplate | null;
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  filters: StrategyFilters;
  
  // Loading states
  templatesLoading: boolean;
  templateLoading: boolean;
  strategiesLoading: boolean;
  strategyCreating: boolean;
  
  // Error states
  templatesError: string | null;
  templateError: string | null;
  strategiesError: string | null;
  
  // Actions
  listTemplates: (params?: ListTemplatesRequest) => Promise<void>;
  getTemplate: (templateId: string) => Promise<StrategyTemplate | null>;
  clearSelectedTemplate: () => void;
  
  createStrategy: (params: CreateStrategyRequest) => Promise<CreateStrategyResponse | null>;
  listStrategies: (params?: ListStrategiesRequest) => Promise<void>;
  updateStrategy: (params: UpdateStrategyRequest) => Promise<Strategy | null>;
  deleteStrategy: (strategyId: string) => Promise<boolean>;
  startStrategy: (strategyId: string) => Promise<boolean>;
  pauseStrategy: (strategyId: string) => Promise<boolean>;
  stopStrategy: (strategyId: string) => Promise<boolean>;
  
  setFilters: (filters: Partial<StrategyFilters>) => void;
  clearFilters: () => void;
  setSelectedStrategy: (strategy: Strategy | null) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all fields from a config schema (flattened from groups)
 */
export function getAllFields(schema: ConfigSchema): StrategyConfigField[] {
  return schema.groups.flatMap(group => group.fields);
}

/**
 * Get field by ID from config schema
 */
export function getFieldById(schema: ConfigSchema, fieldId: string): StrategyConfigField | undefined {
  for (const group of schema.groups) {
    const field = group.fields.find(f => f.id === fieldId);
    if (field) return field;
  }
  return undefined;
}

/**
 * Initialize config with default values from schema
 */
export function initializeConfig(schema: ConfigSchema): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.default !== undefined) {
        config[field.id] = field.default;
      }
    }
  }
  return config;
}
