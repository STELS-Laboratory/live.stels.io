/**
 * Stels Chat Application Types
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string; // Model's thinking process
  timestamp: number;
  model?: string;
  contextFiles?: string[]; // File names used in context
  isStreaming?: boolean; // Indicates if message is still being streamed
}

export interface ChatTab {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  assistantId?: string; // Selected assistant ID
  createdAt: number;
  updatedAt: number;
  contextFiles: string[]; // Files loaded for context
}

export interface StelsModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  modelfile?: string;
  parameters?: string;
  template?: string;
  system?: string;
  license?: string;
}

export interface ModelConfig {
  name: string;
  baseModel?: string; // Base model to use for fine-tuning
  modelfile: string;
  parameters: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    repeat_penalty?: number;
    seed?: number;
    num_ctx?: number;
    num_thread?: number;
    num_gpu?: number;
    use_mmap?: boolean;
    use_mlock?: boolean;
    numa?: boolean;
  };
  systemPrompt?: string;
  template?: string;
}

export interface TrainingFile {
  id: string;
  name: string;
  size: number;
  type: "training" | "knowledge" | "context";
  uploadedAt: number;
  content?: string; // For context files, store content
}

export interface AssistantOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
}

export interface AssistantMetadata {
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  model: string;
  systemPrompt?: string;
  options?: AssistantOptions;
  metadata?: AssistantMetadata;
  timestamp?: number;
  versionstamp?: string;
}

export interface CreateAssistantRequest {
  name: string;
  description?: string;
  model: string;
  systemPrompt?: string;
  options?: AssistantOptions;
  metadata?: {
    tags?: string[];
  };
}

export interface UpdateAssistantRequest {
  id: string;
  name?: string;
  description?: string;
  model?: string;
  systemPrompt?: string;
  options?: AssistantOptions;
  metadata?: {
    tags?: string[];
  };
}

export interface ListAssistantsFilters {
  model?: string;
  createdBy?: string;
  tags?: string[];
}

/**
 * Model Registry Types
 */
export type ModelStatus = "pending" | "downloading" | "ready" | "error";

export interface ModelRegistryMetadata {
  description?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface ModelRegistryEntry {
  name: string;
  registeredBy: string; // Wallet address
  registeredAt: number;
  status: ModelStatus;
  lastChecked?: number;
  error?: string;
  metadata?: ModelRegistryMetadata;
  versionstamp?: string;
}

export interface RegisterModelRequest {
  name: string;
  metadata?: ModelRegistryMetadata;
}

export interface UnregisterModelRequest {
  name: string;
}

export interface ListRegisteredModelsRequest {
  status?: ModelStatus;
  registeredBy?: string;
}

export interface StelsApiResponse<T = unknown> {
  model?: string;
  created_at?: string;
  response?: string;
  done?: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  message?: {
    role: string;
    content: string;
    thinking?: string;
  };
  error?: string;
  data?: T;
}

export interface StelsChatState {
  tabs: ChatTab[];
  activeTabId: string | null;
  models: StelsModel[];
  registeredModels: ModelRegistryEntry[];
  assistants: Assistant[];
  trainingFiles: TrainingFile[];
  stelsApiUrl: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface StelsChatActions {
  // Tabs management
  createTab: (title?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;

  // Messages
  addMessage: (tabId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateStreamingMessage: (
    tabId: string,
    messageId: string,
    updates: {
      content?: string;
      thinking?: string;
      isStreaming?: boolean;
    },
  ) => void;
  clearMessages: (tabId: string) => void;

  // Models
  fetchModels: () => Promise<void>;
  selectModel: (tabId: string, modelName: string) => void;
  createModel: (config: ModelConfig) => Promise<void>;
  deleteModel: (modelName: string) => Promise<void>;

  // Model Registry
  stelsListModels: () => Promise<StelsModel[]>;
  stelsPullModel: (modelName: string) => Promise<void>;
  registerModel: (config: RegisterModelRequest) => Promise<ModelRegistryEntry>;
  unregisterModel: (modelName: string) => Promise<void>;
  listRegisteredModels: (filters?: ListRegisteredModelsRequest) => Promise<void>;

  // Assistants
  fetchAssistants: (filters?: ListAssistantsFilters) => Promise<void>;
  createAssistant: (config: CreateAssistantRequest) => Promise<Assistant>;
  updateAssistant: (config: UpdateAssistantRequest) => Promise<Assistant>;
  deleteAssistant: (assistantId: string) => Promise<void>;
  getAssistant: (assistantId: string) => Promise<Assistant>;
  selectAssistant: (tabId: string, assistantId: string) => void;

  // Files
  uploadFile: (file: File, type: TrainingFile["type"]) => Promise<TrainingFile>;
  deleteFile: (fileId: string) => void;
  attachFileToTab: (tabId: string, fileId: string) => void;
  detachFileFromTab: (tabId: string, fileId: string) => void;

  // API
  sendMessage: (tabId: string, message: string) => Promise<void>;
  testConnection: () => Promise<boolean>;
  setApiUrl: (url: string) => void;

  // State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type StelsChatStore = StelsChatState & StelsChatActions;

