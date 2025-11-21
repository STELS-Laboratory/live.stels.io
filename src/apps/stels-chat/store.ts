/**
 * Stels Chat Store
 * Zustand store for managing chat state, tabs, models, and files
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
	StelsChatStore,
	ChatTab,
	ChatMessage,
	TrainingFile,
	Assistant,
	CreateAssistantRequest,
	UpdateAssistantRequest,
	ListAssistantsFilters,
	ModelRegistryEntry,
	RegisterModelRequest,
	ListRegisteredModelsRequest, StelsModel,
} from "./types";
import { StelsApiService } from "./lib/stels-api";
import { useAuthStore } from "@/stores/modules/auth.store";

const DEFAULT_API_URL = "https://beta.stels.dev";

/**
 * Get Stels API URL from user configuration
 * Uses connectionSession.api from auth store if available
 */
function getStelsApiUrl(): string {
  try {
    const authState = useAuthStore.getState();
    const apiUrl = authState.connectionSession?.api;
    
    if (apiUrl) {
      // Use the API URL from connectionSession
      return apiUrl;
    }
    
    // Fallback to default
    return DEFAULT_API_URL;
  } catch (error) {
    console.warn("[StelsChat] Failed to get API URL from auth store:", error);
    return DEFAULT_API_URL;
  }
}

/**
 * Get session and token from user configuration
 * Uses connectionSession from auth store if available
 */
function getSessionCredentials(): { session?: string; token?: string } {
  try {
    const authState = useAuthStore.getState();
    const connectionSession = authState.connectionSession;
    
    if (connectionSession) {
      return {
        session: connectionSession.session,
        token: connectionSession.token,
      };
    }
    
    return {};
  } catch (error) {
    console.warn("[StelsChat] Failed to get session from auth store:", error);
    return {};
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Stels Chat Zustand Store
 */
export const useStelsChatStore = create<StelsChatStore>()(
  devtools(
    persist(
      (set, get) => {
        let apiService: StelsApiService | null = null;

        const getApiService = (): StelsApiService => {
          // Get URL from user configuration (connectionSession) or fallback to store value
          const apiUrl = getStelsApiUrl();
          // Get session credentials from user configuration
          const { session, token } = getSessionCredentials();
          
          console.log("[StelsChatStore] Creating API service:", {
            apiUrl,
            hasSession: !!session,
            hasToken: !!token,
            sessionPreview: session ? session.substring(0, 10) + "..." : "none",
          });
          
          // Always create new service to ensure URL and credentials are up to date
          apiService = new StelsApiService(apiUrl, session, token);
          return apiService;
        };

        return {
          // Initial state
          tabs: [],
          activeTabId: null,
          models: [],
          registeredModels: [],
          assistants: [],
          trainingFiles: [],
          stelsApiUrl: getStelsApiUrl(),
          isConnected: false,
          isLoading: false,
          error: null,

          // Tabs management
          createTab: (title?: string): string => {
            const tabId = generateId();
            const newTab: ChatTab = {
              id: tabId,
              title: title || `Chat ${get().tabs.length + 1}`,
              messages: [],
              model: get().models[0]?.name || "",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              contextFiles: [],
            };

            set((state) => ({
              tabs: [...state.tabs, newTab],
              activeTabId: tabId,
            }));

            return tabId;
          },

          closeTab: (tabId: string): void => {
            set((state) => {
              const newTabs = state.tabs.filter((tab) => tab.id !== tabId);
              const newActiveTabId =
                state.activeTabId === tabId
                  ? newTabs.length > 0
                    ? newTabs[newTabs.length - 1].id
                    : null
                  : state.activeTabId;

              return {
                tabs: newTabs,
                activeTabId: newActiveTabId,
              };
            });
          },

          setActiveTab: (tabId: string): void => {
            set({ activeTabId: tabId });
          },

          updateTabTitle: (tabId: string, title: string): void => {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId ? { ...tab, title, updatedAt: Date.now() } : tab,
              ),
            }));
          },

          // Messages
          addMessage: (
            tabId: string,
            message: Omit<ChatMessage, "id" | "timestamp">,
          ): void => {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      messages: [
                        ...tab.messages,
                        {
                          ...message,
                          id: generateId(),
                          timestamp: Date.now(),
                        },
                      ],
                      updatedAt: Date.now(),
                    }
                  : tab,
              ),
            }));
          },

          // Update streaming message
          updateStreamingMessage: (
            tabId: string,
            messageId: string,
            updates: {
              content?: string;
              thinking?: string;
              isStreaming?: boolean;
            },
          ): void => {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      messages: tab.messages.map((msg) =>
                        msg.id === messageId
                          ? {
                              ...msg,
                              content: updates.content ?? msg.content,
                              thinking: updates.thinking ?? msg.thinking,
                              isStreaming: updates.isStreaming ?? msg.isStreaming,
                            }
                          : msg,
                      ),
                      updatedAt: Date.now(),
                    }
                  : tab,
              ),
            }));
          },

          clearMessages: (tabId: string): void => {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? { ...tab, messages: [], updatedAt: Date.now() }
                  : tab,
              ),
            }));
          },

          // Models
          fetchModels: async (): Promise<void> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const models = await service.getModels();
              set({ models, isLoading: false, isConnected: true });

              // Auto-select first model for tabs without a model
              if (models.length > 0) {
                const state = get();
                const firstModel = models[0];
                const tabsWithoutModel = state.tabs.filter(
                  (tab) => !tab.model || tab.model.trim() === "",
                );

                if (tabsWithoutModel.length > 0 && firstModel) {
                  set((currentState) => ({
                    tabs: currentState.tabs.map((tab) =>
                      !tab.model || tab.model.trim() === ""
                        ? { ...tab, model: firstModel.name, updatedAt: Date.now() }
                        : tab,
                    ),
                  }));
                  console.log(
                    `[StelsChatStore] Auto-selected model "${firstModel.name}" for ${tabsWithoutModel.length} tab(s)`,
                  );
                }
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Failed to fetch models";
              set({
                error: errorMessage,
                isLoading: false,
                isConnected: false,
              });
            }
          },

          selectModel: (tabId: string, modelName: string): void => {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? { ...tab, model: modelName, updatedAt: Date.now() }
                  : tab,
              ),
            }));
          },

          // Files
          uploadFile: async (
            file: File,
            type: TrainingFile["type"],
          ): Promise<TrainingFile> => {
            const trainingFile: TrainingFile = {
              id: generateId(),
              name: file.name,
              size: file.size,
              type,
              uploadedAt: Date.now(),
            };

            // For context files, read content
            if (type === "context") {
              const content = await file.text();
              trainingFile.content = content;
            }

            set((state) => ({
              trainingFiles: [...state.trainingFiles, trainingFile],
            }));

            return trainingFile;
          },

          deleteFile: (fileId: string): void => {
            set((state) => ({
              trainingFiles: state.trainingFiles.filter(
                (file) => file.id !== fileId,
              ),
              tabs: state.tabs.map((tab) => ({
                ...tab,
                contextFiles: tab.contextFiles.filter(
                  (fileName) =>
                    !state.trainingFiles.find(
                      (f) => f.id === fileId && f.name === fileName,
                    ),
                ),
              })),
            }));
          },

          attachFileToTab: (tabId: string, fileId: string): void => {
            const state = get();
            const file = state.trainingFiles.find((f) => f.id === fileId);
            if (!file) return;

            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      contextFiles: tab.contextFiles.includes(file.name)
                        ? tab.contextFiles
                        : [...tab.contextFiles, file.name],
                      updatedAt: Date.now(),
                    }
                  : tab,
              ),
            }));
          },

          detachFileFromTab: (tabId: string, fileId: string): void => {
            const state = get();
            const file = state.trainingFiles.find((f) => f.id === fileId);
            if (!file) return;

            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      contextFiles: tab.contextFiles.filter(
                        (name) => name !== file.name,
                      ),
                      updatedAt: Date.now(),
                    }
                  : tab,
              ),
            }));
          },

          // API
          sendMessage: async (tabId: string, message: string): Promise<void> => {
            const state = get();
            const tab = state.tabs.find((t) => t.id === tabId);
            if (!tab || !tab.model) {
              throw new Error("Tab not found or no model selected");
            }

            // Get assistant configuration if selected
            const assistant = tab.assistantId
              ? state.assistants.find((a) => a.id === tab.assistantId)
              : null;

            // Add user message
            get().addMessage(tabId, {
              role: "user",
              content: message,
              model: tab.model,
            });

            set({ isLoading: true, error: null });

            try {
              const service = getApiService();

              // Prepare messages for API
              const apiMessages: Array<{ role: string; content: string }> = [];

              // Add system prompt from assistant if available
              if (assistant?.systemPrompt) {
                apiMessages.push({
                  role: "system",
                  content: assistant.systemPrompt,
                });
              }

              // Add conversation history (excluding system messages)
              const conversationMessages = tab.messages
                .filter((msg) => msg.role !== "system")
                .map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                }));
              apiMessages.push(...conversationMessages);

              // Add context from files if any
              let contextContent = "";
              if (tab.contextFiles.length > 0) {
                const currentState = get();
                const contextFiles = currentState.trainingFiles.filter((f) =>
                  tab.contextFiles.includes(f.name),
                );
                contextContent = contextFiles
                  .map((f) => `[Context from ${f.name}]:\n${f.content || ""}`)
                  .join("\n\n");
              }

              // Add user message
              apiMessages.push({
                role: "user",
                content: contextContent
                  ? `${contextContent}\n\nUser question: ${message}`
                  : message,
              });

              // Create assistant message immediately for streaming
              const assistantMessageId = generateId();
              get().addMessage(tabId, {
                role: "assistant",
                content: "",
                thinking: "",
                model: tab.model,
                isStreaming: true,
              });

              // Get the message ID from the last message (just added)
              const currentState = get();
              const currentTab = currentState.tabs.find((t) => t.id === tabId);
              const streamingMessageId =
                currentTab?.messages[currentTab.messages.length - 1]?.id ||
                assistantMessageId;

              // Stream response with assistant options if available
              let fullResponse = "";
              let fullThinking = "";

              const streamOptions = assistant?.options
                ? {
                    temperature: assistant.options.temperature,
                    top_p: assistant.options.top_p,
                    top_k: assistant.options.top_k,
                    num_predict: assistant.options.num_predict,
                    repeat_penalty: assistant.options.repeat_penalty,
                    seed: assistant.options.seed,
                    stop: assistant.options.stop,
                  }
                : undefined;

              for await (const chunk of service.streamChat(
                tab.model,
                apiMessages,
                streamOptions,
              )) {
                // Handle both response formats:
                // - Old format: chunk.response
                // - New format: chunk.message.content
                if (chunk.response) {
                  fullResponse += chunk.response;
                  get().updateStreamingMessage(tabId, streamingMessageId, {
                    content: fullResponse,
                    isStreaming: !chunk.done,
                  });
                } else if (chunk.message?.content) {
                  fullResponse += chunk.message.content;
                  get().updateStreamingMessage(tabId, streamingMessageId, {
                    content: fullResponse,
                    isStreaming: !chunk.done,
                  });
                }

                // Handle thinking
                if (chunk.message?.thinking) {
                  fullThinking += chunk.message.thinking;
                  get().updateStreamingMessage(tabId, streamingMessageId, {
                    thinking: fullThinking,
                    isStreaming: !chunk.done,
                  });
                }

                if (chunk.done) {
                  // Mark as complete
                  get().updateStreamingMessage(tabId, streamingMessageId, {
                    isStreaming: false,
                  });
                  break;
                }
              }

              set({ isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to send message";
              set({ error: errorMessage, isLoading: false });

              // Add error message to chat
              get().addMessage(tabId, {
                role: "assistant",
                content: `Error: ${errorMessage}`,
                model: tab.model,
              });
            }
          },

          testConnection: async (): Promise<boolean> => {
            try {
              const service = getApiService();
              const connected = await service.testConnection();
              set({ isConnected: connected });
              return connected;
            } catch {
              set({ isConnected: false });
              return false;
            }
          },

          setApiUrl: (url: string): void => {
            set({ stelsApiUrl: url });
            apiService = null; // Reset service to use new URL
          },

          // State
          setLoading: (loading: boolean): void => {
            set({ isLoading: loading });
          },

          setError: (error: string | null): void => {
            set({ error });
          },

          // Assistants
          fetchAssistants: async (
            filters?: ListAssistantsFilters,
          ): Promise<void> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const authState = useAuthStore.getState();
              const networkId = authState.connectionSession?.network || "testnet";
              const assistants = await service.listAssistants(filters, networkId);
              set({ assistants, isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to fetch assistants";
              set({ error: errorMessage, isLoading: false });
            }
          },

          createAssistant: async (
            config: CreateAssistantRequest,
          ): Promise<Assistant> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const authState = useAuthStore.getState();
              const networkId = authState.connectionSession?.network || "testnet";
              const assistant = await service.createAssistant(config, networkId);
              // Refresh assistants list
              await get().fetchAssistants();
              set({ isLoading: false });
              return assistant;
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to create assistant";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          updateAssistant: async (
            config: UpdateAssistantRequest,
          ): Promise<Assistant> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const authState = useAuthStore.getState();
              const networkId = authState.connectionSession?.network || "testnet";
              const assistant = await service.updateAssistant(config, networkId);
              // Refresh assistants list
              await get().fetchAssistants();
              set({ isLoading: false });
              return assistant;
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to update assistant";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          deleteAssistant: async (assistantId: string): Promise<void> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const authState = useAuthStore.getState();
              const networkId = authState.connectionSession?.network || "testnet";
              await service.deleteAssistant(assistantId, networkId);
              // Refresh assistants list
              await get().fetchAssistants();
              set({ isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to delete assistant";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          getAssistant: async (assistantId: string): Promise<Assistant> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const authState = useAuthStore.getState();
              const networkId = authState.connectionSession?.network || "testnet";
              const assistant = await service.getAssistant(assistantId, networkId);
              set({ isLoading: false });
              return assistant;
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to get assistant";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          selectAssistant: (tabId: string, assistantId: string): void => {
            const state = get();
            const assistant = state.assistants.find((a) => a.id === assistantId);
            if (!assistant) return;

            // Update tab with assistant configuration
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      assistantId: assistant.id,
                      model: assistant.model,
                      updatedAt: Date.now(),
                    }
                  : tab,
              ),
            }));
          },

          // Model Registry
          stelsListModels: async (): Promise<StelsModel[]> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const models = await service.stelsListModels();
              set({ isLoading: false });
              return models;
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to list models from Ollama";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          stelsPullModel: async (modelName: string): Promise<void> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              await service.stelsPullModel(modelName);
              // Refresh registered models after pull (auto-registration for developers)
              await get().listRegisteredModels();
              set({ isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to pull model";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          registerModel: async (
            config: RegisterModelRequest,
          ): Promise<ModelRegistryEntry> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const model = await service.registerModel(config);
              // Refresh registered models list
              await get().listRegisteredModels();
              set({ isLoading: false });
              return model;
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to register model";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          unregisterModel: async (modelName: string): Promise<void> => {
            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              await service.unregisterModel(modelName);
              // Refresh registered models list
              await get().listRegisteredModels();
              set({ isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to unregister model";
              set({ error: errorMessage, isLoading: false });
              throw error;
            }
          },

          listRegisteredModels: async (
            filters?: ListRegisteredModelsRequest,
          ): Promise<void> => {
            // Check if user is developer before attempting to list registered models
            const authState = useAuthStore.getState();
            const isDeveloper = authState.connectionSession?.developer || false;
            
            if (!isDeveloper) {
              // Don't set error for non-developers, just silently skip
              console.log("[StelsChat] listRegisteredModels skipped: user is not a developer");
              return;
            }

            set({ isLoading: true, error: null });
            try {
              const service = getApiService();
              const models = await service.listRegisteredModels(filters);
              set({ registeredModels: models, isLoading: false });
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to list registered models";
              // Only set error for developers
              if (isDeveloper) {
                set({ error: errorMessage, isLoading: false });
              } else {
                // Silently fail for non-developers
                set({ isLoading: false });
              }
            }
          },
        };
      },
      {
        name: "stels-chat-store",
        partialize: (state) => ({
          tabs: state.tabs,
          activeTabId: state.activeTabId,
          trainingFiles: state.trainingFiles,
          stelsApiUrl: state.stelsApiUrl,
          registeredModels: state.registeredModels,
        }),
      },
    ),
    { name: "StelsChatStore" },
  ),
);

