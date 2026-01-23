/**
 * Agent Control application store
 * Manages AI Agents state via RPC calls
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";
import type {
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentStore,
  AgentDeploymentStatus,
  DeploymentStatus,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  KnowledgeBase,
  Workspace,
  WorkspaceUpdateRequest,
  SyncFromGradientParams,
  SyncFromGradientResponse,
  MoveAgentToWorkspaceParams,
  MoveAgentToWorkspaceResponse,
  // Task types
  Task,
  TaskExecutionLog,
  CreateTaskRequest,
  UpdateTaskRequest,
  ListTasksRequest,
  ExecuteTaskRequest,
  ApproveTaskRequest,
  TaskHistoryRequest,
  ListTasksResponse,
  TaskResponse,
  ExecuteTaskResponse,
  ApproveTaskResponse,
  PauseTaskResponse,
  ResumeTaskResponse,
  DeleteTaskResponse,
  TaskHistoryResponse,
  // Agent-Account binding types
  ConnectAccountToAgentParams,
  ConnectAccountToAgentResponse,
  DisconnectAccountFromAgentParams,
  DisconnectAccountFromAgentResponse,
  // Conversation History types
  Conversation,
  ConversationListItem,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsParams,
  ListConversationsResponse,
} from "./types";

/**
 * Extract deployment status from agent metadata
 */
function extractDeploymentStatus(metadata?: Record<string, unknown>): AgentDeploymentStatus | undefined {
  if (!metadata) return undefined;
  
  const deploymentStatus = metadata.deploymentStatus as DeploymentStatus | undefined;
  if (!deploymentStatus) return undefined;

  const isDeployed = deploymentStatus === "STATUS_RUNNING";
  const isDeploying = ["STATUS_DEPLOYING", "STATUS_BUILDING", "STATUS_WAITING_FOR_DEPLOYMENT"].includes(deploymentStatus);
  const isFailed = deploymentStatus === "STATUS_FAILED";

  return {
    deploymentStatus,
    isDeployed,
    isDeploying,
    isFailed,
    deploymentUrl: metadata.deploymentUrl as string | undefined,
    statusMessage: isDeployed 
      ? "Agent is deployed and ready"
      : isDeploying 
      ? "Agent is deploying..."
      : isFailed 
      ? "Deployment failed"
      : deploymentStatus === "STATUS_DISABLED"
      ? "Agent is disabled"
      : deploymentStatus === "STATUS_DELETED"
      ? "Agent is deleted"
      : "Unknown status",
  };
}

/**
 * Transform agent data to include deploymentStatus
 */
function transformAgent(agent: Agent): Agent {
  return {
    ...agent,
    deploymentStatus: extractDeploymentStatus(agent.metadata),
  };
}

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
 * Helper functions for localStorage conversation persistence
 */
function saveConversationId(agentId: string, conversationId: string): void {
  const key = `chat_conversation_${agentId}`;
  try {
    localStorage.setItem(key, conversationId);
  } catch (error) {
    console.warn("[AgentStore] Failed to save conversationId to localStorage:", error);
  }
}

function loadConversationId(agentId: string): string | null {
  const key = `chat_conversation_${agentId}`;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("[AgentStore] Failed to load conversationId from localStorage:", error);
    return null;
  }
}

function removeConversationId(agentId: string): void {
  const key = `chat_conversation_${agentId}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("[AgentStore] Failed to remove conversationId from localStorage:", error);
  }
}

/**
 * Empty params for methods that don't need channel routing
 * Agent/Workspace methods filter by workspaceId in body, not params
 * The backend was interpreting network IDs like "localnet" as workspace names
 */
const NO_CHANNEL: string[] = [];

/**
 * Agent Control Store
 */
export const useAgentStore = create<AgentStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      agents: [],
      selectedAgent: null,
      workspaces: [],
      selectedWorkspaceId: null,
      knowledgeBases: [],
      conversations: new Map(),
      currentConversationId: null,
      conversationList: [],
      lastSyncTime: null,
      
      // Task state
      tasks: [],
      selectedTask: null,
      taskHistory: [],
      
      agentsLoading: false,
      agentLoading: false,
      chatLoading: false,
      conversationLoading: false,
      syncLoading: false,
      workspaceLoading: false,
      tasksLoading: false,
      taskExecuting: false,
      accountLinking: false,
      
      agentsError: null,
      chatError: null,
      tasksError: null,

      // List all agents
      listAgents: async (): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          set({ agentsError: "No active connection", agentsLoading: false });
          return;
        }

        set({ agentsLoading: true, agentsError: null });

        try {
          // Note: Don't send network channel as params - backend interprets it as workspace name
          // Filter by workspace using workspaceId in body if needed
          const data = await client.request<{ agents: Agent[] }>(
            "listAgents",
            {},
            NO_CHANNEL
          );

          if (data && Array.isArray(data.agents)) {
            set({
              agents: data.agents.map(transformAgent),
              agentsLoading: false,
              agentsError: null,
            });
          } else if (data && Array.isArray(data)) {
            set({
              agents: (data as unknown as Agent[]).map(transformAgent),
              agentsLoading: false,
              agentsError: null,
            });
          } else {
            set({
              agents: [],
              agentsLoading: false,
              agentsError: null,
            });
          }
        } catch (error) {
          console.error("Failed to list agents:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch agents";
          set({
            agentsError: errorMessage,
            agentsLoading: false,
          });
          toast.error("Failed to load agents", errorMessage);
        }
      },

      // Get single agent
      getAgent: async (agentId: string): Promise<Agent | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ agentLoading: true });

        try {
          const data = await client.request<{ agent: Agent }>(
            "getAgent",
            { agentId },
            NO_CHANNEL
          );

          set({ agentLoading: false });
          const agent = data?.agent || data as unknown as Agent;
          return transformAgent(agent);
        } catch (error) {
          console.error("Failed to get agent:", error);
          toast.error(
            "Failed to load agent",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ agentLoading: false });
          return null;
        }
      },

      // Create new agent
      createAgent: async (request: AgentCreateRequest): Promise<Agent | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ agentLoading: true });

        try {
          const data = await client.request<{ agent: Agent }>(
            "createAgent",
            request,
            NO_CHANNEL
          );

          const agent = transformAgent(data?.agent || data as unknown as Agent);

          // Add to agents list
          set((state) => ({
            agents: [agent, ...state.agents],
            selectedAgent: agent,
            agentLoading: false,
          }));

          toast.success("Agent created", `${agent.name} is ready`);
          return agent;
        } catch (error) {
          console.error("Failed to create agent:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
          toast.error("Failed to create agent", errorMessage);
          set({ agentLoading: false });
          return null;
        }
      },

      // Update agent
      updateAgent: async (request: AgentUpdateRequest): Promise<Agent | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ agentLoading: true });

        try {
          const data = await client.request<{ agent: Agent }>(
            "updateAgent",
            request,
            NO_CHANNEL
          );

          const agent = transformAgent(data?.agent || data as unknown as Agent);

          // Update agents list
          set((state) => ({
            agents: state.agents.map((a) =>
              a.id === agent.id ? agent : a
            ),
            selectedAgent: state.selectedAgent?.id === agent.id
              ? agent
              : state.selectedAgent,
            agentLoading: false,
          }));

          toast.success("Agent updated", `${agent.name} has been updated`);
          return agent;
        } catch (error) {
          console.error("Failed to update agent:", error);
          toast.error(
            "Failed to update agent",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ agentLoading: false });
          return null;
        }
      },

      // Delete agent
      deleteAgent: async (agentId: string): Promise<boolean> => {
        const client = getApiClient();
        if (!client) return false;

        set({ agentLoading: true });

        try {
          await client.request(
            "deleteAgent",
            { agentId },
            NO_CHANNEL
          );

          // Remove from agents list
          set((state) => ({
            agents: state.agents.filter((a) => a.id !== agentId),
            selectedAgent: state.selectedAgent?.id === agentId
              ? null
              : state.selectedAgent,
            agentLoading: false,
          }));

          // Clear conversation
          const conversations = new Map(get().conversations);
          conversations.delete(agentId);
          set({ conversations });

          toast.success("Agent deleted", "Agent has been removed");
          return true;
        } catch (error) {
          console.error("Failed to delete agent:", error);
          toast.error(
            "Failed to delete agent",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ agentLoading: false });
          return false;
        }
      },

      // Move agent to different workspace
      moveAgentToWorkspace: async (
        params: MoveAgentToWorkspaceParams
      ): Promise<Agent | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ agentLoading: true });

        try {
          const data = await client.request<MoveAgentToWorkspaceResponse>(
            "moveAgentToWorkspace",
            params,
            NO_CHANNEL
          );

          const agent = transformAgent(data?.agent || (data as unknown as Agent));

          if (agent?.id) {
            // Update agents list with new workspaceId
            set((state) => ({
              agents: state.agents.map((a) =>
                a.id === agent.id ? { ...agent, workspaceId: params.workspaceId } : a
              ),
              selectedAgent:
                state.selectedAgent?.id === agent.id
                  ? { ...agent, workspaceId: params.workspaceId }
                  : state.selectedAgent,
              agentLoading: false,
            }));

            toast.success(
              "Agent moved",
              `Agent "${agent.name}" moved to new workspace`
            );
            return agent;
          }

          set({ agentLoading: false });
          return null;
        } catch (error) {
          console.error("Failed to move agent:", error);
          toast.error(
            "Failed to move agent",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ agentLoading: false });
          return null;
        }
      },

      // Connect account to agent with specific permissions
      connectAccountToAgent: async (
        params: ConnectAccountToAgentParams
      ): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Connection failed", "No active connection");
          return false;
        }

        set({ accountLinking: true });

        try {
          const data = await client.request<ConnectAccountToAgentResponse>(
            "connectAccountToAgent",
            params,
            NO_CHANNEL
          );

          if (data?.success) {
            // Refresh the agent to get updated connectedAccounts
            const updatedAgent = await get().getAgent(params.agentId);
            if (updatedAgent) {
              set((state) => ({
                agents: state.agents.map((a) =>
                  a.id === params.agentId ? updatedAgent : a
                ),
                selectedAgent:
                  state.selectedAgent?.id === params.agentId
                    ? updatedAgent
                    : state.selectedAgent,
              }));
            }

            toast.success(
              "Account connected",
              `Account linked to agent with ${params.grantedScopes.length} permission(s)`
            );
            set({ accountLinking: false });
            return true;
          }

          throw new Error(data?.error || "Failed to connect account");
        } catch (error) {
          console.error("[AgentStore] Failed to connect account:", error);
          toast.error(
            "Failed to connect account",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ accountLinking: false });
          return false;
        }
      },

      // Disconnect account from agent
      disconnectAccountFromAgent: async (
        params: DisconnectAccountFromAgentParams
      ): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Connection failed", "No active connection");
          return false;
        }

        set({ accountLinking: true });

        try {
          const data = await client.request<DisconnectAccountFromAgentResponse>(
            "disconnectAccountFromAgent",
            params,
            NO_CHANNEL
          );

          if (data?.success) {
            // Update local state immediately
            set((state) => {
              const updateConnectedAccounts = (agent: Agent): Agent => ({
                ...agent,
                connectedAccounts: agent.connectedAccounts?.filter(
                  (acc) => acc.accountId !== params.accountId
                ),
                connectedAccountIds: agent.connectedAccountIds?.filter(
                  (id) => id !== params.accountId
                ),
              });

              return {
                agents: state.agents.map((a) =>
                  a.id === params.agentId ? updateConnectedAccounts(a) : a
                ),
                selectedAgent:
                  state.selectedAgent?.id === params.agentId
                    ? updateConnectedAccounts(state.selectedAgent)
                    : state.selectedAgent,
                accountLinking: false,
              };
            });

            toast.success("Account disconnected", "Account unlinked from agent");
            return true;
          }

          throw new Error(data?.error || "Failed to disconnect account");
        } catch (error) {
          console.error("[AgentStore] Failed to disconnect account:", error);
          toast.error(
            "Failed to disconnect account",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ accountLinking: false });
          return false;
        }
      },

      // Chat with agent (supports streaming)
      chatWithAgent: async (request: ChatRequest): Promise<ChatResponse | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        if (!connectionSession) return null;

        set({ chatLoading: true, chatError: null });

        // Get conversationId from localStorage if not provided
        const savedConversationId = request.conversationId || loadConversationId(request.agentId);
        const conversationIdToUse = savedConversationId || request.conversationId;

        // Add user message to conversation
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: "user",
          content: request.message,
          timestamp: Date.now(),
        };

        const conversations = new Map(get().conversations);
        const existing = conversations.get(request.agentId) || [];
        conversations.set(request.agentId, [...existing, userMessage]);
        set({ conversations, currentConversationId: conversationIdToUse || null });

        const startTime = Date.now();

        // Streaming mode
        if (request.stream && request.onChunk) {
          // Create placeholder for streaming message
          const streamingMessageId = `msg_${Date.now()}_assistant`;
          let fullContent = "";

          try {
            const response = await fetch(connectionSession.api, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "stels-session": connectionSession.session,
              },
              body: JSON.stringify({
                webfix: "1.0",
                method: "chatWithAgent",
                params: NO_CHANNEL,
                body: {
                  agentId: request.agentId,
                  message: request.message,
                  conversationId: conversationIdToUse,
                  context: request.context,
                  stream: true,
                },
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
              throw new Error("No response body for streaming");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add initial empty assistant message
            const streamConversations = new Map(get().conversations);
            const streamMessages = streamConversations.get(request.agentId) || [];
            streamConversations.set(request.agentId, [
              ...streamMessages,
              {
                id: streamingMessageId,
                role: "assistant" as const,
                content: "",
                timestamp: Date.now(),
              },
            ]);
            set({ conversations: streamConversations });

            // Read stream
            let currentConversationId = conversationIdToUse;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              
              // Parse SSE data
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    
                    // Extract conversationId from chunk if available (per guide)
                    if (parsed.conversationId && !currentConversationId) {
                      currentConversationId = parsed.conversationId;
                      saveConversationId(request.agentId, currentConversationId);
                      set({ currentConversationId });
                    }
                    
                    // Extract content - prioritize delta.content as per guide
                    const delta = parsed.choices?.[0]?.delta;
                    const content = delta?.content || 
                                   parsed.content || 
                                   parsed.chunk || 
                                   "";
                    if (content) {
                      fullContent += content;
                      request.onChunk(content);

                      // Update the streaming message
                      const updateConversations = new Map(get().conversations);
                      const updateMessages = updateConversations.get(request.agentId) || [];
                      const updatedMessages = updateMessages.map((msg) =>
                        msg.id === streamingMessageId
                          ? { ...msg, content: fullContent }
                          : msg
                      );
                      updateConversations.set(request.agentId, updatedMessages);
                      set({ conversations: updateConversations });
                    }
                  } catch {
                    // Non-JSON chunk, treat as raw content
                    if (data.trim()) {
                      fullContent += data;
                      request.onChunk(data);
                    }
                  }
                }
              }
            }

            const latencyMs = Date.now() - startTime;

            // Finalize the message with metadata
            const finalConversations = new Map(get().conversations);
            const finalMessages = finalConversations.get(request.agentId) || [];
            const finalizedMessages = finalMessages.map((msg) =>
              msg.id === streamingMessageId
                ? {
                    ...msg,
                    content: fullContent,
                    metadata: { latencyMs },
                  }
                : msg
            );
            finalConversations.set(request.agentId, finalizedMessages);
            
            // Save conversationId if we got one
            if (currentConversationId) {
              saveConversationId(request.agentId, currentConversationId);
            }
            
            set({
              conversations: finalConversations,
              currentConversationId: currentConversationId || null,
              chatLoading: false,
            });

            return {
              message: fullContent,
              conversationId: currentConversationId || request.conversationId || "",
            };
          } catch (error) {
            console.error("[AgentStore] Streaming chat error:", error);
            const errorMessage = error instanceof Error
              ? error.message
              : "Failed to get response";

            set({ chatError: errorMessage, chatLoading: false });
            return null;
          }
        }

        // Non-streaming mode
        try {
          const client = getApiClient();
          if (!client) {
            set({ chatLoading: false });
            return null;
          }

          const data = await client.request<ChatResponse>(
            "chatWithAgent",
            {
              agentId: request.agentId,
              message: request.message,
              conversationId: conversationIdToUse,
              context: request.context,
            },
            NO_CHANNEL
          );

          const latencyMs = Date.now() - startTime;
          
          // Handle both 'message' and 'response' fields from API
          const responseContent = data.message || data.response || "";
          const tokensUsed = data.tokensUsed || data.usage?.totalTokens;

          // Log agent status for debugging
          if (data.agentStatus) {
            console.log("[AgentStore] Agent status:", data.agentStatus.statusMessage);
          }

          // Add assistant message to conversation
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: "assistant",
            content: responseContent,
            timestamp: Date.now(),
            metadata: {
              tokensUsed,
              latencyMs,
              inferenceMethod: data.inferenceMethod,
              agentStatus: data.agentStatus,
            },
          };

          const updatedConversations = new Map(get().conversations);
          const currentMessages = updatedConversations.get(request.agentId) || [];
          updatedConversations.set(request.agentId, [...currentMessages, assistantMessage]);
          
          // Save conversationId to localStorage
          if (data.conversationId) {
            saveConversationId(request.agentId, data.conversationId);
          }
          
          set({
            conversations: updatedConversations,
            currentConversationId: data.conversationId,
            chatLoading: false,
          });

          // Refresh conversation list to update lastMessage
          get().listConversations({ agentId: request.agentId });

          return { ...data, message: responseContent };
        } catch (error) {
          console.error("[AgentStore] Failed to chat with agent:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Failed to get response";
          
          // Add error message to conversation
          const errorMsg: ChatMessage = {
            id: `msg_${Date.now()}_error`,
            role: "system",
            content: `Error: ${errorMessage}`,
            timestamp: Date.now(),
          };

          const errorConversations = new Map(get().conversations);
          const errorMessages = errorConversations.get(request.agentId) || [];
          errorConversations.set(request.agentId, [...errorMessages, errorMsg]);
          
          set({
            conversations: errorConversations,
            chatError: errorMessage,
            chatLoading: false,
          });
          
          return null;
        }
      },

      // List workspaces
      listWorkspaces: async (): Promise<void> => {
        const client = getApiClient();
        if (!client) return;

        try {
          const data = await client.request<{ workspaces?: Workspace[] } | Workspace[]>(
            "listWorkspaces",
            {},
            NO_CHANNEL
          );

          console.log("[AgentStore] listWorkspaces response:", data);

          let workspaces: Workspace[] = [];
          
          if (data && Array.isArray(data)) {
            workspaces = data as Workspace[];
          } else if (data && typeof data === "object") {
            if (Array.isArray((data as { workspaces?: Workspace[] }).workspaces)) {
              workspaces = (data as { workspaces: Workspace[] }).workspaces;
            }
          }

          // Filter out invalid workspaces (must have id and name)
          workspaces = workspaces.filter((ws) => ws && ws.id && ws.name);

          set({ workspaces });
          console.log("[AgentStore] Workspaces loaded:", workspaces.length);
        } catch (error) {
          console.error("[AgentStore] Failed to list workspaces:", error);
          // Set empty array on error so UI can handle it
          set({ workspaces: [] });
        }
      },

      // Create workspace
      createWorkspace: async (name: string, description?: string): Promise<Workspace | null> => {
        const client = getApiClient();
        if (!client) return null;

        // Get ownerId from the auth session
        const connectionSession = useAuthStore.getState().connectionSession;
        const ownerId = connectionSession?.title || connectionSession?.nid || "default";

        try {
          const data = await client.request<{ workspace?: Workspace } | Workspace>(
            "createWorkspace",
            { name, description, ownerId },
            NO_CHANNEL
          );

          console.log("[AgentStore] createWorkspace response:", data);

          // Handle different response formats
          let workspace: Workspace;
          if (data && typeof data === "object") {
            if ("workspace" in data && data.workspace) {
              workspace = data.workspace;
            } else if ("id" in data && "name" in data) {
              workspace = data as Workspace;
            } else {
              // Create workspace object from response with defaults
              workspace = {
                id: (data as Record<string, unknown>).id as string || `ws_${Date.now()}`,
                name: name, // Use the input name as fallback
                description: description,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
            }
          } else {
            throw new Error("Invalid response from server");
          }

          set((state) => ({
            workspaces: [...state.workspaces, workspace],
          }));

          toast.success("Workspace created", `${workspace.name} is ready`);
          return workspace;
        } catch (error) {
          console.error("[AgentStore] Failed to create workspace:", error);
          toast.error(
            "Failed to create workspace",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Update workspace
      updateWorkspace: async (request: WorkspaceUpdateRequest): Promise<Workspace | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ workspaceLoading: true });

        try {
          const data = await client.request<{ workspace?: Workspace } | Workspace>(
            "updateWorkspace",
            request,
            NO_CHANNEL
          );

          let workspace: Workspace;
          if (data && typeof data === "object") {
            if ("workspace" in data && data.workspace) {
              workspace = data.workspace;
            } else if ("id" in data) {
              workspace = data as Workspace;
            } else {
              throw new Error("Invalid response from server");
            }
          } else {
            throw new Error("Invalid response from server");
          }

          set((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === workspace.id ? workspace : w
            ),
            workspaceLoading: false,
          }));

          toast.success("Workspace updated", `${workspace.name} has been updated`);
          return workspace;
        } catch (error) {
          console.error("[AgentStore] Failed to update workspace:", error);
          set({ workspaceLoading: false });
          toast.error(
            "Failed to update workspace",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Delete workspace
      deleteWorkspace: async (workspaceId: string): Promise<boolean> => {
        const client = getApiClient();
        if (!client) return false;

        // Check if workspace has agents
        const agentsInWorkspace = get().agents.filter((a) => a.workspaceId === workspaceId);
        if (agentsInWorkspace.length > 0) {
          toast.error(
            "Cannot delete workspace",
            `This workspace has ${agentsInWorkspace.length} agent(s). Delete or move them first.`
          );
          return false;
        }

        set({ workspaceLoading: true });

        try {
          await client.request(
            "deleteWorkspace",
            { workspaceId },
            NO_CHANNEL
          );

          set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
            selectedWorkspaceId: state.selectedWorkspaceId === workspaceId 
              ? null 
              : state.selectedWorkspaceId,
            workspaceLoading: false,
          }));

          toast.success("Workspace deleted", "Workspace has been removed");
          return true;
        } catch (error) {
          console.error("[AgentStore] Failed to delete workspace:", error);
          set({ workspaceLoading: false });
          toast.error(
            "Failed to delete workspace",
            error instanceof Error ? error.message : "Unknown error"
          );
          return false;
        }
      },

      // Set selected workspace
      setSelectedWorkspace: (workspaceId: string | null): void => {
        set({ selectedWorkspaceId: workspaceId });
      },

      // List knowledge bases
      listKnowledgeBases: async (workspaceId?: string): Promise<void> => {
        const client = getApiClient();
        if (!client) return;

        try {
          const data = await client.request<{ knowledgeBases: KnowledgeBase[] }>(
            "listKnowledgeBases",
            workspaceId ? { workspaceId } : {},
            NO_CHANNEL
          );

          if (data && Array.isArray(data.knowledgeBases)) {
            set({ knowledgeBases: data.knowledgeBases });
          } else if (data && Array.isArray(data)) {
            set({ knowledgeBases: data as unknown as KnowledgeBase[] });
          }
        } catch (error) {
          console.error("Failed to list knowledge bases:", error);
        }
      },

      // Sync from Gradient AI
      syncFromGradient: async (params?: SyncFromGradientParams): Promise<SyncFromGradientResponse | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Sync failed", "No active connection");
          return null;
        }

        set({ syncLoading: true });

        try {
          const data = await client.request<SyncFromGradientResponse>(
            "syncFromGradient",
            {
              syncWorkspaces: params?.syncWorkspaces ?? true,
              syncAgents: params?.syncAgents ?? true,
            },
            NO_CHANNEL
          );

          const result = data?.result || data;
          
          // Update local state with synced data
          set({ lastSyncTime: Date.now(), syncLoading: false });

          // Refresh agents and workspaces lists
          await Promise.all([
            get().listAgents(),
            get().listWorkspaces(),
          ]);

          const workspacesSynced = result?.workspaces?.synced || 0;
          const agentsSynced = result?.agents?.synced || 0;
          
          toast.success(
            "Sync complete",
            `Synced ${workspacesSynced} workspaces and ${agentsSynced} agents from Gradient AI`
          );

          return {
            success: true,
            message: data?.message || "Sync completed",
            result: result as SyncFromGradientResponse["result"],
          };
        } catch (error) {
          console.error("[AgentStore] Failed to sync from Gradient:", error);
          set({ syncLoading: false });
          toast.error(
            "Sync failed",
            error instanceof Error ? error.message : "Failed to sync from Gradient AI"
          );
          return null;
        }
      },

      // ========================================================================
      // Task Actions
      // ========================================================================

      // List tasks
      listTasks: async (params?: ListTasksRequest): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          set({ tasksError: "No active connection", tasksLoading: false });
          return;
        }

        set({ tasksLoading: true, tasksError: null });

        try {
          const data = await client.request<ListTasksResponse>(
            "listTasks",
            params || {},
            NO_CHANNEL
          );

          if (data && Array.isArray(data.tasks)) {
            set({
              tasks: data.tasks,
              tasksLoading: false,
              tasksError: null,
            });
          } else if (data && Array.isArray(data)) {
            set({
              tasks: data as unknown as Task[],
              tasksLoading: false,
              tasksError: null,
            });
          } else {
            set({
              tasks: [],
              tasksLoading: false,
              tasksError: null,
            });
          }
        } catch (error) {
          console.error("[AgentStore] Failed to list tasks:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch tasks";
          set({
            tasksError: errorMessage,
            tasksLoading: false,
          });
          toast.error("Failed to load tasks", errorMessage);
        }
      },

      // Get single task
      getTask: async (taskId: string): Promise<Task | null> => {
        const client = getApiClient();
        if (!client) return null;

        try {
          const data = await client.request<TaskResponse>(
            "getTask",
            { taskId },
            NO_CHANNEL
          );

          const task = data?.task || data as unknown as Task;
          return task;
        } catch (error) {
          console.error("[AgentStore] Failed to get task:", error);
          toast.error(
            "Failed to load task",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Create task
      createTask: async (request: CreateTaskRequest): Promise<Task | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ tasksLoading: true });

        try {
          const data = await client.request<TaskResponse>(
            "createTask",
            request,
            NO_CHANNEL
          );

          const task = data?.task || data as unknown as Task;

          // Add to tasks list
          set((state) => ({
            tasks: [task, ...state.tasks],
            selectedTask: task,
            tasksLoading: false,
          }));

          toast.success("Task created", `${task.name} is ready`);
          return task;
        } catch (error) {
          console.error("[AgentStore] Failed to create task:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
          toast.error("Failed to create task", errorMessage);
          set({ tasksLoading: false });
          return null;
        }
      },

      // Update task
      updateTask: async (request: UpdateTaskRequest): Promise<Task | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ tasksLoading: true });

        try {
          const data = await client.request<TaskResponse>(
            "updateTask",
            request,
            NO_CHANNEL
          );

          const task = data?.task || data as unknown as Task;

          // Update tasks list
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === task.id ? task : t
            ),
            selectedTask: state.selectedTask?.id === task.id
              ? task
              : state.selectedTask,
            tasksLoading: false,
          }));

          toast.success("Task updated", `${task.name} has been updated`);
          return task;
        } catch (error) {
          console.error("[AgentStore] Failed to update task:", error);
          toast.error(
            "Failed to update task",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ tasksLoading: false });
          return null;
        }
      },

      // Delete task
      deleteTask: async (taskId: string): Promise<boolean> => {
        const client = getApiClient();
        if (!client) return false;

        set({ tasksLoading: true });

        try {
          await client.request<DeleteTaskResponse>(
            "deleteTask",
            { taskId },
            NO_CHANNEL
          );

          // Remove from tasks list
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
            selectedTask: state.selectedTask?.id === taskId
              ? null
              : state.selectedTask,
            tasksLoading: false,
          }));

          toast.success("Task deleted", "Task has been removed");
          return true;
        } catch (error) {
          console.error("[AgentStore] Failed to delete task:", error);
          toast.error(
            "Failed to delete task",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ tasksLoading: false });
          return false;
        }
      },

      // Execute task
      executeTask: async (request: ExecuteTaskRequest): Promise<ExecuteTaskResponse | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ taskExecuting: true });

        try {
          const data = await client.request<ExecuteTaskResponse>(
            "executeTask",
            request,
            NO_CHANNEL
          );

          set({ taskExecuting: false });

          if (data.status === "completed") {
            toast.success("Task executed", `Completed in ${data.duration}ms`);
          } else {
            toast.error("Task failed", data.error || "Execution failed");
          }

          // Refresh task to get updated status
          await get().listTasks({ agentId: get().selectedAgent?.id });

          return data;
        } catch (error) {
          console.error("[AgentStore] Failed to execute task:", error);
          toast.error(
            "Failed to execute task",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ taskExecuting: false });
          return null;
        }
      },

      // Approve task
      approveTask: async (request: ApproveTaskRequest): Promise<ApproveTaskResponse | null> => {
        const client = getApiClient();
        if (!client) return null;

        try {
          const data = await client.request<ApproveTaskResponse>(
            "approveTask",
            request,
            NO_CHANNEL
          );

          // Update task status in list
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === request.taskId
                ? { ...t, status: data.newStatus as Task["status"] }
                : t
            ),
          }));

          toast.success(
            request.approved ? "Task approved" : "Task rejected",
            request.reason || (request.approved ? "Task will proceed" : "Task has been rejected")
          );

          return data;
        } catch (error) {
          console.error("[AgentStore] Failed to approve task:", error);
          toast.error(
            "Failed to process approval",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Pause task
      pauseTask: async (taskId: string): Promise<PauseTaskResponse | null> => {
        const client = getApiClient();
        if (!client) return null;

        try {
          const data = await client.request<PauseTaskResponse>(
            "pauseTask",
            { taskId },
            NO_CHANNEL
          );

          // Update task status in list
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, status: "cancelled" as const } : t
            ),
          }));

          toast.success("Task paused", "Task has been paused");
          return data;
        } catch (error) {
          console.error("[AgentStore] Failed to pause task:", error);
          toast.error(
            "Failed to pause task",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Resume task
      resumeTask: async (taskId: string): Promise<ResumeTaskResponse | null> => {
        const client = getApiClient();
        if (!client) return null;

        try {
          const data = await client.request<ResumeTaskResponse>(
            "resumeTask",
            { taskId },
            NO_CHANNEL
          );

          // Update task status in list
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, status: data.status as Task["status"] } : t
            ),
          }));

          toast.success("Task resumed", "Task has been resumed");
          return data;
        } catch (error) {
          console.error("[AgentStore] Failed to resume task:", error);
          toast.error(
            "Failed to resume task",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },

      // Get task history
      getTaskHistory: async (request: TaskHistoryRequest): Promise<void> => {
        const client = getApiClient();
        if (!client) return;

        try {
          const data = await client.request<TaskHistoryResponse>(
            "getTaskHistory",
            request,
            NO_CHANNEL
          );

          set({ taskHistory: data.history || [] });
        } catch (error) {
          console.error("[AgentStore] Failed to get task history:", error);
          toast.error(
            "Failed to load task history",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      },

      // Set selected task
      setSelectedTask: (task: Task | null): void => {
        set({ selectedTask: task });
      },

      // Clear task history
      clearTaskHistory: (): void => {
        set({ taskHistory: [] });
      },

      // ========================================================================
      // Conversation History Actions
      // ========================================================================

      // Get full conversation by ID
      getConversation: async (params: GetConversationParams): Promise<Conversation | null> => {
        const client = getApiClient();
        if (!client) return null;

        set({ conversationLoading: true });

        try {
          const data = await client.request<GetConversationResponse>(
            "getConversation",
            params,
            NO_CHANNEL
          );

          if (data?.success && data.conversation) {
            // Restore messages to conversation map
            const conversations = new Map(get().conversations);
            conversations.set(data.conversation.agentId, data.conversation.messages);
            
            set({
              conversations,
              currentConversationId: data.conversation.id,
              conversationLoading: false,
            });

            // Save conversationId to localStorage
            saveConversationId(data.conversation.agentId, data.conversation.id);

            return data.conversation;
          }

          set({ conversationLoading: false });
          return null;
        } catch (error) {
          console.error("[AgentStore] Failed to get conversation:", error);
          toast.error(
            "Failed to load conversation",
            error instanceof Error ? error.message : "Unknown error"
          );
          set({ conversationLoading: false });
          return null;
        }
      },

      // List all conversations
      listConversations: async (params?: ListConversationsParams): Promise<void> => {
        const client = getApiClient();
        if (!client) return;

        set({ conversationLoading: true });

        try {
          const data = await client.request<ListConversationsResponse>(
            "listConversations",
            params || {},
            NO_CHANNEL
          );

          if (data?.success && Array.isArray(data.conversations)) {
            set({
              conversationList: data.conversations,
              conversationLoading: false,
            });
          } else {
            set({
              conversationList: [],
              conversationLoading: false,
            });
          }
        } catch (error) {
          console.error("[AgentStore] Failed to list conversations:", error);
          set({
            conversationList: [],
            conversationLoading: false,
          });
        }
      },

      // Load conversation for agent (from localStorage or latest)
      loadConversationForAgent: async (agentId: string): Promise<void> => {
        // Try to load saved conversationId from localStorage (per guide)
        const savedConversationId = loadConversationId(agentId);
        
        if (savedConversationId) {
          const conversation = await get().getConversation({ conversationId: savedConversationId });
          if (conversation) {
            // Successfully loaded - conversation is already restored
            return;
          }
          // Conversation not found - remove invalid conversationId from localStorage
          removeConversationId(agentId);
        }

        // If no saved conversation or failed to load, try to get latest conversation
        await get().listConversations({ agentId, limit: 1 });
        const latestConversation = get().conversationList[0];
        
        if (latestConversation) {
          await get().getConversation({ conversationId: latestConversation.id });
        }
      },

      // ========================================================================
      // UI Actions
      // ========================================================================

      setSelectedAgent: (agent: Agent | null): void => {
        set({ selectedAgent: agent });
        
        // Load conversation for selected agent
        if (agent) {
          get().loadConversationForAgent(agent.id);
        }
      },

      clearConversation: (agentId: string): void => {
        const conversations = new Map(get().conversations);
        conversations.delete(agentId);
        removeConversationId(agentId);
        set({ conversations, currentConversationId: null });
      },

      clearError: (): void => {
        set({ agentsError: null, chatError: null, tasksError: null });
      },
    }),
    {
      name: "Agent Control Store",
    }
  )
);

/**
 * Selector hooks
 */
export const useAgents = () => useAgentStore((state) => state.agents);
export const useSelectedAgent = () => useAgentStore((state) => state.selectedAgent);
export const useWorkspaces = () => useAgentStore((state) => state.workspaces);
export const useSelectedWorkspaceId = () => useAgentStore((state) => state.selectedWorkspaceId);
export const useAgentsLoading = () => useAgentStore((state) => state.agentsLoading);
export const useAgentsError = () => useAgentStore((state) => state.agentsError);
export const useChatLoading = () => useAgentStore((state) => state.chatLoading);
export const useSyncLoading = () => useAgentStore((state) => state.syncLoading);
export const useWorkspaceLoading = () => useAgentStore((state) => state.workspaceLoading);
export const useLastSyncTime = () => useAgentStore((state) => state.lastSyncTime);
export const useConversation = (agentId: string) => 
  useAgentStore((state) => state.conversations.get(agentId) || []);
export const useConversationList = () => useAgentStore((state) => state.conversationList);
export const useCurrentConversationId = () => useAgentStore((state) => state.currentConversationId);
export const useConversationLoading = () => useAgentStore((state) => state.conversationLoading);

// Task selectors
export const useTasks = () => useAgentStore((state) => state.tasks);
export const useSelectedTask = () => useAgentStore((state) => state.selectedTask);
export const useTaskHistory = () => useAgentStore((state) => state.taskHistory);
export const useTasksLoading = () => useAgentStore((state) => state.tasksLoading);
export const useTaskExecuting = () => useAgentStore((state) => state.taskExecuting);
export const useTasksError = () => useAgentStore((state) => state.tasksError);

// Account linking selector
export const useAccountLinking = () => useAgentStore((state) => state.accountLinking);
