/**
 * Agent List Panel Component
 * Displays list of agents with filtering and selection
 */

import { useCallback, useMemo } from "react";
import {
  Bot,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  Globe,
  Cpu,
  MessageSquare,
  Plane,
  Share2,
  CloudDownload,
  Wrench,
  Play,
  Pause,
  Pencil,
  FolderInput,
  Folder,
  Rocket,
  CloudOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { Agent, AgentDomain, AgentStatus, FilterOptions, Workspace } from "../types";

interface AgentListPanelProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  workspaces: Workspace[];
  loading: boolean;
  syncLoading: boolean;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onSelectAgent: (agent: Agent) => void;
  onCreateAgent: () => void;
  onRefresh: () => void;
  onSync: () => void;
  onToggleStatus?: (agentId: string, newStatus: AgentStatus) => void;
  onEditAgent?: (agent: Agent) => void;
  onMoveAgent?: (agent: Agent) => void;
}

const DOMAIN_ICONS: Record<AgentDomain, typeof Bot> = {
  trading: Sparkles,
  iot: Cpu,
  drone: Plane,
  social: Share2,
  devops: Wrench,
  general: Globe,
};

const DOMAIN_COLORS: Record<AgentDomain, string> = {
  trading: "text-green-500",
  iot: "text-blue-500",
  drone: "text-purple-500",
  social: "text-pink-500",
  devops: "text-orange-500",
  general: "text-gray-500",
};

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: "bg-green-500",
  paused: "bg-orange-500",
  error: "bg-red-500",
};

function getStatusLabel(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    active: "Active",
    paused: "Paused",
    error: "Error",
  };
  return labels[status] || status;
}

export function AgentListPanel({
  agents,
  selectedAgent,
  workspaces,
  loading,
  syncLoading,
  filters,
  onFilterChange,
  onSelectAgent,
  onCreateAgent,
  onRefresh,
  onSync,
  onToggleStatus,
  onEditAgent,
  onMoveAgent,
}: AgentListPanelProps) {
  const accounts = useAccountsStore((s) => s.accounts);

  const workspaceNames = useMemo(() => {
    const map = new Map<string, string>();
    workspaces.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [workspaces]);
  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const nameMatch = agent.name?.toLowerCase().includes(search);
        const promptMatch = agent.systemPrompt?.toLowerCase().includes(search);
        const descMatch = agent.description?.toLowerCase().includes(search);
        if (!nameMatch && !promptMatch && !descMatch) {
          return false;
        }
      }

      // Domain filter
      if (filters.domain && agent.domain !== filters.domain) {
        return false;
      }

      // Status filter
      if (filters.status && agent.status !== filters.status) {
        return false;
      }

      // Workspace filter
      if (filters.workspaceId && agent.workspaceId !== filters.workspaceId) {
        return false;
      }

      return true;
    });
  }, [agents, filters]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ searchTerm: e.target.value });
    },
    [onFilterChange]
  );

  const handleDomainChange = useCallback(
    (value: string) => {
      onFilterChange({ domain: value === "all" ? null : (value as AgentDomain) });
    },
    [onFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFilterChange({ status: value === "all" ? null : (value as AgentStatus) });
    },
    [onFilterChange]
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">AI Agents</h2>
            <Badge variant="secondary" className="text-xs">
              {filteredAgents.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSync}
              disabled={syncLoading}
              className="h-8 w-8"
              title="Sync from Gradient AI"
            >
              <CloudDownload className={cn("w-4 h-4", syncLoading && "animate-pulse")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 w-8"
              title="Refresh list"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onCreateAgent}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-9 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={filters.domain || "all"}
            onValueChange={handleDomainChange}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="drone">Drone</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Loading agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bot className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">No agents found</p>
              <p className="text-xs">
                {agents.length === 0
                  ? "Create your first agent to get started"
                  : "Try adjusting your filters"}
              </p>
              {agents.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateAgent}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Agent
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAgents.map((agent) => {
                const DomainIcon = DOMAIN_ICONS[agent.domain] || Globe;
                const isSelected = selectedAgent?.id === agent.id;
                const canToggle = agent.status !== "error";

                return (
                  <div
                    key={agent.id}
                    className={cn(
                      "group w-full p-3 rounded-lg text-left transition-all",
                      "hover:bg-accent/50",
                      isSelected && "bg-accent border border-primary/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onSelectAgent(agent)}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          "bg-muted/50 hover:bg-muted transition-colors"
                        )}
                      >
                        <DomainIcon
                          className={cn("w-5 h-5", DOMAIN_COLORS[agent.domain])}
                        />
                      </button>

                      <button
                        onClick={() => onSelectAgent(agent)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground truncate">
                            {agent.name}
                          </span>
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              STATUS_COLORS[agent.status]
                            )}
                            title={getStatusLabel(agent.status)}
                          />
                          <Badge
                            variant={agent.status === "active" ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {getStatusLabel(agent.status)}
                          </Badge>
                          {/* Deployment Status Indicator */}
                          {agent.deploymentStatus && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn(
                                  "flex items-center",
                                  agent.deploymentStatus.isDeployed && "text-green-500",
                                  agent.deploymentStatus.isDeploying && "text-blue-500",
                                  agent.deploymentStatus.isFailed && "text-red-500",
                                  !agent.deploymentStatus.isDeployed && !agent.deploymentStatus.isDeploying && !agent.deploymentStatus.isFailed && "text-muted-foreground"
                                )}>
                                  {agent.deploymentStatus.isDeployed ? (
                                    <Rocket className="w-3.5 h-3.5" />
                                  ) : agent.deploymentStatus.isDeploying ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CloudOff className="w-3.5 h-3.5" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">
                                  {agent.deploymentStatus.isDeployed 
                                    ? "Deployed" 
                                    : agent.deploymentStatus.isDeploying 
                                    ? "Deploying..." 
                                    : agent.deploymentStatus.isFailed 
                                    ? "Failed" 
                                    : "Not Deployed"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {agent.deploymentStatus.statusMessage}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {agent.systemPrompt || agent.description || "No description"}
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {agent.domain}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 max-w-[100px] truncate flex items-center gap-1",
                              !workspaceNames.has(agent.workspaceId) && "border-amber-500/50 text-amber-600 dark:text-amber-500",
                              agent.workspaceContext && "border-green-500/50"
                            )}
                            title={
                              agent.workspaceContext 
                                ? `${agent.workspaceContext.workspaceName}${agent.workspaceContext.workspaceDescription ? ` - ${agent.workspaceContext.workspaceDescription}` : ""} (Context linked)`
                                : workspaceNames.get(agent.workspaceId) || agent.workspaceId
                            }
                          >
                            <Folder className={cn(
                              "w-3 h-3",
                              agent.workspaceContext && "text-green-600 dark:text-green-500"
                            )} />
                            {agent.workspaceContext?.workspaceName || workspaceNames.get(agent.workspaceId) || "Unassigned"}
                          </Badge>
                          {agent.model && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 max-w-[100px] truncate"
                            >
                              {agent.model.split("/").pop()}
                            </Badge>
                          )}
                          {(() => {
                            const ids =
                              agent.connectedAccounts?.map((c) => c.accountId) ??
                              agent.connectedAccountIds ??
                              [];
                            if (ids.length === 0) return null;
                            return (
                              <span className="flex items-center gap-1">
                                {ids.slice(0, 3).map((id) => {
                                  const acc = accounts.find(
                                    (a) => a.account.nid === id || a.id === id,
                                  );
                                  const ex = acc?.account.exchange ?? "gate";
                                  return (
                                    <img
                                      key={id}
                                      src={getExchangeIconPath(ex)}
                                      alt=""
                                      className="h-4 w-4 rounded object-contain"
                                      title={acc?.account.nid ?? id}
                                    />
                                  );
                                })}
                                {ids.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{ids.length - 3}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      </button>

                      {/* Agent Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onMoveAgent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveAgent(agent);
                            }}
                            title="Move to workspace"
                          >
                            <FolderInput className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {onEditAgent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAgent(agent);
                            }}
                            title="Edit agent"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {onToggleStatus && canToggle && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(
                                agent.id,
                                agent.status === "active" ? "paused" : "active"
                              );
                            }}
                            title={agent.status === "active" ? "Pause agent" : "Activate agent"}
                          >
                            {agent.status === "active" ? (
                              <Pause className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Play className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        )}
                        <MessageSquare className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
