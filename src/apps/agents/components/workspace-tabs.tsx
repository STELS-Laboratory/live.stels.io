/**
 * Workspace Tabs Component
 * Tabs for filtering agents by workspace with edit/delete options
 */

import { useMemo } from "react";
import {
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Workspace, Agent } from "../types";

// Special ID for unassigned agents (orphans referencing non-existent workspaces)
export const UNASSIGNED_WORKSPACE_ID = "__unassigned__";

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  agents: Agent[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (workspaceId: string | null) => void;
  onCreateWorkspace: () => void;
  onEditWorkspace: (workspace: Workspace) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
}

export function WorkspaceTabs({
  workspaces,
  agents,
  selectedWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
}: WorkspaceTabsProps) {
  // Create a set of valid workspace IDs for quick lookup
  const validWorkspaceIds = useMemo(() => {
    return new Set(workspaces.map((w) => w.id));
  }, [workspaces]);

  // Count agents per workspace, including unassigned
  const { agentCounts, unassignedCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let unassigned = 0;
    
    agents.forEach((agent) => {
      if (validWorkspaceIds.has(agent.workspaceId)) {
        counts[agent.workspaceId] = (counts[agent.workspaceId] || 0) + 1;
      } else {
        // Agent references non-existent workspace
        unassigned++;
      }
    });
    
    return { agentCounts: counts, unassignedCount: unassigned };
  }, [agents, validWorkspaceIds]);

  const totalAgents = agents.length;

  return (
    <div className="border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-1 p-2">
          {/* All Workspaces Tab */}
          <Button
            variant={selectedWorkspaceId === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelectWorkspace(null)}
            className={cn(
              "h-8 px-3 gap-2 flex-shrink-0",
              selectedWorkspaceId === null && "bg-secondary"
            )}
          >
            <Folder className="w-4 h-4" />
            <span>All</span>
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              {totalAgents}
            </Badge>
          </Button>

          {/* Workspace Tabs */}
          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspaceId === workspace.id;
            const agentCount = agentCounts[workspace.id] || 0;

            return (
              <div
                key={workspace.id}
                className={cn(
                  "group flex items-center gap-1 h-8 rounded-md transition-colors flex-shrink-0",
                  isSelected ? "bg-secondary" : "hover:bg-muted/50"
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectWorkspace(workspace.id)}
                  className={cn(
                    "h-8 px-3 gap-2 hover:bg-transparent",
                    isSelected && "hover:bg-transparent"
                  )}
                >
                  {isSelected ? (
                    <FolderOpen className="w-4 h-4 text-primary" />
                  ) : (
                    <Folder className="w-4 h-4" />
                  )}
                  <span className="max-w-[120px] truncate">{workspace.name}</span>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    {agentCount}
                  </Badge>
                </Button>

                {/* Workspace Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-1",
                        isSelected && "opacity-100"
                      )}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onEditWorkspace(workspace)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteWorkspace(workspace)}
                      className="text-destructive focus:text-destructive"
                      disabled={agentCount > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                      {agentCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {agentCount} agents
                        </span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}

          {/* Unassigned Tab - shown only if there are orphan agents */}
          {unassignedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedWorkspaceId === UNASSIGNED_WORKSPACE_ID ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onSelectWorkspace(UNASSIGNED_WORKSPACE_ID)}
                  className={cn(
                    "h-8 px-3 gap-2 flex-shrink-0 text-amber-600 dark:text-amber-500",
                    selectedWorkspaceId === UNASSIGNED_WORKSPACE_ID && "bg-amber-100 dark:bg-amber-900/30"
                  )}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Unassigned</span>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs border-amber-500/50">
                    {unassignedCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agents referencing non-existent workspaces</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Add Workspace Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateWorkspace}
            className="h-8 px-3 gap-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
