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

/** Permission scopes for agent–account links (OpenAPI PermissionScope) */
export type PermissionScope =
  // Core scopes (recommended)
  | "read"        // Read balance and positions
  | "trade"       // Create/cancel orders (required for strategies)
  | "write"       // General write access
  | "withdraw"    // Withdraw funds
  | "transfer"    // Transfer between accounts
  | "admin"       // Full access
  // Trading aliases (supported for backward compatibility)
  | "trading:read"    // alias for read
  | "trading:write"   // alias for trade
  | "trading:withdraw"
  // IoT domain
  | "iot:read"
  | "iot:write"
  | "iot:control"
  // Drone domain
  | "drone:read"
  | "drone:control"
  | "drone:arm"
  | "drone:emergency"
  // Social domain
  | "social:read"
  | "social:post"
  | "social:dm";

/** Linked account with granted scopes and optional limits */
export interface ConnectedAccountRef {
  accountId: string;
  grantedScopes?: PermissionScope[];
  limits?: Record<string, unknown>;
}

/** Grouped permission scopes for UI */
export const PERMISSION_SCOPES: {
  value: PermissionScope;
  label: string;
  description?: string;
  group: "Trading" | "IoT" | "Drone" | "Social" | "General";
}[] = [
  // Trading scopes (recommended for strategies)
  { value: "read", label: "Read", description: "Read balance and positions", group: "Trading" },
  { value: "trade", label: "Trade", description: "Create/cancel orders (required for strategies)", group: "Trading" },
  { value: "withdraw", label: "Withdraw", description: "Withdraw funds", group: "Trading" },
  { value: "transfer", label: "Transfer", description: "Transfer between accounts", group: "Trading" },
  // IoT scopes
  { value: "iot:read", label: "Read", group: "IoT" },
  { value: "iot:write", label: "Write", group: "IoT" },
  { value: "iot:control", label: "Control", group: "IoT" },
  // Drone scopes
  { value: "drone:read", label: "Read", group: "Drone" },
  { value: "drone:control", label: "Control", group: "Drone" },
  { value: "drone:arm", label: "Arm", group: "Drone" },
  { value: "drone:emergency", label: "Emergency", group: "Drone" },
  // Social scopes
  { value: "social:read", label: "Read", group: "Social" },
  { value: "social:post", label: "Post", group: "Social" },
  { value: "social:dm", label: "DM", group: "Social" },
  // General scopes
  { value: "write", label: "Write", description: "General write access", group: "General" },
  { value: "admin", label: "Admin", description: "Full access", group: "General" },
];

/** Trading scopes that allow order execution (used to filter eligible agents for strategies) */
export const TRADE_CAPABLE_SCOPES: PermissionScope[] = ["trade", "trading:write"];

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
  /** @deprecated Prefer connectedAccounts; used when backend returns only ids */
  connectedAccountIds?: string[];
  /** Linked accounts with granted scopes and limits */
  connectedAccounts?: ConnectedAccountRef[];
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
  description?: string;
  status?: AgentStatus;
  config?: AgentConfig;
  systemPrompt?: string;
  model?: string;
  modelConfig?: ModelConfig;
  knowledgeBases?: string[];
  /** For backward compatibility: list of linked account ids */
  connectedAccountIds?: string[];
  /** Full linked accounts with grantedScopes and limits (preferred when backend supports) */
  connectedAccounts?: ConnectedAccountRef[];
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

// Conversation History Types
export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  messages: ChatMessage[];
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationListItem {
  id: string;
  agentId: string;
  userId: string;
  messageCount: number;
  lastMessage?: {
    role: string;
    content: string;
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface GetConversationParams {
  conversationId: string;
}

export interface GetConversationResponse {
  success: boolean;
  conversation: Conversation;
  error?: string;
}

export interface ListConversationsParams {
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface ListConversationsResponse {
  success: boolean;
  conversations: ConversationListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  error?: string;
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

// ============================================================================
// Task Types - Autonomous task management for agents
// ============================================================================

/** Task trigger types */
export type TriggerType = "manual" | "scheduled" | "event" | "condition" | "webhook" | "chain";

/** Task trigger configuration */
export interface TaskTrigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

/** Task action configuration */
export interface TaskAction {
  type: string;
  accountId: string;
  parameters: Record<string, unknown>;
  timeout?: number;
}

/** Task condition for execution */
export interface TaskCondition {
  field: string;
  operator: string;
  value: unknown;
  source?: string;
}

/** Task approval configuration */
export interface TaskApproval {
  required: boolean;
  approvers?: string[];
  timeout?: number;
}

/** Task execution limits */
export interface TaskLimits {
  maxExecutions?: number;
  maxExecutionsPerHour?: number;
  maxExecutionsPerDay?: number;
  cooldownMs?: number;
  // Domain-specific limits can be added via Record
  [key: string]: unknown;
}

/** Task execution status */
export type TaskStatus =
  | "pending"
  | "scheduled"
  | "waiting_approval"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

/** Task entity from backend */
export interface Task {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  domain: string;
  status: TaskStatus;
  action: TaskAction;
  trigger: TaskTrigger;
  conditions?: TaskCondition[];
  approval?: TaskApproval;
  limits?: TaskLimits;
  priority?: string;
  maxRetries?: number;
  executionCount: number;
  errorCount: number;
  lastExecutedAt?: number;
  nextExecutionAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** Task execution log entry */
export interface TaskExecutionLog {
  id: string;
  taskId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  triggeredBy?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  result?: unknown;
  error?: string;
}

// Task Request Types

export interface CreateTaskRequest {
  name: string;
  description?: string;
  agentId: string;
  domain: string;
  action: TaskAction;
  trigger: TaskTrigger;
  conditions?: TaskCondition[];
  approval?: TaskApproval;
  limits?: TaskLimits;
  priority?: string;
  maxRetries?: number;
}

export interface UpdateTaskRequest {
  taskId: string;
  name?: string;
  description?: string;
  action?: Partial<TaskAction> & { type: string; parameters: Record<string, unknown> };
  trigger?: TaskTrigger;
  conditions?: TaskCondition[];
  approval?: TaskApproval;
  limits?: TaskLimits;
  priority?: string;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface ListTasksRequest {
  agentId?: string;
  status?: TaskStatus;
  domain?: string;
  limit?: number;
  offset?: number;
}

export interface ExecuteTaskRequest {
  taskId: string;
  context?: Record<string, unknown>;
  skipApproval?: boolean;
}

export interface ApproveTaskRequest {
  taskId: string;
  approved?: boolean;
  approvedBy: string;
  reason?: string;
}

export interface TaskHistoryRequest {
  taskId: string;
  limit?: number;
}

// Task Response Types

export interface ListTasksResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TaskResponse {
  success: boolean;
  task: Task;
  sid?: string;
}

export interface ExecuteTaskResponse {
  success: boolean;
  executionId: string;
  status: "completed" | "failed";
  result?: unknown;
  error?: string;
  duration: number;
}

export interface ApproveTaskResponse {
  success: boolean;
  taskId: string;
  approved: boolean;
  approvedBy: string;
  newStatus: string;
  reason?: string;
}

export interface PauseTaskResponse {
  success: boolean;
  taskId: string;
  paused: boolean;
  previousStatus: string;
}

export interface ResumeTaskResponse {
  success: boolean;
  taskId: string;
  resumed: boolean;
  status: string;
}

export interface DeleteTaskResponse {
  success: boolean;
  deleted: boolean;
  taskId: string;
}

export interface TaskHistoryResponse {
  success: boolean;
  taskId: string;
  history: TaskExecutionLog[];
  total: number;
}

/** Task action types grouped by domain */
export const TASK_ACTION_TYPES: {
  value: string;
  label: string;
  domain: AgentDomain;
}[] = [
  // Trading
  { value: "trading:create_order", label: "Create Order", domain: "trading" },
  { value: "trading:cancel_order", label: "Cancel Order", domain: "trading" },
  { value: "trading:modify_order", label: "Modify Order", domain: "trading" },
  { value: "trading:close_position", label: "Close Position", domain: "trading" },
  { value: "trading:fetch_balance", label: "Fetch Balance", domain: "trading" },
  { value: "trading:fetch_positions", label: "Fetch Positions", domain: "trading" },
  { value: "trading:fetch_open_orders", label: "Fetch Open Orders", domain: "trading" },
  { value: "trading:set_leverage", label: "Set Leverage", domain: "trading" },
  { value: "trading:transfer_funds", label: "Transfer Funds", domain: "trading" },
  // IoT
  { value: "iot:send_command", label: "Send Command", domain: "iot" },
  { value: "iot:set_state", label: "Set State", domain: "iot" },
  { value: "iot:read_sensor", label: "Read Sensor", domain: "iot" },
  // Drone
  { value: "drone:takeoff", label: "Takeoff", domain: "drone" },
  { value: "drone:land", label: "Land", domain: "drone" },
  { value: "drone:goto", label: "Go To", domain: "drone" },
  { value: "drone:return_home", label: "Return Home", domain: "drone" },
  { value: "drone:patrol", label: "Patrol", domain: "drone" },
  { value: "drone:emergency_stop", label: "Emergency Stop", domain: "drone" },
  // Social
  { value: "social:post", label: "Post", domain: "social" },
  { value: "social:reply", label: "Reply", domain: "social" },
  { value: "social:dm", label: "Direct Message", domain: "social" },
  // Notifications
  { value: "notify:send", label: "Send Notification", domain: "general" },
  { value: "notify:alert", label: "Send Alert", domain: "general" },
  // Custom
  { value: "custom", label: "Custom Action", domain: "general" },
];

/** Task trigger type labels */
export const TASK_TRIGGER_TYPES: {
  value: TriggerType;
  label: string;
  description: string;
}[] = [
  { value: "manual", label: "Manual", description: "Execute manually on demand" },
  { value: "scheduled", label: "Scheduled", description: "Run on a schedule (cron or interval)" },
  { value: "event", label: "Event", description: "Trigger on specific events" },
  { value: "condition", label: "Condition", description: "Execute when conditions are met" },
  { value: "webhook", label: "Webhook", description: "Trigger via HTTP webhook" },
  { value: "chain", label: "Chain", description: "Part of a task chain" },
];

/** Task status labels and colors */
export const TASK_STATUS_CONFIG: {
  value: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { value: "pending", label: "Pending", color: "text-gray-500", bgColor: "bg-gray-100" },
  { value: "scheduled", label: "Scheduled", color: "text-blue-500", bgColor: "bg-blue-100" },
  { value: "waiting_approval", label: "Waiting Approval", color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { value: "running", label: "Running", color: "text-green-500", bgColor: "bg-green-100" },
  { value: "completed", label: "Completed", color: "text-emerald-500", bgColor: "bg-emerald-100" },
  { value: "failed", label: "Failed", color: "text-red-500", bgColor: "bg-red-100" },
  { value: "cancelled", label: "Cancelled", color: "text-gray-400", bgColor: "bg-gray-100" },
  { value: "timeout", label: "Timeout", color: "text-orange-500", bgColor: "bg-orange-100" },
];

export interface MoveAgentToWorkspaceResponse {
  success: boolean;
  message: string;
  agent: Agent;
}

// ============================================================================
// Agent-Account Binding Types
// ============================================================================

/** Request params for connecting an account to an agent */
export interface ConnectAccountToAgentParams {
  agentId: string;
  accountId: string;
  grantedScopes: PermissionScope[];
}

/** Response from connectAccountToAgent */
export interface ConnectAccountToAgentResponse {
  success: boolean;
  message?: string;
  agent?: Agent;
  error?: string;
}

/** Request params for disconnecting an account from an agent */
export interface DisconnectAccountFromAgentParams {
  agentId: string;
  accountId: string;
}

/** Response from disconnectAccountFromAgent */
export interface DisconnectAccountFromAgentResponse {
  success: boolean;
  message?: string;
  agent?: Agent;
  error?: string;
}

// ============================================================================
// Orchestration Types
// ============================================================================

export type CollaborationType = "sequential" | "parallel" | "hierarchical" | "peer";

export interface RouteToAgentsParams {
  message: string;
  agentIds?: string[];
  domain?: AgentDomain;
  context?: Record<string, unknown>;
  waitForAll?: boolean;
  timeout?: number;
}

export interface RouteToAgentsResponse {
  success: boolean;
  responses?: Array<{
    agentId: string;
    success: boolean;
    response?: string;
    error?: string;
    duration?: number;
  }>;
  error?: string;
}

export interface StartCollaborationParams {
  name: string;
  agentIds: string[];
  type: CollaborationType;
  context?: Record<string, unknown>;
}

export interface StartCollaborationResponse {
  success: boolean;
  collaborationId?: string;
  error?: string;
}

export interface SendAgentMessageParams {
  fromAgentId: string;
  toAgentId: string;
  type?: "request" | "response" | "notification" | "event";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SendAgentMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EndCollaborationParams {
  collaborationId: string;
  reason?: string;
}

export interface EndCollaborationResponse {
  success: boolean;
  error?: string;
}

export interface OrchestratorStats {
  activeInstances?: number;
  totalMessages?: number;
  activeCollaborations?: number;
}

export interface GetOrchestratorStatsResponse {
  success: boolean;
  stats?: OrchestratorStats;
  error?: string;
}

// ============================================================================
// Realtime Types
// ============================================================================

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTask?: string;
  lastActivity?: number;
  memory?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface GetAgentStateParams {
  agentId: string;
}

export interface GetAgentStateResponse {
  success: boolean;
  state?: AgentState;
  error?: string;
}

export interface GetDomainDataParams {
  domain: AgentDomain;
  accountId?: string;
  dataType?: string;
  filters?: Record<string, unknown>;
}

export interface GetDomainDataResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// setTrigger types
export type RealtimeTriggerType = "kv" | "schedule" | "event" | "condition";

export interface SetTriggerParams {
  id?: string;
  type: RealtimeTriggerType;
  enabled?: boolean;
  // KV trigger config
  keyPattern?: string[];
  onChange?: boolean;
  debounceMs?: number;
  // Schedule trigger config
  cron?: string;
  intervalMs?: number;
  timezone?: string;
  // Event trigger config
  eventType?: string;
  eventSource?: string;
  filter?: Record<string, unknown>;
  // Condition trigger config
  expression?: string;
  checkIntervalMs?: number;
  // Action config
  taskId?: string;
  chainId?: string;
}

export interface SetTriggerResponse {
  success: boolean;
  triggerId?: string;
  trigger?: SetTriggerParams & { id: string };
  error?: string;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface CreateKnowledgeBaseParams {
  workspaceId: string;
  name: string;
  description?: string;
  settings?: {
    chunkSize?: number;
    chunkOverlap?: number;
    embeddingModel?: string;
  };
}

export interface CreateKnowledgeBaseResponse {
  success: boolean;
  knowledgeBase?: KnowledgeBase;
  error?: string;
}

export interface DeleteKnowledgeBaseParams {
  knowledgeBaseId: string;
}

export interface DeleteKnowledgeBaseResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
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
  conversationList: ConversationListItem[];
  lastSyncTime: number | null;
  
  // Task state
  tasks: Task[];
  selectedTask: Task | null;
  taskHistory: TaskExecutionLog[];
  
  // Loading states
  agentsLoading: boolean;
  agentLoading: boolean;
  chatLoading: boolean;
  conversationLoading: boolean;
  syncLoading: boolean;
  workspaceLoading: boolean;
  tasksLoading: boolean;
  taskExecuting: boolean;
  accountLinking: boolean;
  
  // Errors
  agentsError: string | null;
  chatError: string | null;
  tasksError: string | null;
  
  // Actions
  listAgents: () => Promise<void>;
  getAgent: (agentId: string) => Promise<Agent | null>;
  createAgent: (request: AgentCreateRequest) => Promise<Agent | null>;
  updateAgent: (request: AgentUpdateRequest) => Promise<Agent | null>;
  deleteAgent: (agentId: string) => Promise<boolean>;
  chatWithAgent: (request: ChatRequest) => Promise<ChatResponse | null>;
  
  // Conversation History Actions
  getConversation: (params: GetConversationParams) => Promise<Conversation | null>;
  listConversations: (params?: ListConversationsParams) => Promise<void>;
  loadConversationForAgent: (agentId: string) => Promise<void>;
  
  // Workspace actions
  listWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  updateWorkspace: (request: WorkspaceUpdateRequest) => Promise<Workspace | null>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  setSelectedWorkspace: (workspaceId: string | null) => void;
  
  // Agent organization
  moveAgentToWorkspace: (params: MoveAgentToWorkspaceParams) => Promise<Agent | null>;
  
  // Agent-Account binding
  connectAccountToAgent: (params: ConnectAccountToAgentParams) => Promise<boolean>;
  disconnectAccountFromAgent: (params: DisconnectAccountFromAgentParams) => Promise<boolean>;
  
  // Knowledge base actions
  listKnowledgeBases: (workspaceId?: string) => Promise<void>;
  createKnowledgeBase: (params: CreateKnowledgeBaseParams) => Promise<KnowledgeBase | null>;
  deleteKnowledgeBase: (params: DeleteKnowledgeBaseParams) => Promise<boolean>;
  
  // Sync actions
  syncFromGradient: (params?: SyncFromGradientParams) => Promise<SyncFromGradientResponse | null>;
  
  // Task actions
  listTasks: (params?: ListTasksRequest) => Promise<void>;
  getTask: (taskId: string) => Promise<Task | null>;
  createTask: (request: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (request: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  executeTask: (request: ExecuteTaskRequest) => Promise<ExecuteTaskResponse | null>;
  approveTask: (request: ApproveTaskRequest) => Promise<ApproveTaskResponse | null>;
  pauseTask: (taskId: string) => Promise<PauseTaskResponse | null>;
  resumeTask: (taskId: string) => Promise<ResumeTaskResponse | null>;
  getTaskHistory: (request: TaskHistoryRequest) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  clearTaskHistory: () => void;
  
  // UI actions
  setSelectedAgent: (agent: Agent | null) => void;
  clearConversation: (agentId: string) => void;
  clearError: () => void;
  
  // Orchestration actions
  routeToAgents: (params: RouteToAgentsParams) => Promise<RouteToAgentsResponse | null>;
  startCollaboration: (params: StartCollaborationParams) => Promise<string | null>;
  sendAgentMessage: (params: SendAgentMessageParams) => Promise<boolean>;
  endCollaboration: (params: EndCollaborationParams) => Promise<boolean>;
  getOrchestratorStats: () => Promise<OrchestratorStats | null>;
  
  // Realtime actions
  getAgentState: (params: GetAgentStateParams) => Promise<AgentState | null>;
  getDomainData: (params: GetDomainDataParams) => Promise<Record<string, unknown> | null>;
  setTrigger: (params: SetTriggerParams) => Promise<string | null>;
}
