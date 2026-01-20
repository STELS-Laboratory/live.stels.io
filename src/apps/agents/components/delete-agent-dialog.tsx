/**
 * Delete Agent Dialog Component
 * Confirmation dialog for deleting agents
 */

import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Agent } from "../types";

interface DeleteAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function DeleteAgentDialog({
  open,
  onOpenChange,
  agent,
  onConfirm,
  loading = false,
}: DeleteAgentDialogProps) {
  if (!agent) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Agent
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{agent.name}</strong>? This
            action cannot be undone. All conversation history with this agent
            will be permanently lost.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 my-2">
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{agent.name}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Domain:</span>
              <span className="font-medium capitalize">{agent.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{agent.status}</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
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
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agent
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
