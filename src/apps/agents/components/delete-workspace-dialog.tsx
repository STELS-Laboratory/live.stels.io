/**
 * Delete Workspace Dialog Component
 * Confirmation dialog for deleting a workspace
 */

import { Loader2, AlertTriangle, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Workspace } from "../types";

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  agentCount: number;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  agentCount,
  onConfirm,
  loading = false,
}: DeleteWorkspaceDialogProps) {
  if (!workspace) return null;

  const canDelete = agentCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Workspace
          </DialogTitle>
          <DialogDescription>
            {canDelete
              ? "This action cannot be undone. The workspace will be permanently deleted."
              : "This workspace cannot be deleted because it contains agents."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
              <Folder className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {workspace.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {agentCount} agent{agentCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {!canDelete && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Please delete or move all agents from this workspace before deleting it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading || !canDelete}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
