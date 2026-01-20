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
      lastSyncTime: null,
      
      agentsLoading: false,
      agentLoading: false,
      chatLoading: false,
      syncLoading: false,
      workspaceLoading: false,
      
      agentsError: null,
      chatError: null,

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

      // Chat with agent (supports streaming)
      chatWithAgent: async (request: ChatRequest): Promise<ChatResponse | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        if (!connectionSession) return null;

        set({ chatLoading: true, chatError: null });

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
        set({ conversations, currentConversationId: request.conversationId || null });

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
                  conversationId: request.conversationId,
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
                    const content = parsed.choices?.[0]?.delta?.content || 
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
            set({
              conversations: finalConversations,
              chatLoading: false,
            });

            return {
              message: fullContent,
              conversationId: request.conversationId || "",
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
              conversationId: request.conversationId,
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
          
          set({
            conversations: updatedConversations,
            currentConversationId: data.conversationId,
            chatLoading: false,
          });

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

      // UI actions
      setSelectedAgent: (agent: Agent | null): void => {
        set({ selectedAgent: agent });
      },

      clearConversation: (agentId: string): void => {
        const conversations = new Map(get().conversations);
        conversations.delete(agentId);
        set({ conversations, currentConversationId: null });
      },

      clearError: (): void => {
        set({ agentsError: null, chatError: null });
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
