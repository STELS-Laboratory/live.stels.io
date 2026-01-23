/**
 * Chains API Types
 * Based on OpenAPI specification docs/openapi/schemas/chains.yaml
 */

// ============================================
// Common Types
// ============================================

export type StepType = "task" | "agent" | "condition" | "parallel" | "wait" | "notification";

export type ChainStatus = "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";

export type ChainExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";

// ============================================
// Step Types
// ============================================

export interface ChainStepConfig {
  type: StepType;
  taskId?: string;
  agentId?: string;
  actions?: Array<{
    type: string;
    params?: Record<string, unknown>;
    accountId?: string;
    timeout?: number;
    retryOnFailure?: boolean;
    retryCount?: number;
    continueOnError?: boolean;
    outputKey?: string;
  }>;
  prompt?: string;
  condition?: {
    field: string;
    operator: string;
    value: unknown;
  };
  stepIds?: string[];
  duration?: number;
  channel?: string;
  template?: string;
  timeout?: number;
}

export interface ChainStepDependency {
  stepId: string;
  condition: "completed" | "success" | "failure" | "any";
  outputMapping?: Record<string, string>;
}

export interface ChainStep {
  id: string;
  name: string;
  description?: string;
  config: ChainStepConfig;
  dependencies?: ChainStepDependency[];
  continueOnError?: boolean;
}

// ============================================
// Chain Types
// ============================================

export interface Chain {
  id: string;
  name: string;
  description?: string;
  status: ChainStatus;
  trigger?: {
    type: "manual" | "scheduled" | "event" | "condition" | "webhook" | "chain";
    config?: Record<string, unknown>;
  };
  steps: ChainStep[];
  entryStepId?: string;
  timeout?: number;
  maxConcurrentExecutions?: number;
  lastExecutedAt?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChainExecution {
  id: string;
  chainId: string;
  status: ChainExecutionStatus;
  triggeredBy?: string;
  context?: Record<string, unknown>;
  currentStepIds?: string[];
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  error?: string;
}

// ============================================
// Request Types
// ============================================

export interface ListChainsParams {
  ownerId?: string;
  status?: ChainStatus;
  limit?: number;
  offset?: number;
}

export interface CreateChainParams {
  name: string;
  description?: string;
  ownerId: string;
  steps: Array<{
    id: string;
    name: string;
    taskId?: string;
    action?: {
      type: string;
      config?: Record<string, unknown>;
    };
    dependsOn?: string[];
    condition?: Record<string, unknown>;
    onSuccess?: Record<string, unknown>;
    onFailure?: Record<string, unknown>;
    timeout?: number;
    retries?: number;
  }>;
  initialContext?: Record<string, unknown>;
}

export interface GetChainParams {
  chainId: string;
}

export interface UpdateChainParams {
  chainId: string;
  name?: string;
  description?: string;
  steps?: ChainStep[];
  status?: ChainStatus;
}

export interface ExecuteChainParams {
  chainId: string;
  context?: Record<string, unknown>;
  triggerData?: Record<string, unknown>;
}

export interface GetChainStatusParams {
  chainId: string;
  executionId?: string;
}

export interface GetChainHistoryParams {
  chainId: string;
  limit?: number;
  offset?: number;
}

export interface PauseChainParams {
  chainId: string;
  executionId?: string;
}

export interface ResumeChainParams {
  chainId: string;
  executionId?: string;
}

export interface DeleteChainParams {
  chainId: string;
}

// ============================================
// Response Types
// ============================================

export interface ListChainsResponse {
  success?: boolean;
  chains: Chain[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface CreateChainResponse {
  success?: boolean;
  chain?: Chain;
  error?: string;
}

export interface GetChainResponse {
  success?: boolean;
  chain?: Chain;
  error?: string;
}

export interface UpdateChainResponse {
  success?: boolean;
  chain?: Chain;
  error?: string;
}

export interface ExecuteChainResponse {
  success?: boolean;
  executionId?: string;
  error?: string;
}

export interface GetChainStatusResponse {
  success?: boolean;
  execution?: ChainExecution;
  chain?: Chain;
  error?: string;
}

export interface GetChainHistoryResponse {
  success?: boolean;
  executions?: ChainExecution[];
  error?: string;
}

export interface PauseChainResponse {
  success?: boolean;
  chain?: Chain;
  execution?: ChainExecution;
  error?: string;
}

export interface ResumeChainResponse {
  success?: boolean;
  chain?: Chain;
  execution?: ChainExecution;
  error?: string;
}

export interface DeleteChainResponse {
  success?: boolean;
  deleted?: boolean;
  error?: string;
}

// ============================================
// Store Types
// ============================================

export interface ChainsFilters {
  status?: ChainStatus;
  ownerId?: string;
}

export interface ChainsStore {
  // State
  chains: Chain[];
  selectedChain: Chain | null;
  executions: ChainExecution[];
  currentExecution: ChainExecution | null;
  filters: ChainsFilters;

  // Loading states
  chainsLoading: boolean;
  chainLoading: boolean;
  executionLoading: boolean;
  historyLoading: boolean;

  // Error states
  chainsError: string | null;
  chainError: string | null;
  executionError: string | null;

  // Actions
  listChains: (params?: ListChainsParams) => Promise<void>;
  createChain: (params: CreateChainParams) => Promise<Chain | null>;
  getChain: (params: GetChainParams) => Promise<Chain | null>;
  updateChain: (params: UpdateChainParams) => Promise<Chain | null>;
  executeChain: (params: ExecuteChainParams) => Promise<string | null>;
  getChainStatus: (params: GetChainStatusParams) => Promise<ChainExecution | null>;
  getChainHistory: (params: GetChainHistoryParams) => Promise<void>;
  pauseChain: (params: PauseChainParams) => Promise<boolean>;
  resumeChain: (params: ResumeChainParams) => Promise<boolean>;
  deleteChain: (params: DeleteChainParams) => Promise<boolean>;

  // UI Actions
  setSelectedChain: (chain: Chain | null) => void;
  setCurrentExecution: (execution: ChainExecution | null) => void;
  setFilters: (filters: Partial<ChainsFilters>) => void;
  clearFilters: () => void;
  clearChains: () => void;
  clearExecutions: () => void;
}
