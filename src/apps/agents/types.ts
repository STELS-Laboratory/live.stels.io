/**
 * TypeScript type definitions for Agent Control module
 * Based on STELS Platform OpenAPI specification
 */

// Agent model options from Gradient AI
export type AgentModel =
  | "meta-llama/llama-3.3-70b-instruct"
  | "meta-llama/llama-3.1-8b-instruct"
  | "anthropic/claude-3.5-sonnet"
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "mistral/mistral-large";

export type AgentType =
  | "assistant"
  | "analyst"
  | "monitor"
  | "executor"
  | "router"
  | "custom";

export type AgentDomain = 
  | "trading"
  | "iot"
  | "drone"
  | "social"
  | "devops"
  | "general";

export type AgentStatus = 
  | "active"
  | "paused"
  | "error";

// Deployment status from Gradient AI
export type DeploymentStatus =
  | "STATUS_RUNNING"
  | "STATUS_DEPLOYING"
  | "STATUS_WAITING_FOR_DEPLOYMENT"
  | "STATUS_BUILDING"
  | "STATUS_FAILED"
  | "STATUS_DELETED"
  | "STATUS_DISABLED"
  | "unknown";

export type InferenceMethod = "agent_route" | "direct" | "fallback";

export interface AgentConfig {
  model?: AgentModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface AgentDeploymentStatus {
  deploymentStatus: DeploymentStatus;
  isDeployed: boolean;
  isDeploying: boolean;
  isFailed: boolean;
  deploymentUrl?: string;
  statusMessage?: string;
}

export interface AgentUsageStats {
  totalMessages?: number;
  totalTokens?: number;
  lastActiveAt?: number;
}

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  workspaceDescription?: string;
  assignedAt: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  workspaceContext?: WorkspaceContext;
  type?: AgentType;
  domain: AgentDomain;
  systemPrompt?: string;
  model?: string;
  config?: AgentConfig;
  knowledgeBaseIds?: string[];
  connectedAccountIds?: string[];
  status: AgentStatus;
  stats?: AgentUsageStats;
  deploymentId?: string;
  deploymentStatus?: AgentDeploymentStatus;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

// Legacy alias for backward compatibility
export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AgentCreateRequest {
  name: string;
  workspaceId: string;
  domain: AgentDomain;
  systemPrompt: string;
  model?: string;
  modelConfig?: ModelConfig;
  knowledgeBases?: string[];
  status?: AgentStatus;
  autoDeploy?: boolean;
}

export interface AgentUpdateRequest {
  agentId: string;
  name?: string;
  systemPrompt?: string;
  model?: string;
  modelConfig?: ModelConfig;
  knowledgeBases?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    latencyMs?: number;
    inferenceMethod?: InferenceMethod;
    agentStatus?: AgentDeploymentStatus;
  };
}

export interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  context?: Record<string, unknown>;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface ChatResponse {
  message: string;
  response?: string; // API returns 'response' field
  conversationId: string;
  messageCount?: number;
  inferenceMethod?: InferenceMethod;
  agentStatus?: AgentDeploymentStatus;
  tokensUsed?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  agentCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceUpdateRequest {
  workspaceId: string;
  name?: string;
  description?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  sourceType: "spaces" | "web";
  status: "indexing" | "ready" | "error";
  documentCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  byDomain: Record<AgentDomain, number>;
  byStatus: Record<AgentStatus, number>;
}

export interface FilterOptions {
  searchTerm: string;
  domain: AgentDomain | null;
  status: AgentStatus | null;
  workspaceId: string | null;
}

// Sync from Gradient AI types
export interface SyncFromGradientParams {
  syncWorkspaces?: boolean;
  syncAgents?: boolean;
}

export interface SyncFromGradientResponse {
  success: boolean;
  message: string;
  result: {
    workspaces?: {
      synced: number;
      skipped: number;
      errors: number;
      items: Array<{ id: string; name: string }>;
    };
    agents?: {
      synced: number;
      skipped: number;
      errors: number;
      items: Array<{ id: string; name: string; workspaceId: string }>;
    };
  };
}

// Move Agent to Workspace types
export interface MoveAgentToWorkspaceParams {
  agentId: string;
  workspaceId: string;
}

export interface MoveAgentToWorkspaceResponse {
  success: boolean;
  message: string;
  agent: Agent;
}

export interface AgentStore {
  // State
  agents: Agent[];
  selectedAgent: Agent | null;
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  knowledgeBases: KnowledgeBase[];
  conversations: Map<string, ChatMessage[]>;
  currentConversationId: string | null;
  lastSyncTime: number | null;
  
  // Loading states
  agentsLoading: boolean;
  agentLoading: boolean;
  chatLoading: boolean;
  syncLoading: boolean;
  workspaceLoading: boolean;
  
  // Errors
  agentsError: string | null;
  chatError: string | null;
  
  // Actions
  listAgents: () => Promise<void>;
  getAgent: (agentId: string) => Promise<Agent | null>;
  createAgent: (request: AgentCreateRequest) => Promise<Agent | null>;
  updateAgent: (request: AgentUpdateRequest) => Promise<Agent | null>;
  deleteAgent: (agentId: string) => Promise<boolean>;
  chatWithAgent: (request: ChatRequest) => Promise<ChatResponse | null>;
  
  // Workspace actions
  listWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  updateWorkspace: (request: WorkspaceUpdateRequest) => Promise<Workspace | null>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  setSelectedWorkspace: (workspaceId: string | null) => void;
  
  // Agent organization
  moveAgentToWorkspace: (params: MoveAgentToWorkspaceParams) => Promise<Agent | null>;
  
  // Knowledge base actions
  listKnowledgeBases: (workspaceId?: string) => Promise<void>;
  
  // Sync actions
  syncFromGradient: (params?: SyncFromGradientParams) => Promise<SyncFromGradientResponse | null>;
  
  // UI actions
  setSelectedAgent: (agent: Agent | null) => void;
  clearConversation: (agentId: string) => void;
  clearError: () => void;
}
