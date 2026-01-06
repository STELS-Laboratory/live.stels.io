/**
 * Confirmation Dialog for Toggle Worker Status
 * Simple confirmation before starting/stopping a worker
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Play, PowerOff } from "lucide-react";
import type { Worker } from "../store.ts";

interface ConfirmToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  onConfirm: () => Promise<void>;
  isToggling: boolean;
}

/**
 * Confirmation Dialog for Toggle Worker Status
 */
export function ConfirmToggleDialog({
  open,
  onOpenChange,
  worker,
  onConfirm,
  isToggling,
}: ConfirmToggleDialogProps): React.ReactElement {
  if (!worker || !worker.value || !worker.value.raw) return <></>;

  const isActive = worker.value.raw.active;

  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isActive
              ? <PowerOff className="h-5 w-5 text-red-500" />
              : <Play className="h-5 w-5 text-green-500" />}
            <span className="text-foreground">
              {isActive ? "Stop Worker?" : "Start Worker?"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isActive
              ? "This will immediately stop the worker execution"
              : "This will start the worker execution"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert
            className={isActive
              ? "border-orange-500/30 bg-orange-500/10"
              : "border-blue-500/30 bg-blue-500/10"}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                isActive ? "text-orange-500" : "text-blue-500"
              }`}
            />
            <AlertDescription
              className={isActive
                ? "text-orange-700 dark:text-orange-400"
                : "text-blue-700 dark:text-blue-400"}
            >
              <strong>Worker ID:</strong> {worker?.value?.raw?.sid || "Unknown"}
              <br />
              {isActive
                ? "The worker will stop executing immediately. You can restart it later."
                : "The worker will begin executing according to its configuration."}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isToggling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isToggling}
            className={isActive
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"}
          >
            {isToggling
              ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  {isActive ? "Stopping..." : "Starting..."}
                </>
              )
              : (
                <>
                  {isActive
                    ? <PowerOff className="w-4 h-4 mr-2" />
                    : <Play className="w-4 h-4 mr-2" />}
                  {isActive ? "Stop Worker" : "Start Worker"}
                </>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
