/**
 * Stop All Workers Dialog Component
 * Professional confirmation and result display for emergency stop
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Power,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface StopAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<{ stopped: number; failed: number; total: number }>;
  activeWorkersCount: number;
}

/**
 * Stop All Workers Dialog Component
 */
export function StopAllDialog({
  open,
  onOpenChange,
  onConfirm,
  activeWorkersCount,
}: StopAllDialogProps): React.ReactElement {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<
    {
      stopped: number;
      failed: number;
      total: number;
    } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await onConfirm();
      setResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop workers",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = (): void => {
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  const showConfirmation = !result && !error;
  const showResult = result !== null;
  const showError = error !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "relative p-2 border",
                showError
                  ? "border-red-500/30 bg-red-500/10"
                  : showResult
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-orange-500/30 bg-orange-500/10",
              )}
            >
              <div
                className={cn(
                  "absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l",
                  showError
                    ? "border-red-500/50"
                    : showResult
                    ? "border-green-500/50"
                    : "border-orange-500/50",
                )}
              />
              {showError
                ? <AlertCircle className="h-5 w-5 text-red-500" />
                : showResult
                ? <CheckCircle className="h-5 w-5 text-green-500" />
                : <Power className="h-5 w-5 text-orange-500" />}
            </div>
            <span className="text-foreground">
              {showResult
                ? "Stop Complete"
                : showError
                ? "Stop Failed"
                : "Emergency Stop"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {showConfirmation &&
              "This will immediately stop all active workers"}
            {showResult && "All workers have been processed"}
            {showError && "An error occurred during the operation"}
          </DialogDescription>
        </DialogHeader>

        {/* Confirmation State */}
        {showConfirmation && (
          <div className="space-y-4 py-4">
            <Alert
              variant="destructive"
              className="border-orange-500/30 bg-orange-500/10"
            >
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-400">
                This will stop <strong>{activeWorkersCount}</strong>{" "}
                active worker{activeWorkersCount !== 1 ? "s" : ""}.
              </AlertDescription>
            </Alert>

            <div className="relative p-4 bg-muted border border-border rounded">
              <div className="space-y-2 text-sm">
                <p className="text-card-foreground font-medium">
                  Workers will be stopped by:
                </p>
                <ul className="text-muted-foreground text-xs space-y-1 pl-4">
                  <li>
                    • Setting{" "}
                    <code className="text-amber-400">active: false</code>
                  </li>
                  <li>• Execution will halt immediately</li>
                  <li>• You can restart them individually later</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Result State */}
        {showResult && result && (
          <div className="space-y-4 py-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative p-3 bg-muted/30 border border-border">
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-border" />
                <div className="text-xs text-muted-foreground mb-1">TOTAL</div>
                <div className="text-2xl font-bold text-blue-400">
                  {result.total}
                </div>
              </div>

              <div className="relative p-3 bg-green-500/5 border border-green-500/30">
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-green-500/50" />
                <div className="text-xs text-green-400 mb-1">STOPPED</div>
                <div className="text-2xl font-bold text-green-400">
                  {result.stopped}
                </div>
              </div>

              <div className="relative p-3 bg-red-500/5 border border-red-500/30">
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-red-500/50" />
                <div className="text-xs text-red-400 mb-1">FAILED</div>
                <div className="text-2xl font-bold text-red-400">
                  {result.failed}
                </div>
              </div>
            </div>

            {/* Success/Warning Message */}
            {result.failed === 0
              ? (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-400">
                    All {result.stopped} worker{result.stopped !== 1 ? "s" : ""}
                    {" "}
                    stopped successfully
                  </AlertDescription>
                </Alert>
              )
              : (
                <Alert className="border-orange-500/30 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-400">
                    Stopped {result.stopped}{" "}
                    worker{result.stopped !== 1 ? "s" : ""}, {result.failed}
                    {" "}
                    failed
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}

        {/* Error State */}
        {showError && (
          <div className="py-4">
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {showConfirmation
            ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing || activeWorkersCount === 0}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold"
                >
                  {isProcessing
                    ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Stopping...
                      </>
                    )
                    : (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop All Workers
                      </>
                    )}
                </Button>
              </>
            )
            : (
              <Button
                onClick={handleClose}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
