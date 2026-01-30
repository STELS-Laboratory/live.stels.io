/**
 * DeleteToolDialog component
 * Confirmation dialog for deleting an MCP tool, with optional force
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import type { ToolRaw } from "../types/tools.types";

export interface DeleteToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRaw | null;
  onConfirm: (toolId: string, force: boolean) => Promise<boolean>;
}

export function DeleteToolDialog({
  open,
  onOpenChange,
  tool,
  onConfirm,
}: DeleteToolDialogProps): React.ReactElement {
  const [force, setForce] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setForce(false);
      setSuccess(false);
      onOpenChange(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, onOpenChange]);

  const handleConfirm = async (): Promise<void> => {
    if (!tool) return;
    setError(null);
    setIsDeleting(true);
    try {
      const ok = await onConfirm(tool.sid, force);
      if (ok) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tool");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setForce(false);
      setError(null);
      setSuccess(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-500 mb-4 animate-in zoom-in duration-300" />
            <p className="text-sm font-semibold text-foreground">Deleted successfully!</p>
            <p className="text-xs text-muted-foreground mt-1">Closing...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete Tool
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {tool ? (
                  <>
                    Delete <strong className="font-mono text-foreground">{tool.name}</strong>? This
                    cannot be undone.
                    {tool.sid && (
                      <span className="block mt-1 text-xs font-mono text-muted-foreground">
                        ID: {tool.sid}
                      </span>
                    )}
                  </>
                ) : (
                  "Select a tool to delete."
                )}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">{error}</AlertDescription>
              </Alert>
            )}

            {tool && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="force-delete" className="text-sm cursor-pointer">
                  Force delete (unbind from agents)
                </Label>
                <Switch
                  id="force-delete"
                  checked={force}
                  onCheckedChange={setForce}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!tool || isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
