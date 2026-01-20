/**
 * Move Agent Dialog Component
 * Allows moving an agent to a different workspace
 */

import { useState, useMemo } from "react";
import { FolderInput, ArrowRight, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Agent, Workspace } from "../types";

interface MoveAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  workspaces: Workspace[];
  loading?: boolean;
  onMove: (agentId: string, workspaceId: string) => Promise<void>;
}

export function MoveAgentDialog({
  open,
  onOpenChange,
  agent,
  workspaces,
  loading = false,
  onMove,
}: MoveAgentDialogProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  // Get current workspace name
  const currentWorkspace = useMemo(() => {
    if (!agent) return null;
    return workspaces.find((w) => w.id === agent.workspaceId);
  }, [agent, workspaces]);

  // Filter out current workspace from options
  const availableWorkspaces = useMemo(() => {
    if (!agent) return workspaces;
    return workspaces.filter((w) => w.id !== agent.workspaceId);
  }, [agent, workspaces]);

  // Get selected workspace details
  const targetWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === selectedWorkspaceId);
  }, [workspaces, selectedWorkspaceId]);

  const handleMove = async () => {
    if (!agent || !selectedWorkspaceId) return;
    await onMove(agent.id, selectedWorkspaceId);
    setSelectedWorkspaceId("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedWorkspaceId("");
    onOpenChange(false);
  };

  if (!agent) return null;

  const isOrphan = !currentWorkspace;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5" />
            Move Agent to Workspace
          </DialogTitle>
          <DialogDescription>
            Move "{agent.name}" to a different workspace for better organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Current Workspace
            </label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              {isOrphan ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-500">
                    Unassigned
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs border-amber-500/50">
                    Orphan
                  </Badge>
                </>
              ) : (
                <>
                  <span className="font-medium">{currentWorkspace?.name}</span>
                  {currentWorkspace?.description && (
                    <span className="text-muted-foreground text-sm truncate">
                      - {currentWorkspace.description}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Target Workspace Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Move to Workspace
            </label>
            <Select
              value={selectedWorkspaceId}
              onValueChange={setSelectedWorkspaceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target workspace..." />
              </SelectTrigger>
              <SelectContent>
                {availableWorkspaces.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No other workspaces available
                  </div>
                ) : (
                  availableWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex flex-col">
                        <span>{workspace.name}</span>
                        {workspace.description && (
                          <span className="text-xs text-muted-foreground">
                            {workspace.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Info about the move */}
          {targetWorkspace && (
            <Alert>
              <AlertDescription className="text-sm">
                Agent "{agent.name}" will be moved to "{targetWorkspace.name}".
                This will update the agent's workspace assignment in both the
                local system and Gradient AI (if connected).
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for orphan agents */}
          {isOrphan && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                This agent is currently unassigned (references a non-existent
                workspace). Moving it to a valid workspace will fix this issue.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedWorkspaceId || loading}
          >
            {loading ? "Moving..." : "Move Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
