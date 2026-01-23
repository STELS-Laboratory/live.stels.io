/**
 * Agent Control - Main Component
 * Orchestrates the agent management interface
 */

import { useCallback, useEffect, useState, useMemo } from "react";
import Split from "react-split";
import { Bot, Cpu } from "lucide-react";
import { useAgentStore } from "./store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useMobile } from "@/hooks/use-mobile";
import { navigateTo } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer-access-request";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ListTodo } from "lucide-react";
import {
  AgentListPanel,
  AgentChatPanel,
  CreateAgentDialog,
  EditAgentDialog,
  DeleteAgentDialog,
  MoveAgentDialog,
  WorkspaceTabs,
  CreateWorkspaceDialog,
  EditWorkspaceDialog,
  DeleteWorkspaceDialog,
  UNASSIGNED_WORKSPACE_ID,
} from "./components";
import {
  TaskListPanel,
  CreateTaskDialog,
  EditTaskDialog,
  TaskHistoryPanel,
} from "./components/tasks";
import type { Agent, AgentCreateRequest, AgentUpdateRequest, AgentStatus, FilterOptions, Workspace, WorkspaceUpdateRequest, Task, CreateTaskRequest, UpdateTaskRequest } from "./types";

const SPLIT_SIZES = [30, 70];
const SPLIT_MIN_SIZES = [280, 400];

export function AgentControl() {
  const mobile = useMobile();
  const { connectionSession } = useAuthStore();
  
  // Store state
  const {
    agents,
    selectedAgent,
    workspaces,
    selectedWorkspaceId,
    conversations,
    agentsLoading,
    agentLoading,
    chatLoading,
    chatError,
    workspaceLoading,
    tasksLoading,
    listAgents,
    listWorkspaces,
    createAgent,
    updateAgent,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setSelectedWorkspace,
    deleteAgent,
    chatWithAgent,
    setSelectedAgent,
    clearConversation,
    syncFromGradient,
    syncLoading,
    moveAgentToWorkspace,
    // Task actions
    createTask,
    updateTask,
  } = useAgentStore();

  // Local state
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    domain: null,
    status: null,
    workspaceId: null,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditAgentDialog, setShowEditAgentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = useState(false);
  const [showEditWorkspaceDialog, setShowEditWorkspaceDialog] = useState(false);
  const [showDeleteWorkspaceDialog, setShowDeleteWorkspaceDialog] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [showDeveloperAccessDialog, setShowDeveloperAccessDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [agentToMove, setAgentToMove] = useState<Agent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Task state
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [showTaskHistoryPanel, setShowTaskHistoryPanel] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskForHistory, setTaskForHistory] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "tasks">("chat");

  // Get messages for selected agent
  const currentMessages = selectedAgent
    ? conversations.get(selectedAgent.id) || []
    : [];

  // Create set of valid workspace IDs for filtering
  const validWorkspaceIds = useMemo(() => {
    return new Set(workspaces.map((w) => w.id));
  }, [workspaces]);

  // Filter agents by selected workspace
  const filteredAgentsByWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return agents;
    
    // Handle "Unassigned" tab - show agents with non-existent workspace IDs
    if (selectedWorkspaceId === UNASSIGNED_WORKSPACE_ID) {
      return agents.filter((agent) => !validWorkspaceIds.has(agent.workspaceId));
    }
    
    return agents.filter((agent) => agent.workspaceId === selectedWorkspaceId);
  }, [agents, selectedWorkspaceId, validWorkspaceIds]);

  // Get agent count for workspace to delete
  const workspaceToDeleteAgentCount = useMemo(() => {
    if (!workspaceToDelete) return 0;
    return agents.filter((a) => a.workspaceId === workspaceToDelete.id).length;
  }, [agents, workspaceToDelete]);

  // Check developer access
  useEffect(() => {
    if (connectionSession) {
      const isDeveloper = connectionSession.developer || false;
      if (!isDeveloper) {
        setShowDeveloperAccessDialog(true);
        setLoading(false);
      }
    }
  }, [connectionSession]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!connectionSession?.developer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([listAgents(), listWorkspaces()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [connectionSession?.developer, listAgents, listWorkspaces]);

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleSelectAgent = useCallback(
    (agent: Agent) => {
      setSelectedAgent(agent);
    },
    [setSelectedAgent]
  );

  const handleRefresh = useCallback(async () => {
    await listAgents();
  }, [listAgents]);

  const handleSync = useCallback(async () => {
    await syncFromGradient({ syncWorkspaces: true, syncAgents: true });
  }, [syncFromGradient]);

  const handleCreateAgent = useCallback(
    async (request: AgentCreateRequest) => {
      setIsCreating(true);
      try {
        await createAgent(request);
      } finally {
        setIsCreating(false);
      }
    },
    [createAgent]
  );

  const handleDeleteAgent = useCallback(async () => {
    if (!selectedAgent) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteAgent(selectedAgent.id);
      if (success) {
        setShowDeleteDialog(false);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [selectedAgent, deleteAgent]);

  const handleSendMessage = useCallback(
    async (message: string, stream: boolean = false) => {
      if (!selectedAgent) return;
      
      await chatWithAgent({
        agentId: selectedAgent.id,
        message,
        stream,
        onChunk: stream ? (chunk: string) => {
          // Streaming chunks are handled in the store
          console.log("[Chat] Chunk received:", chunk.length, "chars");
        } : undefined,
      });
    },
    [selectedAgent, chatWithAgent]
  );

  const handleClearConversation = useCallback(() => {
    if (selectedAgent) {
      clearConversation(selectedAgent.id);
    }
  }, [selectedAgent, clearConversation]);

  const handleEditAgent = useCallback(() => {
    if (selectedAgent) {
      setShowEditAgentDialog(true);
    }
  }, [selectedAgent]);

  const handleUpdateAgent = useCallback(
    async (request: AgentUpdateRequest) => {
      setIsEditing(true);
      try {
        await updateAgent(request);
      } finally {
        setIsEditing(false);
      }
    },
    [updateAgent]
  );

  const handleToggleStatus = useCallback(
    async (agentId: string, newStatus: AgentStatus) => {
      await updateAgent({ agentId, status: newStatus });
    },
    [updateAgent]
  );

  const handleMoveAgent = useCallback((agent: Agent) => {
    setAgentToMove(agent);
    setShowMoveDialog(true);
  }, []);

  const handleMoveAgentToWorkspace = useCallback(
    async (agentId: string, workspaceId: string) => {
      await moveAgentToWorkspace({ agentId, workspaceId });
    },
    [moveAgentToWorkspace]
  );

  // Workspace handlers
  const handleSelectWorkspace = useCallback(
    (workspaceId: string | null) => {
      setSelectedWorkspace(workspaceId);
    },
    [setSelectedWorkspace]
  );

  const handleCreateWorkspaceClick = useCallback(() => {
    setShowCreateWorkspaceDialog(true);
  }, []);

  const handleCreateWorkspace = useCallback(
    async (name: string, description?: string) => {
      await createWorkspace(name, description);
    },
    [createWorkspace]
  );

  const handleEditWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaceToEdit(workspace);
    setShowEditWorkspaceDialog(true);
  }, []);

  const handleDeleteWorkspaceClick = useCallback((workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteWorkspaceDialog(true);
  }, []);

  const handleUpdateWorkspace = useCallback(
    async (request: WorkspaceUpdateRequest) => {
      await updateWorkspace(request);
      setShowEditWorkspaceDialog(false);
      setWorkspaceToEdit(null);
    },
    [updateWorkspace]
  );

  const handleConfirmDeleteWorkspace = useCallback(async () => {
    if (!workspaceToDelete) return;
    
    const success = await deleteWorkspace(workspaceToDelete.id);
    if (success) {
      setShowDeleteWorkspaceDialog(false);
      setWorkspaceToDelete(null);
    }
  }, [workspaceToDelete, deleteWorkspace]);

  const handleCloseDeveloperAccessDialog = useCallback(
    (open: boolean) => {
      setShowDeveloperAccessDialog(open);
      if (!open && !connectionSession?.developer) {
        navigateTo("welcome");
      }
    },
    [connectionSession?.developer]
  );

  // Task handlers
  const handleCreateTask = useCallback(
    async (request: CreateTaskRequest) => {
      setIsCreatingTask(true);
      try {
        await createTask(request);
      } finally {
        setIsCreatingTask(false);
      }
    },
    [createTask]
  );

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setShowEditTaskDialog(true);
  }, []);

  const handleUpdateTask = useCallback(
    async (request: UpdateTaskRequest) => {
      setIsEditingTask(true);
      try {
        await updateTask(request);
        setShowEditTaskDialog(false);
        setTaskToEdit(null);
      } finally {
        setIsEditingTask(false);
      }
    },
    [updateTask]
  );

  const handleViewTaskHistory = useCallback((task: Task) => {
    setTaskForHistory(task);
    setShowTaskHistoryPanel(true);
  }, []);

  // Mobile view
  if (mobile) {
    return (
      <div className="h-full bg-gradient-to-br from-background via-muted/10 to-background p-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-4 mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-primary/10 rounded animate-pulse" />
            <div className="relative w-16 h-16 bg-card rounded flex items-center justify-center border border-primary/20 shadow-lg">
              <Bot className="w-8 h-8 text-primary transition-transform duration-300" />
            </div>
          </div>
          <h2 className="text-primary font-mono text-lg font-bold mb-2">
            AGENT CONTROL
          </h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Desktop interface required
          </p>
          <div className="p-4 bg-card/50 border border-border rounded text-left shadow-sm">
            <p className="text-xs text-muted-foreground mb-3 font-semibold">
              Agent Control requires a desktop display:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Multi-agent management dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Real-time chat interface</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Agent configuration and monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
            <Bot className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-primary font-mono text-sm font-bold">
            LOADING AGENT CONTROL
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return connectionSession ? (
    <div className="h-full flex flex-col">
      {/* Workspace Tabs */}
      <WorkspaceTabs
        workspaces={workspaces}
        agents={agents}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspaceClick}
        onEditWorkspace={handleEditWorkspace}
        onDeleteWorkspace={handleDeleteWorkspaceClick}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <Split
          className="flex h-full bg-background p-0 m-0"
          direction="horizontal"
          sizes={SPLIT_SIZES}
          minSize={SPLIT_MIN_SIZES}
          gutterSize={2}
        >
          {/* Left Panel - Agent List */}
          <AgentListPanel
            agents={filteredAgentsByWorkspace}
            selectedAgent={selectedAgent}
            workspaces={workspaces}
            loading={agentsLoading}
            syncLoading={syncLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSelectAgent={handleSelectAgent}
            onCreateAgent={() => setShowCreateDialog(true)}
            onRefresh={handleRefresh}
            onSync={handleSync}
            onToggleStatus={handleToggleStatus}
            onEditAgent={(agent) => {
              setSelectedAgent(agent);
              setShowEditAgentDialog(true);
            }}
            onMoveAgent={handleMoveAgent}
          />

          {/* Right Panel - Chat & Tasks */}
          <div className="flex flex-col h-full overflow-hidden">
            {selectedAgent ? (
              <Tabs
                value={rightPanelTab}
                onValueChange={(v) => setRightPanelTab(v as "chat" | "tasks")}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="border-b px-4 flex-shrink-0">
                  <TabsList className="h-10">
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                      <ListTodo className="h-4 w-4" />
                      Tasks
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <AgentChatPanel
                    agent={selectedAgent}
                    messages={currentMessages}
                    loading={chatLoading}
                    error={chatError}
                    onSendMessage={handleSendMessage}
                    onClearConversation={handleClearConversation}
                    onEditAgent={handleEditAgent}
                    onDeleteAgent={() => setShowDeleteDialog(true)}
                  />
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <TaskListPanel
                    agent={selectedAgent}
                    onCreateTask={() => setShowCreateTaskDialog(true)}
                    onEditTask={handleEditTask}
                    onViewHistory={handleViewTaskHistory}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <AgentChatPanel
                agent={null}
                messages={[]}
                loading={false}
                error={null}
                onSendMessage={handleSendMessage}
                onClearConversation={handleClearConversation}
                onEditAgent={handleEditAgent}
                onDeleteAgent={() => setShowDeleteDialog(true)}
              />
            )}
          </div>
        </Split>
      </div>

      {/* Dialogs */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateAgent}
        onCreateWorkspace={createWorkspace}
        workspaces={workspaces}
        loading={isCreating}
      />

      <EditAgentDialog
        open={showEditAgentDialog}
        onOpenChange={setShowEditAgentDialog}
        agent={selectedAgent}
        onSubmit={handleUpdateAgent}
        loading={isEditing}
      />

      <DeleteAgentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        agent={selectedAgent}
        onConfirm={handleDeleteAgent}
        loading={isDeleting}
      />

      <MoveAgentDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        agent={agentToMove}
        workspaces={workspaces}
        loading={agentLoading}
        onMove={handleMoveAgentToWorkspace}
      />

      {/* Workspace Dialogs */}
      <CreateWorkspaceDialog
        open={showCreateWorkspaceDialog}
        onOpenChange={setShowCreateWorkspaceDialog}
        onSubmit={handleCreateWorkspace}
        loading={workspaceLoading}
      />

      <EditWorkspaceDialog
        open={showEditWorkspaceDialog}
        onOpenChange={(open) => {
          setShowEditWorkspaceDialog(open);
          if (!open) setWorkspaceToEdit(null);
        }}
        workspace={workspaceToEdit}
        onSubmit={handleUpdateWorkspace}
        loading={workspaceLoading}
      />

      <DeleteWorkspaceDialog
        open={showDeleteWorkspaceDialog}
        onOpenChange={(open) => {
          setShowDeleteWorkspaceDialog(open);
          if (!open) setWorkspaceToDelete(null);
        }}
        workspace={workspaceToDelete}
        agentCount={workspaceToDeleteAgentCount}
        onConfirm={handleConfirmDeleteWorkspace}
        loading={workspaceLoading}
      />

      <DeveloperAccessRequestDialog
        open={showDeveloperAccessDialog}
        onOpenChange={handleCloseDeveloperAccessDialog}
      />

      {/* Task Dialogs */}
      {selectedAgent && (
        <>
          <CreateTaskDialog
            open={showCreateTaskDialog}
            onOpenChange={setShowCreateTaskDialog}
            agent={selectedAgent}
            onSubmit={handleCreateTask}
            loading={isCreatingTask}
          />

          <EditTaskDialog
            open={showEditTaskDialog}
            onOpenChange={(open) => {
              setShowEditTaskDialog(open);
              if (!open) setTaskToEdit(null);
            }}
            task={taskToEdit}
            onSubmit={handleUpdateTask}
            loading={isEditingTask}
          />

          <TaskHistoryPanel
            open={showTaskHistoryPanel}
            onOpenChange={(open) => {
              setShowTaskHistoryPanel(open);
              if (!open) setTaskForHistory(null);
            }}
            task={taskForHistory}
          />
        </>
      )}
    </div>
  ) : (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 flex items-center justify-center mb-8 mx-auto relative">
          <div className="w-16 h-16 rounded flex items-center justify-center bg-muted">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-primary font-mono text-2xl font-bold mb-3">
          AUTHENTICATION REQUIRED
        </h2>

        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Authenticate with GitHub to access Agent Control and manage your AI
          agents
        </p>

        <div className="space-y-4">
          <div className="bg-card/10 border border-border rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="text-card-foreground font-mono text-sm font-bold">
                AI AGENTS
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Create and manage intelligent agents for various domains
            </p>
          </div>

          <div className="bg-card/10 border border-border rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-card-foreground font-mono text-sm font-bold">
                REAL-TIME CHAT
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Interactive conversations with your deployed agents
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigateTo("welcome")}
          className="mt-8 font-mono text-sm font-bold px-8 py-3"
        >
          <Bot className="w-4 h-4 mr-2" />
          AUTHENTICATE
        </Button>
      </div>
    </div>
  );
}
